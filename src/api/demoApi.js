// Demo backend — the entire server side of the applicant journey, offline.
//
// In demo mode (`VITE_APP_ENV=demo`) this axios adapter is installed on every
// API client, so the app runs the *same* HITL flow it runs against the real
// stack — intake → KYC → bank review → decision → accept/select → signature →
// disbursement — with no network at all. Nothing in the components or in
// ApplicationFlow branches on demo mode; only the transport is swapped.
//
// Two rules keep the two modes identical:
//   1. Every response mirrors the real service's wire shape (LoanIntakeResponse,
//      the orchestrator's accept/signature envelopes, LoanTermOptionSchema for
//      offer options, DisbursementReceipt).
//   2. Phase transitions are validated here the way the orchestrator's
//      PipelineService validates `pipeline_state_store` phases — a call made
//      out of order fails with the same 400 + `detail` the real one returns.
//
// The pipeline's *progress* (what the real orchestrator pushes over SSE) is
// driven by `services/pipelineSSE.js`, which advances the phases below as each
// stage lands. This module owns the state; that module owns the timeline.

// ── Tunables ────────────────────────────────────────────────────────────────
// Latency for ordinary request/response calls (submit, upload, accept).
const DEMO_NETWORK_DELAY_MS = 900;

// Each real processing phase — KYC, bank decisioning, counter-offer review,
// disbursement — takes visible time on the real stack (underwriting alone is
// allowed up to 300s). Demo mode gives every phase this long so the pipeline
// screen's stage transitions and progress bar behave as they do in production.
// Shared with pipelineSSE.js so the stream and this module stay in step.
export const DEMO_PHASE_DELAY_MS = 5000;

// Underwriting parameters. These mirror the shape of the real decisioning
// agent's affordability maths (FOIR-capped EMI, origination fee netted off the
// disbursement) so the numbers shown across the decision, signature and
// receipt screens are internally consistent — not three unrelated mocks.
const FOIR_PCT = 0.5; // share of monthly income available for all EMIs
const BASE_ANNUAL_RATE_PCT = 10.9;
const ORIGINATION_FEE_PCT = 0.01;
const MAX_TENURE_MONTHS = 84;
const MIN_LOAN_AMOUNT = 10000; // below this no offer is worth extending

// Pipeline phases — the same names PipelineService writes into the
// orchestrator's in-memory state store.
const Phase = {
  AWAITING_BANK_REVIEW: 'AWAITING_BANK_REVIEW',
  AWAITING_APPLICANT_RESPONSE: 'AWAITING_APPLICANT_RESPONSE',
  AWAITING_COUNTER_OFFER_SELECTION: 'AWAITING_COUNTER_OFFER_SELECTION',
  AWAITING_SIGNATURE: 'AWAITING_SIGNATURE',
  SIGNATURE_COMPLETE: 'SIGNATURE_COMPLETE',
};

// Mirrors the orchestrator's `pipeline_state_store` — in-memory, per-session,
// and (exactly like the real one) lost on reload.
const demoApplications = new Map();

// ── Helpers ─────────────────────────────────────────────────────────────────

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildResponse(config, data, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
    request: {},
  };
}

// Rejects the way axios rejects a real HTTP error, so callers reading
// `error.response.data.detail` behave identically in both modes.
function httpError(config, status, detail) {
  const error = new Error(`Demo API ${status}: ${detail}`);
  error.isAxiosError = true;
  error.config = config;
  error.response = {
    data: { detail },
    status,
    statusText: status === 400 ? 'Bad Request' : 'Error',
    headers: {},
    config,
  };
  return error;
}

function getRequestBody(data) {
  if (!data) {
    return {};
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  return data;
}

const round2 = (value) => Math.round(Number(value) * 100) / 100;
const roundToThousand = (value) => Math.max(1000, Math.round(Number(value) / 1000) * 1000);
// Amounts derived from an affordability ceiling round *down*, so tidying the
// figure can never push the resulting EMI back over that ceiling.
const floorToThousand = (value) => Math.max(1000, Math.floor(Number(value) / 1000) * 1000);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Same formula as the orchestrator's `calculate_emi`.
function calculateEmi(principal, annualRatePct, months) {
  if (months <= 0) return 0;
  const monthlyRate = annualRatePct / (12 * 100);
  if (monthlyRate === 0) return round2(principal / months);
  const factor = Math.pow(1 + monthlyRate, months);
  return round2((principal * monthlyRate * factor) / (factor - 1));
}

// Inverse of the above: the largest principal an applicant can carry at a
// given EMI ceiling. This is the "qualifying cap" the counter-offer options
// are built around.
function principalForEmi(emi, annualRatePct, months) {
  if (months <= 0 || emi <= 0) return 0;
  const monthlyRate = annualRatePct / (12 * 100);
  if (monthlyRate === 0) return round2(emi * months);
  const factor = Math.pow(1 + monthlyRate, months);
  return round2((emi * (factor - 1)) / (monthlyRate * factor));
}

// Mirrors PipelineService._extract_monthly_income: employment salary first,
// itemized incomes as the fallback.
function extractMonthlyIncome(applicant) {
  const employment = Array.isArray(applicant?.employment)
    ? applicant.employment[0]
    : applicant?.employment;

  const gross = num(employment?.gross_monthly_income);
  if (gross > 0) return gross;

  const incomes = Array.isArray(applicant?.incomes) ? applicant.incomes : [];
  const total = incomes.reduce((sum, income) => sum + num(income?.monthly_amount), 0);
  return total > 0 ? total : 0;
}

function extractMonthlyObligations(applicant) {
  const liabilities = Array.isArray(applicant?.liabilities) ? applicant.liabilities : [];
  return liabilities.reduce((sum, liability) => sum + num(liability?.monthly_payment), 0);
}

// ── Underwriting ────────────────────────────────────────────────────────────

// Builds one offer option in the exact shape of the bank-admin service's
// LoanTermOptionSchema — the same objects the real
// BANK_COUNTER_OFFERS_PUBLISHED event carries in `details.current_options`.
function buildOfferOption({
  optionId,
  label,
  amount,
  tenureMonths,
  interestRate,
  maxAffordableEmi,
  justification,
}) {
  const emi = calculateEmi(amount, interestRate, tenureMonths);
  const fee = round2(amount * ORIGINATION_FEE_PCT);

  return {
    option_id: optionId,
    label,
    proposed_amount: round2(amount),
    proposed_tenure_months: tenureMonths,
    proposed_interest_rate: round2(interestRate),
    monthly_payment_emi: emi,
    disbursement_amount: round2(amount - fee),
    total_repayment: round2(emi * tenureMonths),
    affordability_headroom_pct:
      maxAffordableEmi > 0 ? round2(((maxAffordableEmi - emi) / maxAffordableEmi) * 100) : 0,
    is_recommended: false, // set by the caller once the spread is known
    feasible: emi <= maxAffordableEmi,
    justification,
  };
}

// The demo's underwriting decision. Deliberately the same *shape* of judgment
// the real decisioning agent makes — can the applicant's FOIR-capped EMI
// headroom carry the requested loan? — rather than an arbitrary switch, so
// changing the amount, income or existing debts on the form moves the demo
// between the APPROVE and COUNTER_OFFER journeys the way it would in
// production.
function buildDemoScenario(applicationId, requestBody) {
  const applicant = requestBody?.applicants?.[0] || {};

  const requestedAmount = roundToThousand(num(requestBody?.requested_amount) || 100000);
  const requestedTenure = Math.max(6, Math.round(num(requestBody?.requested_term_months) || 36));

  const monthlyIncome = extractMonthlyIncome(applicant);
  const existingObligations = extractMonthlyObligations(applicant);
  const maxAffordableEmi = round2(Math.max(0, monthlyIncome * FOIR_PCT - existingObligations));

  const requestedEmi = calculateEmi(requestedAmount, BASE_ANNUAL_RATE_PCT, requestedTenure);
  const qualifyingCap = principalForEmi(maxAffordableEmi, BASE_ANNUAL_RATE_PCT, requestedTenure);
  const originalRequestDti =
    monthlyIncome > 0 ? round2((requestedEmi + existingObligations) / monthlyIncome) : 1;

  const scenario = {
    applicationId,
    phase: null,
    decision: null,
    approved: null,
    counterOffer: null,
    acceptedTerms: null,
  };

  // Affordable as requested → straight approval.
  if (requestedEmi > 0 && requestedEmi <= maxAffordableEmi) {
    const fee = round2(requestedAmount * ORIGINATION_FEE_PCT);
    scenario.decision = 'APPROVE';
    scenario.approved = {
      approved_amount: requestedAmount,
      approved_tenure_months: requestedTenure,
      interest_rate: BASE_ANNUAL_RATE_PCT,
      monthly_emi: requestedEmi,
      processing_fee: fee,
      disbursement_amount: round2(requestedAmount - fee),
      total_repayment: round2(requestedEmi * requestedTenure),
      explanation:
        'Applicant meets the affordability and credit criteria for the full requested amount.',
    };
    return scenario;
  }

  // No headroom at all, or headroom too thin to carry even a minimum ticket →
  // decline. Reachable from the form by clearing income or loading up the
  // liabilities, the same inputs that would drive it on the real stack.
  if (maxAffordableEmi <= 0 || qualifyingCap < MIN_LOAN_AMOUNT) {
    scenario.decision = 'DECLINE';
    scenario.declineReason =
      maxAffordableEmi <= 0
        ? 'Your existing monthly obligations already use the full share of income we can commit to loan repayments, so we are unable to extend an offer at this time.'
        : 'Based on your declared income and existing obligations, the repayment capacity available does not support our minimum loan amount.';
    return scenario;
  }

  // Not affordable as requested → three counter offers, mirroring the
  // decisioning agent's CO1 (reduced amount) / CO2 (extended tenure) /
  // CO3 (balanced) structure.
  scenario.decision = 'COUNTER_OFFER';

  // Every option's amount is derived from the affordability ceiling at that
  // option's own tenure, so each offer is affordable by construction. The one
  // exception is CO2 — it holds the requested amount fixed and stretches the
  // tenure as far as it will go, which is why CO2 is the only option that can
  // come back infeasible (the same rule the real decisioning agent applies).
  // CO2 stretches to the longest tenure on offer — that is what makes its
  // `feasible: false` meaningful ("cannot be supported at *any* tenure").
  const extendedTenure = Math.max(requestedTenure, MAX_TENURE_MONTHS);
  const balancedTenure = Math.round((requestedTenure + extendedTenure) / 2);

  const extendedRate = round2(BASE_ANNUAL_RATE_PCT + 0.6);
  const balancedRate = round2(BASE_ANNUAL_RATE_PCT + 0.3);

  // Largest principal affordable at `tenure`, never above what was asked for.
  const affordableAt = (tenureMonths, ratePct) =>
    floorToThousand(
      Math.min(requestedAmount, principalForEmi(maxAffordableEmi, ratePct, tenureMonths)),
    );

  // CO3 only exists when there is genuinely a middle ground between the
  // requested tenure and the longest one. If the request is already at (or
  // past) the ceiling, a "balanced" option would land on CO1's tenure with a
  // slightly smaller amount at a higher rate — strictly worse, so it is
  // dropped rather than shown.
  const hasBalancedGround = balancedTenure > requestedTenure;

  const candidates = [
    buildOfferOption({
      optionId: 'CO1',
      label: 'Reduced Amount',
      amount: affordableAt(requestedTenure, BASE_ANNUAL_RATE_PCT),
      tenureMonths: requestedTenure,
      interestRate: BASE_ANNUAL_RATE_PCT,
      maxAffordableEmi,
      justification:
        'This amount sits within your current repayment capacity while keeping the tenure you originally asked for, so your EMI stays comfortably affordable.',
    }),
    buildOfferOption({
      optionId: 'CO2',
      label: 'Extended Tenure',
      amount: requestedAmount,
      tenureMonths: extendedTenure,
      interestRate: extendedRate,
      maxAffordableEmi,
      justification:
        'Spreading the full requested amount over a longer tenure lowers each monthly instalment, at the cost of more total interest over the life of the loan.',
    }),
    hasBalancedGround
      ? buildOfferOption({
          optionId: 'CO3',
          label: 'Balanced Option',
          amount: affordableAt(balancedTenure, balancedRate),
          tenureMonths: balancedTenure,
          interestRate: balancedRate,
          maxAffordableEmi,
          justification:
            'A moderate reduction in amount combined with a slightly longer tenure gives you most of what you asked for while keeping the EMI well inside your affordability ceiling.',
        })
      : null,
  ];

  const options = candidates.filter(Boolean);

  // Prefer the balanced offer, then the reduced amount, then the long tenure —
  // picking the largest affordable amount instead would steer the applicant to
  // the option that costs the most total interest.
  const preference = ['CO3', 'CO1', 'CO2'];
  const recommended =
    preference
      .map((id) => options.find((option) => option.option_id === id && option.feasible))
      .find(Boolean) || options[0];
  recommended.is_recommended = true;

  scenario.counterOffer = {
    original_request_dti: originalRequestDti,
    max_affordable_emi: maxAffordableEmi,
    monthly_income: round2(monthlyIncome),
    existing_monthly_obligations: round2(existingObligations),
    qualifying_cap: qualifyingCap,
    counter_offer_logic:
      'The requested loan would take your total monthly obligations beyond the share of income we can prudently commit. ' +
      'The options below keep your instalment within that limit — by trimming the amount, extending the tenure, or balancing the two.',
    confidence_score: 0.87,
    generated_options: options,
    current_options: options,
    recommended_option_id: recommended.option_id,
    recommendation_rationale:
      'This option preserves the most of your requested amount while keeping the instalment inside your affordability ceiling.',
  };

  return scenario;
}

// ── Disbursement ────────────────────────────────────────────────────────────

// Builds a DisbursementReceipt in the disbursement agent's wire shape,
// including the amortised schedule preview the receipt screen renders.
function buildDisbursementReceipt({
  applicationId,
  approvedAmount,
  tenureMonths,
  interestRate,
  disbursementAmount,
  explanation,
}) {
  const monthlyRate = interestRate / 100 / 12;
  const emi = calculateEmi(approvedAmount, interestRate, tenureMonths);
  const totalRepayment = round2(emi * tenureMonths);
  const originationFee = round2(approvedAmount - disbursementAmount);

  const today = new Date();
  const firstEmiDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const isoDate = (date) => date.toISOString().split('T')[0];

  const buildInstallment = (installmentNumber, openingBalance) => {
    const interest = round2(openingBalance * monthlyRate);
    const principal = round2(emi - interest);
    const dueDate = new Date(firstEmiDate);
    dueDate.setMonth(dueDate.getMonth() + installmentNumber - 1);

    return {
      installment_number: installmentNumber,
      due_date: isoDate(dueDate),
      opening_balance: round2(openingBalance),
      emi_amount: emi,
      principal_component: principal,
      interest_component: interest,
      closing_balance: Math.max(0, round2(openingBalance - principal)),
    };
  };

  // First three instalments, then the final one — the same preview the real
  // receipt carries rather than a full schedule.
  const schedulePreview = [];
  let balance = approvedAmount;
  for (let i = 1; i <= Math.min(3, tenureMonths); i += 1) {
    const installment = buildInstallment(i, balance);
    schedulePreview.push(installment);
    balance = installment.closing_balance;
  }
  if (tenureMonths > 3) {
    const lastDueDate = new Date(firstEmiDate);
    lastDueDate.setMonth(lastDueDate.getMonth() + tenureMonths - 1);
    const lastInterest = round2(emi * 0.01);
    schedulePreview.push({
      installment_number: tenureMonths,
      due_date: isoDate(lastDueDate),
      opening_balance: round2(emi - lastInterest),
      emi_amount: emi,
      principal_component: round2(emi - lastInterest),
      interest_component: lastInterest,
      closing_balance: 0,
    });
  }

  return {
    application_id: applicationId,
    disbursement_status: 'DISBURSED',
    approved_amount: round2(approvedAmount),
    disbursement_amount: round2(disbursementAmount),
    origination_fee_deducted: originationFee,
    interest_rate: round2(interestRate),
    tenure_months: tenureMonths,
    monthly_emi: emi,
    total_interest: round2(totalRepayment - approvedAmount),
    total_repayment: totalRepayment,
    first_emi_date: isoDate(firstEmiDate),
    transaction_id: `TXN-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
    transfer_status: 'SUCCESS',
    transfer_timestamp: new Date().toISOString(),
    reconciliation_required: false,
    schedule_preview: schedulePreview,
    explanation: explanation || 'Loan disbursed successfully.',
  };
}

// ── State accessors (used by the mock SSE stream) ───────────────────────────

// Recovers the scenario for an application whose state this session no longer
// holds — a mid-pipeline reload. Real mode survives the same reload by
// replaying the orchestrator's buffered SSE events; this is the offline
// equivalent, rebuilt from the intake payload the caller still has.
export function ensureDemoApplicationScenario(applicationId, rawApplication) {
  const existing = demoApplications.get(applicationId);
  if (existing) return existing;

  const scenario = buildDemoScenario(applicationId, rawApplication || {});
  demoApplications.set(applicationId, scenario);
  return scenario;
}

// The mock SSE stream calls this as each stage lands, the way the real
// orchestrator's pipeline task calls save_state() between stages.
export function setDemoApplicationPhase(applicationId, phase) {
  const scenario = demoApplications.get(applicationId);
  if (scenario) {
    scenario.phase = phase;
  }
}

export const DEMO_PHASES = Phase;

// ── Route handlers ──────────────────────────────────────────────────────────

// Resolves the terms the applicant actually committed to, so the signature
// step disburses those and not the original request. Mirrors the way
// PipelineService merges the accepted offer into `uw_data` before disbursing.
function resolveAcceptedTerms(scenario) {
  if (scenario.acceptedTerms) return scenario.acceptedTerms;
  if (scenario.approved) {
    return {
      approved_amount: scenario.approved.approved_amount,
      approved_tenure_months: scenario.approved.approved_tenure_months,
      interest_rate: scenario.approved.interest_rate,
      disbursement_amount: scenario.approved.disbursement_amount,
      explanation: scenario.approved.explanation,
    };
  }
  return null;
}

function handleSubmitApplication(config) {
  const requestBody = getRequestBody(config.data);
  const applicationId = crypto.randomUUID();

  demoApplications.set(applicationId, buildDemoScenario(applicationId, requestBody));

  return buildResponse(config, {
    application_id: applicationId,
    timestamp: new Date().toISOString(),
    validation_issues: [],
    validation_summary: null,
  });
}

function handleTriggerOrchestrator(config) {
  const body = getRequestBody(config.data);
  const applicationId = body.application_id;

  // A reload drops the scenario exactly as an orchestrator restart drops its
  // pipeline state — rebuild from the payload this call already carries.
  ensureDemoApplicationScenario(applicationId, body.raw_application);
  setDemoApplicationPhase(applicationId, Phase.AWAITING_BANK_REVIEW);

  return buildResponse(config, {
    application_id: applicationId,
    accepted: true,
    stream_url: `/pipeline_updates/${applicationId}`,
  });
}

function handleDocumentUpload(config) {
  const form = typeof config.data?.get === 'function' ? config.data : null;
  const file = form?.get('file') || null;

  return buildResponse(config, {
    status: 'success',
    application_id: form?.get('application_id') || null,
    document_type: config.url.split('/').pop(),
    file_name: file?.name || 'demo-file.pdf',
    message: 'Demo upload completed successfully.',
  });
}

function handleBatchZipUpload(config, applicationId) {
  const form = typeof config.data?.get === 'function' ? config.data : null;
  const file = form?.get('file') || null;
  const zipName = file?.name || 'documents.zip';

  // The classifier's happy path: the mandatory PAN plus one identity proof
  // and one income proof — enough for the readiness gate to pass.
  const documents = [
    { file: 'pan_card.pdf', doc_type: 'pan_card', status: 'PROCESSED' },
    { file: 'aadhaar_card.pdf', doc_type: 'aadhaar_card', status: 'PROCESSED' },
    { file: 'salary_slip.pdf', doc_type: 'salary_slip', status: 'PROCESSED' },
    { file: 'bank_statement.pdf', doc_type: 'bank_statement', status: 'PROCESSED' },
  ];

  return buildResponse(config, {
    application_id: applicationId,
    zip_file: zipName,
    total_files: documents.length,
    processed: documents.length,
    failed: 0,
    skipped: 0,
    documents,
  });
}

function handlePipelineAccept(config, applicationId) {
  const scenario = demoApplications.get(applicationId);
  if (!scenario || scenario.phase !== Phase.AWAITING_APPLICANT_RESPONSE) {
    throw httpError(config, 400, `No pending offer for application ${applicationId}`);
  }

  scenario.phase = Phase.AWAITING_SIGNATURE;

  return buildResponse(config, {
    status: 'AWAITING_SIGNATURE',
    application_id: applicationId,
  });
}

function handlePipelineDecline(config, applicationId) {
  demoApplications.delete(applicationId);

  return buildResponse(config, {
    status: 'DECLINED_BY_APPLICANT',
    application_id: applicationId,
  });
}

function handleSelectCounterOffer(config, applicationId) {
  const scenario = demoApplications.get(applicationId);
  if (!scenario || scenario.phase !== Phase.AWAITING_COUNTER_OFFER_SELECTION) {
    throw httpError(
      config,
      400,
      `No published counter offers awaiting selection for application ${applicationId}`,
    );
  }

  const { option_id: optionId } = getRequestBody(config.data);
  const selected = (scenario.counterOffer?.current_options || []).find(
    (option) => option.option_id === optionId,
  );
  if (!selected) {
    throw httpError(
      config,
      400,
      `Option '${optionId}' not found in published offers for application ${applicationId}`,
    );
  }

  scenario.acceptedTerms = {
    approved_amount: selected.proposed_amount,
    approved_tenure_months: selected.proposed_tenure_months,
    interest_rate: selected.proposed_interest_rate,
    disbursement_amount: selected.disbursement_amount,
    explanation: selected.justification,
  };
  scenario.phase = Phase.AWAITING_SIGNATURE;

  return buildResponse(config, {
    status: 'AWAITING_SIGNATURE',
    application_id: applicationId,
  });
}

function handleDeclineAllOffers(config, applicationId) {
  demoApplications.delete(applicationId);

  return buildResponse(config, {
    status: 'COUNTER_OFFER_ALL_DECLINED',
    application_id: applicationId,
  });
}

// Signing triggers disbursement on the real stack too, so this is the one
// request/response call that carries a full processing phase of latency.
async function handleSignature(config, applicationId) {
  const scenario = demoApplications.get(applicationId);
  if (!scenario || scenario.phase !== Phase.AWAITING_SIGNATURE) {
    throw httpError(config, 400, `No pending signature for application ${applicationId}`);
  }

  const { agreed } = getRequestBody(config.data);
  if (!agreed) {
    throw httpError(config, 400, 'Signature must include agreement (agreed=true)');
  }

  const terms = resolveAcceptedTerms(scenario);
  if (!terms) {
    throw httpError(config, 400, `No approved terms on file for application ${applicationId}`);
  }

  scenario.phase = Phase.SIGNATURE_COMPLETE;
  await wait(DEMO_PHASE_DELAY_MS - DEMO_NETWORK_DELAY_MS);

  const receipt = buildDisbursementReceipt({
    applicationId,
    approvedAmount: terms.approved_amount,
    tenureMonths: terms.approved_tenure_months,
    interestRate: terms.interest_rate,
    disbursementAmount: terms.disbursement_amount,
    explanation: terms.explanation,
  });

  demoApplications.delete(applicationId);

  // Same envelope as the orchestrator's signature endpoint — outer status
  // plus the nested receipt, which normalizeReceipt() unwraps.
  return buildResponse(config, {
    status: 'DISBURSED',
    application_id: applicationId,
    disbursement_receipt: receipt,
  });
}

// Legacy direct-disbursement path (non-HITL), still reachable from
// ApplicationFlow for applications that never went through bank review.
function handleDirectDisburse(config) {
  const body = getRequestBody(config.data);
  const approvedAmount = num(body.approved_amount) || 100000;
  const tenureMonths = Math.max(1, Math.round(num(body.approved_tenure_months) || 36));
  const interestRate = num(body.interest_rate) || BASE_ANNUAL_RATE_PCT;
  const disbursementAmount =
    num(body.disbursement_amount) || round2(approvedAmount * (1 - ORIGINATION_FEE_PCT));

  return buildResponse(
    config,
    buildDisbursementReceipt({
      applicationId: body.application_id,
      approvedAmount,
      tenureMonths,
      interestRate,
      disbursementAmount,
      explanation: body.explanation,
    }),
  );
}

// ── Adapter ─────────────────────────────────────────────────────────────────

// `[method, RegExp, handler]`. The capture group, when present, is the
// application id from the path.
const ROUTES = [
  ['post', /^\/loan_intake\/submit_application$/, handleSubmitApplication],
  ['post', /^\/loan_intake\/trigger_orchestrator$/, handleTriggerOrchestrator],
  ['post', /^\/documents\/upload\/batch-zip\/([^/]+)$/, handleBatchZipUpload],
  ['post', /^\/documents\/upload\/[^/]+$/, handleDocumentUpload],
  ['post', /^\/pipeline\/([^/]+)\/accept$/, handlePipelineAccept],
  ['post', /^\/pipeline\/([^/]+)\/decline$/, handlePipelineDecline],
  ['post', /^\/pipeline\/([^/]+)\/select-counter-offer$/, handleSelectCounterOffer],
  ['post', /^\/pipeline\/([^/]+)\/decline-all-offers$/, handleDeclineAllOffers],
  ['post', /^\/pipeline\/([^/]+)\/signature$/, handleSignature],
  ['post', /^\/disburse$/, handleDirectDisburse],
];

export async function demoApiAdapter(config) {
  await wait(DEMO_NETWORK_DELAY_MS);

  const url = config.url || '';
  const method = String(config.method || '').toLowerCase();

  for (const [routeMethod, pattern, handler] of ROUTES) {
    if (routeMethod !== method) continue;
    const match = pattern.exec(url);
    if (match) {
      return handler(config, match[1]);
    }
  }

  return Promise.reject(
    new Error(`No demo mock configured for ${method.toUpperCase()} ${url}`),
  );
}

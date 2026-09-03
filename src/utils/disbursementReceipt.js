// Interprets and normalizes whatever the backend returns for a disbursement
// receipt (from POST /disburse or the signature endpoint's
// `disbursement_receipt`). Backends occasionally use slightly different key
// names between endpoints, and a receipt can legitimately represent a
// failed/pending outcome rather than a success — this keeps that
// interpretation in one place instead of trusting the shape blindly.

const FAILURE_PATTERN = /FAIL|DECLIN|REJECT|ERROR|DENIED/i;
const PENDING_PATTERN = /PENDING|PROGRESS|PROCESSING|QUEUED|INITIATED/i;

export function getDisbursementOutcome(receipt) {
  // The envelope's outer `status`, when present, is the authoritative
  // signal — confirmed against a real case where the nested receipt's own
  // `disbursement_status` read "FAILED" (with a decline-sounding
  // explanation) for an application that had, in fact, already been
  // approved and accepted by the customer, while the outer `status`
  // correctly said "DISBURSED". The nested receipt's status field cannot
  // be trusted over it.
  const outerSignal = String(receipt?.outer_status || '').trim();
  if (outerSignal) {
    if (FAILURE_PATTERN.test(outerSignal)) return 'failed';
    if (PENDING_PATTERN.test(outerSignal)) return 'pending';
    return 'success';
  }

  // No outer envelope (e.g. the flat /disburse response) — fall back to
  // the receipt's own status fields.
  const primarySignal = `${receipt?.disbursement_status || ''} ${receipt?.transfer_status || ''}`.trim();
  if (!primarySignal) return 'unknown';
  if (FAILURE_PATTERN.test(primarySignal)) return 'failed';
  if (PENDING_PATTERN.test(primarySignal)) return 'pending';
  return 'success';
}

const pick = (...values) => values.find((v) => v !== undefined && v !== null && v !== '');

// Some backends nest the actual receipt under a wrapper key, or use
// camelCase / alternate field names — tolerate both instead of silently
// falling back to 0/undefined for fields that do have real data.
export function normalizeReceipt(raw) {
  if (!raw) return null;
  const nested = raw.disbursement_receipt || raw.receipt || null;
  const source = nested || raw;
  // When the receipt is nested, the outer envelope can carry its own
  // top-level `status` distinct from the receipt's own status field(s) —
  // capture it separately so getDisbursementOutcome can factor it in
  // instead of it being silently dropped.
  const outerStatus = nested ? pick(raw.status, raw.disbursement_status) : undefined;

  return {
    application_id: pick(source.application_id, source.applicationId),
    disbursement_status: pick(source.disbursement_status, source.status, source.disbursementStatus),
    outer_status: outerStatus,
    transaction_id: pick(source.transaction_id, source.txn_id, source.transactionId),
    transfer_status: pick(source.transfer_status, source.transferStatus),
    transfer_timestamp: pick(source.transfer_timestamp, source.disbursed_at, source.timestamp, source.transferTimestamp),
    approved_amount: pick(source.approved_amount, source.approvedAmount, source.loan_amount),
    disbursement_amount: pick(source.disbursement_amount, source.net_amount, source.disbursed_amount, source.netDisbursedAmount),
    origination_fee_deducted: pick(source.origination_fee_deducted, source.origination_fee, source.processing_fee),
    interest_rate: pick(source.interest_rate, source.rate),
    tenure_months: pick(source.tenure_months, source.term_months, source.loan_duration_months),
    monthly_emi: pick(source.monthly_emi, source.emi, source.monthly_payment),
    total_interest: source.total_interest,
    total_repayment: source.total_repayment,
    first_emi_date: pick(source.first_emi_date, source.firstEmiDate),
    schedule_preview: pick(source.schedule_preview, source.repayment_schedule, source.installments),
    explanation: pick(source.explanation, source.reason, source.message),
  };
}

// Builds the DecisionScreen-shaped object for a disbursement that failed
// (pre- or post-signature) — carries every real field the backend returned
// so the decline page can show full context, but deliberately never
// includes the raw status strings (disbursement_status/transfer_status/
// outer_status) themselves; only the normalized "DECLINED" decision type
// is used to represent the outcome.
export function buildDeclinedDecision(normalized, fallbackApplicationId) {
  return {
    decision: 'DECLINED',
    reason:
      normalized?.explanation ||
      'We were unable to complete the disbursement for this application.',
    application_id: normalized?.application_id || fallbackApplicationId,
    transaction_id: normalized?.transaction_id,
    approved_amount: normalized?.approved_amount,
    disbursement_amount: normalized?.disbursement_amount,
    origination_fee_deducted: normalized?.origination_fee_deducted,
    interest_rate: normalized?.interest_rate,
    tenure_months: normalized?.tenure_months,
  };
}

// A backend explanation can carry stale/contradictory language from an
// earlier internal check (e.g. a Step 1 evaluation) even once the outer
// envelope has confirmed success — decline-sounding text has no business
// being shown on a page that just told the user their loan succeeded.
export function looksLikeFailureText(text) {
  return Boolean(text) && FAILURE_PATTERN.test(text);
}

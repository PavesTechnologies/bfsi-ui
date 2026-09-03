import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { subscribeToPipeline } from "../../services/pipelineSSE";
import {
  createInitialStages,
  markActive,
  markComplete,
  markError,
} from "../../utils/stageHelpers";
import "../../styles/applicationJourney.css";

// Backend-tracked stages — the SSE stream only ever reports these three.
// Everything else (the six-step "journey" shown to the user, the activity
// feed, the smooth progress percentage) is a presentational layer derived
// from this real state, not separately-fabricated data.
const PIPELINE_STAGES = [
  {
    id: "kyc",
    label: "Identity Verification (KYC)",
    description: "Verifying applicant identity against authoritative sources",
    icon: "ID",
    backendStage: "kyc",
  },
  {
    id: "decisioning",
    label: "Underwriting & Risk Scoring",
    description: "Running decisioning models against applicant profile",
    icon: "UW",
    backendStage: "decisioning",
  },
  {
    id: "disbursement",
    label: "Disbursement",
    description: "Transferring approved funds and generating the receipt",
    icon: "DS",
    backendStage: "disbursement",
  },
];

const TOTAL_ESTIMATED_SECONDS = 10;

// Cosmetic pacing only, for the smooth in-stage progress fraction below —
// real stage completion is always server-driven and this never lets a
// stage visually reach 100% on its own.
const VISUAL_STAGE_DURATION_MS = 4000;

const getElapsed = (data) => {
  const elapsed = data?.details?.elapsed;
  return typeof elapsed === "number" ? elapsed : null;
};

const normalizeTerminalDecision = (data) => {
  const details = data?.details || {};

  // New counter-offer flow: bank published options after in-house review
  if (data.event === "bank_counter_offers_published") {
    const rawOpts = details.current_options ?? details.counter_offer_options ?? data.current_options ?? [];
    const counterOfferOptions = rawOpts.map((opt) => ({
      option_id: opt.option_id,
      description: opt.label,
      amount: opt.proposed_amount,
      term_months: opt.proposed_tenure_months,
      interest_rate: opt.proposed_interest_rate,
      monthly_payment: opt.monthly_payment_emi,
      disbursement_amount: opt.disbursement_amount,
      total_repayment: opt.total_repayment,
      affordability_headroom_pct: opt.affordability_headroom_pct,
      is_recommended: opt.is_recommended,
      feasible: opt.feasible,
    }));
    return {
      decision: "COUNTER_OFFER",
      isNewCounterOfferFlow: true,
      reason:
        "The bank has reviewed your application and prepared alternative offers. Please select an option.",
      counterOfferOptions: counterOfferOptions.length > 0 ? counterOfferOptions : null,
      application_id: data.application_id,
    };
  }

  // Counter-offer all declined by applicant (terminal)
  if (data.event === "counter_offer_all_declined") {
    return {
      decision: "DECLINED",
      reason: "All counter offers have been declined.",
      application_id: data.application_id,
    };
  }

  // HITL: bank has reviewed and sends decision to applicant
  if (data.event === "awaiting_applicant_response") {
    const fd = details.final_decision;
    const decision =
      fd === "APPROVE"
        ? "APPROVED"
        : fd === "DECLINE"
          ? "DECLINED"
          : fd === "COUNTER_OFFER"
            ? "COUNTER_OFFER"
            : "DECISION_COMPLETE";

    const approvedTerms =
      decision === "APPROVED"
        ? {
            amount: details.approved_amount,
            term_months: details.tenure_months,
            interest_rate: details.interest_rate,
            monthly_payment: details.monthly_emi,
            terms_summary: `Loan of ₹${Number(details.approved_amount ?? 0).toLocaleString("en-IN")} at ${details.interest_rate}% for ${details.tenure_months} months. EMI: ₹${Number(details.monthly_emi ?? 0).toLocaleString("en-IN")}/month.`,
          }
        : null;

    const rawOpts = details.counter_offer_options ?? [];
    const counterOfferOptions = rawOpts.map((opt) => ({
      option_id: opt.option_id,
      description: opt.description,
      amount: opt.proposed_amount,
      term_months: opt.proposed_tenure_months,
      interest_rate: opt.proposed_interest_rate,
      monthly_payment: opt.monthly_payment_emi,
      disbursement_amount: opt.disbursement_amount,
      total_repayment: opt.total_repayment,
    }));

    return {
      decision,
      isHITLBankDecision: true,
      reason:
        decision === "APPROVED"
          ? "Bank has approved your loan application."
          : "Bank has reviewed your application and provided an offer.",
      approvedTerms,
      counterOfferOptions: counterOfferOptions.length > 0 ? counterOfferOptions : null,
      application_id: data.application_id,
    };
  }

  const rawDecision =
    details.decision ||
    data.decision ||
    (data.event === "counter_offer_pending" ||
    data.event === "application_counter_offer"
      ? "COUNTER_OFFER"
      : null) ||
    (data.event === "funds_disbursed" ? "DISBURSED" : null) ||
    (data.event === "application_approved" || data.event === "approved"
      ? "APPROVE"
      : null) ||
    (data.event === "application_declined" ||
    data.event === "kyc_failed" ||
    data.event === "declined"
      ? "DECLINED"
      : null) ||
    (data.status === "failed" ? "ERROR" : "DECISION_COMPLETE");

  // Normalize backend short-form strings to UI constants
  const decision =
    rawDecision === "APPROVE"
      ? "APPROVED"
      : rawDecision === "DECLINE"
        ? "DECLINED"
        : rawDecision;

  // Counter offer options live under details.counter_offer_options
  const counterOfferOptions = (
    details.counter_offer_options?.generated_options || []
  ).map((opt) => ({
    option_id: opt.offer_id,
    description: opt.label,
    amount: opt.proposed_amount,
    term_months: opt.proposed_tenure_months,
    interest_rate: opt.proposed_interest_rate,
    monthly_payment: opt.monthly_payment_emi,
    disbursement_amount: opt.disbursement_amount,
    total_repayment: opt.total_repayment,
  }));

  // Approved terms from APPLICATION_APPROVED details
  const approvedTerms =
    decision === "APPROVED"
      ? {
          amount: details.approved_amount,
          term_months: details.approved_tenure_months,
          interest_rate: details.interest_rate,
          monthly_payment: details.monthly_emi,
          processing_fee: details.processing_fee,
          terms_summary: details.terms_summary,
        }
      : null;

  return {
    decision,
    stage: data.stage,
    reason: details.reason || data.message,
    requested: details.requested || details.offer || null,
    counter: details.counter || null,
    approvedTerms,
    counterOfferOptions:
      counterOfferOptions.length > 0 ? counterOfferOptions : null,
    disbursementReceipt: details.disbursement_receipt || null,
    application_id: data.application_id,
  };
};

// ---------------------------------------------------------------------
// Presentation-layer derivations. All of these read the three real
// backend stages (+ the HITL sub-status string) — nothing here invents
// application outcomes, it only decides how to narrate real state.
// ---------------------------------------------------------------------

const JOURNEY_DEFINITIONS = [
  {
    id: "submitted",
    title: "Application Submitted",
    description: "Your loan application was successfully submitted.",
  },
  {
    id: "identity",
    title: "Identity Verification",
    description: "Your identity and submitted information have been verified.",
  },
  {
    id: "analysis",
    title: "AI Financial Analysis",
    description: "Our AI is analyzing your financial profile and loan eligibility, with bank review where required.",
  },
  {
    id: "decision",
    title: "Final Decision",
    description: "You will receive the loan decision once the review is complete.",
  },
  {
    id: "disbursement",
    title: "Disbursement",
    description: "Approved funds will be transferred to your account.",
  },
];

// "AI Financial Analysis" and "Bank Review" are both sub-phases of the
// same backend decisioning stage — they're shown as one journey step, with
// getStatusCopy() (below) narrating which sub-phase is currently active.
function buildJourney(stages) {
  const [kyc, decisioning, disbursement] = stages;

  const statusOf = {
    submitted: "complete",
    identity: kyc.status,
    analysis: decisioning.status,
    decision: decisioning.status === "complete" ? "complete" : "pending",
    disbursement: disbursement.status,
  };

  return JOURNEY_DEFINITIONS.map((def) => ({ ...def, status: statusOf[def.id] }));
}

const ANALYSIS_ACTIVITY_DEFS = [
  { id: "identity_verified", label: "Identity information verified" },
  { id: "application_processed", label: "Application details processed" },
  { id: "evaluating_financials", label: "Evaluating financial information" },
  { id: "calculating_eligibility", label: "Calculating loan eligibility" },
  { id: "risk_assessment", label: "Preparing risk assessment" },
];

function buildActivity(stages, decisioningFraction) {
  const [kyc, decisioning] = stages;
  const kycDone = kyc.status === "complete";
  const kycActive = kyc.status === "active";

  const items = [
    { ...ANALYSIS_ACTIVITY_DEFS[0], status: kycDone ? "complete" : kycActive ? "active" : "pending" },
    { ...ANALYSIS_ACTIVITY_DEFS[1], status: kycDone ? "complete" : "pending" },
  ];

  const remaining = ANALYSIS_ACTIVITY_DEFS.slice(2);

  if (decisioning.status === "complete") {
    remaining.forEach((def) => items.push({ ...def, status: "complete" }));
  } else if (decisioning.status === "active") {
    const activeIdx = decisioningFraction > 0.66 ? 2 : decisioningFraction > 0.33 ? 1 : 0;
    remaining.forEach((def, i) => {
      items.push({ ...def, status: i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending" });
    });
  } else {
    remaining.forEach((def) => items.push({ ...def, status: "pending" }));
  }

  return items;
}

function getStatusCopy({ stages, hitlStatus, error }) {
  const [kyc, decisioning, disbursement] = stages;

  if (error) {
    return {
      kicker: "Attention needed",
      heading: "We hit a connection snag",
      body: "We're reconnecting to the secure processing stream automatically. No action is needed from you.",
      tone: "error",
    };
  }
  if (kyc.status === "error") {
    return {
      kicker: "Attention needed",
      heading: "Identity verification needs another look",
      body: kyc.errorMessage || "We couldn't verify your details automatically. Support has been notified.",
      tone: "error",
    };
  }
  if (decisioning.status === "error") {
    return {
      kicker: "Attention needed",
      heading: "We couldn't complete the review",
      body: decisioning.errorMessage || "Something interrupted the financial analysis. Support has been notified.",
      tone: "error",
    };
  }
  if (disbursement.status === "error") {
    return {
      kicker: "Attention needed",
      heading: "Disbursement needs another look",
      body: disbursement.errorMessage || "We couldn't complete the transfer automatically. Support has been notified.",
      tone: "error",
    };
  }

  if (kyc.status === "active") {
    return {
      kicker: "Identity verification",
      heading: "Verifying your identity",
      body: "We're confirming your identity and submitted information against secure records.",
      tone: "progress",
    };
  }
  if (decisioning.status === "active") {
    if (hitlStatus) {
      return {
        kicker: "Bank review",
        heading: "With our banking partner",
        body: hitlStatus,
        tone: "progress",
      };
    }
    return {
      kicker: "AI review in progress",
      heading: "Analyzing your application",
      body: "Our AI agents are reviewing your financial information to assess your loan eligibility.",
      tone: "progress",
    };
  }
  if (disbursement.status === "active") {
    return {
      kicker: "Finalizing",
      heading: "Preparing your disbursement",
      body: "We're transferring your approved funds and getting your receipt ready.",
      tone: "progress",
    };
  }

  return {
    kicker: "Review complete",
    heading: "Wrapping up",
    body: "Finishing the last few checks before we show you the result.",
    tone: "progress",
  };
}

function estimateCopy(stages) {
  const remaining = stages.filter((s) => s.status !== "complete").length;
  if (remaining === 0) return "Almost done";
  if (remaining === 1) return "Less than a minute";
  if (remaining === 2) return "About a minute";
  return "Less than 2 minutes";
}

// Smoothly-increasing (but always bounded, server-confirmed-only-at-100%)
// progress fraction for whichever stage is currently active. Purely
// cosmetic pacing — it never marks a stage complete on its own.
function useStageProgress(stages) {
  const [activeFraction, setActiveFraction] = useState(0);
  const activeStartRef = useRef(null);

  const activeIndex = stages.findIndex((s) => s.status === "active");

  // All Date.now() reads happen inside the interval callback (an event,
  // not render), then land in state — render itself stays pure. The ref
  // reset is synchronous but isn't setState, so it's safe here; the stale
  // fraction from a previous stage is masked below via `effectiveFraction`
  // until the next tick (<=200ms) catches up.
  useEffect(() => {
    if (activeIndex === -1) {
      activeStartRef.current = null;
      return undefined;
    }
    activeStartRef.current = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - activeStartRef.current;
      setActiveFraction(Math.min(0.92, elapsed / VISUAL_STAGE_DURATION_MS));
    }, 200);
    return () => clearInterval(id);
  }, [activeIndex]);

  const completedCount = stages.filter((s) => s.status === "complete").length;
  const effectiveFraction = activeIndex === -1 ? 0 : activeFraction;
  const overallPercent = Math.round(
    ((completedCount + effectiveFraction) / stages.length) * 100,
  );

  return { activeIndex, activeFraction: effectiveFraction, overallPercent };
}

const PipelineScreen = ({ applicationId, onComplete }) => {
  const navigate = useNavigate();
  const [stages, setStages] = useState(() =>
    markActive(createInitialStages(PIPELINE_STAGES), 0),
  );
  const [error, setError] = useState(null);
  const [hitlStatus, setHitlStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToPipeline(
      applicationId,
      // eslint-disable-next-line no-unused-vars
      ({ event, data }) => {
        setError(null);

        // HITL status updates (no stage change, just display)
        if (data.event === "awaiting_bank_review") {
          setHitlStatus("Your application is awaiting bank review.");
        }
        if (data.event === "bank_decisioning_started") {
          setHitlStatus("Bank decisioning is in progress.");
        }
        if (data.event === "counter_offer_review_started") {
          setHitlStatus("Your counter offer is under bank review.");
        }

        const stageIndex = PIPELINE_STAGES.findIndex(
          (stage) => stage.backendStage === data.stage,
        );
        const elapsed = getElapsed(data);
        const failureReason =
          data.details?.reason ||
          data.message ||
          "Verification failed. Please contact support.";

        if (stageIndex !== -1) {
          if (data.status === "started") {
            setStages((prev) => markActive(prev, stageIndex));
          }

          if (data.status === "completed") {
            setStages((prev) => {
              const completedStages = markComplete(prev, stageIndex, elapsed);

              if (
                data.is_terminal ||
                stageIndex === PIPELINE_STAGES.length - 1
              ) {
                return completedStages;
              }

              // Don't auto-advance when bank decision is pending applicant response
              if (data.event === "awaiting_applicant_response") {
                return completedStages;
              }

              return markActive(completedStages, stageIndex + 1);
            });
          }

          if (data.status === "failed") {
            setStages((prev) => markError(prev, stageIndex, failureReason));
          }
        }

        const normalizedDecision = normalizeTerminalDecision(data);
        const decisioningTerminal =
          data.stage === "decisioning" &&
          data.status === "completed" &&
          ["APPROVED", "DECLINED", "COUNTER_OFFER"].includes(
            normalizedDecision.decision,
          );
        const isApplicantResponse = data.event === "awaiting_applicant_response";
        const isBankOffersPublished = data.event === "bank_counter_offers_published";
        const isCounterOfferAllDeclined = data.event === "counter_offer_all_declined";

        if (
          !data.is_terminal &&
          !decisioningTerminal &&
          !isApplicantResponse &&
          !isBankOffersPublished &&
          !isCounterOfferAllDeclined
        ) {
          return;
        }

        // Keep one-shot behavior: first terminal/decisioning completion triggers next flow
        window.setTimeout(() => onComplete(normalizedDecision), 600);
      },
      (subscriptionError) => {
        setError(subscriptionError);
      },
    );

    return unsubscribe;
  }, [applicationId, onComplete]);

  const { activeIndex, activeFraction, overallPercent } = useStageProgress(stages);
  const journey = useMemo(() => buildJourney(stages), [stages]);
  const decisioningFraction = activeIndex === 1 ? activeFraction : 0;
  const activity = useMemo(
    () => buildActivity(stages, decisioningFraction),
    [stages, decisioningFraction],
  );
  const statusCopy = useMemo(
    () => getStatusCopy({ stages, hitlStatus, error }),
    [stages, hitlStatus, error],
  );
  const estimate = useMemo(() => estimateCopy(stages), [stages]);

  const handleNeedHelp = () => {
    toast.info("Our support team is available in-app any time — we're here if you need us.");
  };

  return (
    <div className="aj-page">
      <div className="aj-topbar">
        <button type="button" className="aj-topbar-btn" onClick={() => navigate(-1)}>
          <ArrowLeftIcon /> Back
        </button>
        <button type="button" className="aj-topbar-btn" onClick={handleNeedHelp}>
          Need Help?
        </button>
      </div>

      <div className="aj-hero">
        <h1 className="aj-hero-title">Your loan application is being reviewed</h1>
        <p className="aj-hero-subtitle">
          We're securely reviewing your information and preparing the next step in your loan application.
        </p>
      </div>

      <div className="aj-columns">
        <section className="aj-journey" aria-label="Application journey">
          <ol className="aj-journey-list">
            {journey.map((step, index) => (
              <li key={step.id} className={`aj-journey-item aj-journey-item--${step.status}`}>
                <span className="aj-journey-marker-col" aria-hidden="true">
                  <span className="aj-journey-dot">
                    {step.status === "complete" && <CheckIcon />}
                    {step.status === "error" && <ExclaimIcon />}
                    {step.status === "active" && <span className="aj-journey-dot-core" />}
                  </span>
                  {index < journey.length - 1 && <span className="aj-journey-line" />}
                </span>
                <span className="aj-journey-copy">
                  <span className="aj-journey-title">
                    {step.title}
                    {step.status === "active" && <span className="aj-journey-badge">Current step</span>}
                  </span>
                  <span className="aj-journey-desc">{step.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className={`aj-status-panel aj-status-panel--${statusCopy.tone}`} aria-label="Current processing status">
          <div className="aj-status-kicker">
            <span className="aj-live-dot" aria-hidden="true" />
            {statusCopy.kicker.toUpperCase()}
          </div>

          <div className="aj-orb-row">
            <span className="aj-orb" aria-hidden="true">
              <span className="aj-orb-core" />
              <span className="aj-orb-percent">{overallPercent}%</span>
            </span>
            <div className="aj-status-copy">
              <h2 className="aj-status-heading">{statusCopy.heading}</h2>
              <p className="aj-status-body">{statusCopy.body}</p>
            </div>
          </div>

          <div className="aj-progress-track" role="progressbar" aria-label="Application analysis complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallPercent}>
            <div className="aj-progress-fill" style={{ width: `${overallPercent}%` }} />
          </div>
          <span className="aj-progress-caption">{overallPercent}% · Application Analysis Complete</span>

          <h3 className="aj-activity-heading">AI Analysis Details</h3>
          <ul className="aj-activity-list">
            {activity.map((item) => (
              <li key={item.id} className={`aj-activity-item aj-activity-item--${item.status}`}>
                <span className="aj-activity-icon" aria-hidden="true">
                  {item.status === "complete" ? <CheckIcon /> : item.status === "active" ? <span className="aj-activity-dot-core" /> : null}
                </span>
                {item.label}
              </li>
            ))}
          </ul>

          <div className="aj-estimate">
            <ClockIcon />
            <span className="aj-estimate-label">Estimated completion</span>
            <span className="aj-estimate-value">{estimate}</span>
          </div>
        </section>
      </div>

      <div className="aj-trust">
        <div className="aj-trust-item">
          <span className="aj-trust-icon" aria-hidden="true">🔒</span>
          <span>
            <span className="aj-trust-title">Bank-grade security</span>
            <span className="aj-trust-desc">Your information is encrypted and securely processed.</span>
          </span>
        </div>
        <div className="aj-trust-item">
          <span className="aj-trust-icon" aria-hidden="true">🤖</span>
          <span>
            <span className="aj-trust-title">AI-assisted processing</span>
            <span className="aj-trust-desc">Multiple AI agents are securely analyzing your application.</span>
          </span>
        </div>
        <div className="aj-trust-item">
          <span className="aj-trust-icon" aria-hidden="true">💬</span>
          <span>
            <span className="aj-trust-title">Need assistance?</span>
            <button type="button" className="aj-trust-link" onClick={handleNeedHelp}>
              Contact Support →
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExclaimIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 10.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default PipelineScreen;

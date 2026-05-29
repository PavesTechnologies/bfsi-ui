import React, { useEffect, useMemo, useState } from "react";
import { subscribeToPipeline } from "../../services/pipelineSSE";
import {
  createInitialStages,
  markActive,
  markComplete,
  markError,
} from "../../utils/stageHelpers";
import StageBlock from "./StageBlock";

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
      justification: opt.justification,
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

const PipelineScreen = ({ applicationId, onComplete }) => {
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
          setHitlStatus("Awaiting bank review…");
        }
        if (data.event === "bank_decisioning_started") {
          setHitlStatus("Bank decisioning in progress…");
        }
        if (data.event === "counter_offer_review_started") {
          setHitlStatus("Counter offer under bank review…");
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

  const completedStages = stages.filter(
    (stage) => stage.status === "complete",
  ).length;
  const activeStage = stages.find((stage) => stage.status === "active");
  const progressPercentage = (completedStages / PIPELINE_STAGES.length) * 100;
  const estimatedSecondsRemaining = useMemo(() => {
    const remaining =
      TOTAL_ESTIMATED_SECONDS -
      stages.reduce((sum, stage) => sum + (stage.elapsed || 0), 0);
    return Math.max(1, Math.round(remaining));
  }, [stages]);

  return (
    <div className="pipeline-shell fade-in">
      <div className="card pipeline-screen">
        <div className="card-header pipeline-header">
          <div>
            <span className="pipeline-kicker">Mission Control</span>
            <h2 className="card-title">Processing Your Application</h2>
            <p className="card-subtitle">
              Application ID:{" "}
              <span className="pipeline-application-id">{applicationId}</span>
            </p>
          </div>
          <div className="pipeline-status-chip">
            {hitlStatus ||
              (activeStage
                ? `Active: ${activeStage.label}`
                : "Finalising application")}
          </div>
        </div>

        <div className="pipeline-progress-bar" aria-hidden="true">
          <div
            className="pipeline-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="pipeline-stage-list">
          {stages.map((stage, index) => (
            <StageBlock key={stage.id} stage={stage} index={index} />
          ))}
        </div>

        <div className="pipeline-footer">
          <span>
            {error
              ? "Connection issue detected. Retrying stream updates..."
              : `Estimated time remaining: ~${estimatedSecondsRemaining}s`}
          </span>
          <span className={error ? "pipeline-footer-error" : ""}>
            {error ||
              "Need help? Contact support for manual review assistance."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PipelineScreen;

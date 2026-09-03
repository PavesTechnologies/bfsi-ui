import { isDemoMode } from "../config/env";
import {
  DEMO_PHASES,
  DEMO_PHASE_DELAY_MS,
  ensureDemoApplicationScenario,
  setDemoApplicationPhase,
} from "../api/demoApi";
import { loadApplication } from "../utils/applicationStorage";

const normalizePipelinePayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    ...payload,
    event: String(payload.event || "").toLowerCase(),
    stage: String(payload.stage || "").toLowerCase(),
    status: String(payload.status || "").toLowerCase(),
    is_terminal: Boolean(payload.is_terminal),
  };
};

// ── Demo pipeline timeline ──────────────────────────────────────────────────
//
// The same event sequence the real orchestrator pushes over SSE for the HITL
// flow, on a timer instead of over the wire:
//
//   PIPELINE_ACCEPTED → KYC_TRIGGERED → KYC_PASSED → AWAITING_BANK_REVIEW
//     → BANK_DECISIONING_STARTED → one of
//         AWAITING_APPLICANT_RESPONSE      (approve)
//         COUNTER_OFFER_REVIEW_STARTED → BANK_COUNTER_OFFERS_PUBLISHED
//         APPLICATION_DECLINED             (terminal)
//
// Event names, stages, statuses, `is_terminal` and the `details` payloads all
// match the real emissions, so PipelineScreen's stage machine and
// normalizeTerminalDecision() take exactly the same branches in both modes.
//
// Every genuine processing phase — identity verification, the bank review
// queue, bank decisioning, counter-offer review — is held for
// DEMO_PHASE_DELAY_MS so the stage transitions and progress bar read the way
// they do against the live stack.

// Short gap between an event and the one that immediately follows it on the
// real stack (e.g. KYC_PASSED then AWAITING_BANK_REVIEW).
const HANDOFF_MS = 250;

// Rebuilds the intake payload shape buildDemoScenario() expects from the
// persisted form state, so a mid-pipeline reload can recover the scenario.
const rawApplicationFromStorage = () => {
  const saved = loadApplication();
  if (!saved?.formData) return {};
  const { loan = {}, applicant = {} } = saved.formData;
  return { ...loan, applicants: [applicant] };
};

const buildDemoSequence = (applicationId, scenario) => {
  const events = [];
  let at = 0;

  const emit = (delayBefore, payload, onEmit) => {
    at += delayBefore;
    events.push({ delay: at, payload: { application_id: applicationId, ...payload }, onEmit });
  };

  emit(0, {
    event: "PIPELINE_ACCEPTED",
    stage: "ORCHESTRATOR",
    status: "started",
    message: "Pipeline accepted for processing",
    is_terminal: false,
  });

  emit(HANDOFF_MS, {
    event: "KYC_TRIGGERED",
    stage: "KYC",
    status: "started",
    message: "India KYC verification started",
    is_terminal: false,
  });

  // Phase 1 — identity verification.
  emit(DEMO_PHASE_DELAY_MS, {
    event: "KYC_PASSED",
    stage: "KYC",
    status: "completed",
    message: "India KYC verification passed",
    details: {
      confidence_score: 0.94,
      ckyc_id: `CKYC${String(Math.abs(hashCode(applicationId)) % 100000000).padStart(8, "0")}`,
    },
    is_terminal: false,
  });

  emit(
    HANDOFF_MS,
    {
      event: "AWAITING_BANK_REVIEW",
      stage: "DECISIONING",
      status: "pending",
      message: "Application submitted for bank review",
      is_terminal: false,
    },
    () => setDemoApplicationPhase(applicationId, DEMO_PHASES.AWAITING_BANK_REVIEW),
  );

  // Phase 2 — waiting in the bank's review queue.
  emit(DEMO_PHASE_DELAY_MS, {
    event: "BANK_DECISIONING_STARTED",
    stage: "DECISIONING",
    status: "started",
    message: "Bank triggered credit decisioning",
    is_terminal: false,
  });

  // Phase 3 — decisioning, then the bank's decision.
  if (scenario.decision === "DECLINE") {
    emit(DEMO_PHASE_DELAY_MS, {
      event: "APPLICATION_DECLINED",
      stage: "DECISIONING",
      status: "completed",
      message: "Bank declined the loan application",
      details: { decision: "DECLINE", reason: scenario.declineReason },
      is_terminal: true,
    });
    return events;
  }

  if (scenario.decision === "COUNTER_OFFER") {
    emit(DEMO_PHASE_DELAY_MS, {
      event: "COUNTER_OFFER_REVIEW_STARTED",
      stage: "DECISIONING",
      status: "pending",
      message: "Counter offers generated — bank employee review in progress",
      details: { decision: "COUNTER_OFFER" },
      is_terminal: false,
    });

    // Phase 4 — the bank employee reviewing and publishing the offers.
    emit(
      DEMO_PHASE_DELAY_MS,
      {
        event: "BANK_COUNTER_OFFERS_PUBLISHED",
        stage: "DECISIONING",
        status: "pending",
        message: "Bank has published counter offers — please select one to proceed",
        details: { current_options: scenario.counterOffer.current_options },
        is_terminal: false,
      },
      () =>
        setDemoApplicationPhase(
          applicationId,
          DEMO_PHASES.AWAITING_COUNTER_OFFER_SELECTION,
        ),
    );
    return events;
  }

  const approved = scenario.approved;
  emit(
    DEMO_PHASE_DELAY_MS,
    {
      event: "AWAITING_APPLICANT_RESPONSE",
      stage: "DECISIONING",
      status: "completed",
      message: "Bank decision ready — awaiting applicant response",
      details: {
        final_decision: "APPROVE",
        approved_amount: approved.approved_amount,
        interest_rate: approved.interest_rate,
        tenure_months: approved.approved_tenure_months,
        monthly_emi: approved.monthly_emi,
        counter_offer_options: null,
      },
      is_terminal: false,
    },
    () =>
      setDemoApplicationPhase(applicationId, DEMO_PHASES.AWAITING_APPLICANT_RESPONSE),
  );

  return events;
};

// Stable per-application filler for the mock CKYC id.
function hashCode(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function subscribeToDemoPipeline(applicationId, onEvent, onError) {
  const scenario = ensureDemoApplicationScenario(
    applicationId,
    rawApplicationFromStorage(),
  );

  if (!scenario?.decision) {
    onError?.("Could not resume this application. Please start a new one.");
    return () => {};
  }

  const timers = buildDemoSequence(applicationId, scenario).map(
    ({ delay, payload, onEmit }) =>
      window.setTimeout(() => {
        onEmit?.();
        const normalized = normalizePipelinePayload(payload);
        if (normalized) {
          onEvent?.({ event: normalized.event, data: normalized });
        }
      }, delay),
  );

  return () => timers.forEach(window.clearTimeout);
}

export function subscribeToPipeline(applicationId, onEvent, onError) {
  if (!applicationId) {
    onError?.("Missing application ID.");
    return () => {};
  }

  if (isDemoMode) {
    return subscribeToDemoPipeline(applicationId, onEvent, onError);
  }

  const es = new EventSource(
    `${import.meta.env.VITE_API_ORCHESTRATOR_URL}/pipeline_updates/${applicationId}`,
  );

  let terminalClosed = false;

  es.onmessage = (e) => {
    try {
      const parsed = normalizePipelinePayload(JSON.parse(e.data));
      if (parsed) {
        onEvent?.({ event: parsed.event, data: parsed });
        if (parsed.is_terminal) {
          terminalClosed = true;
          es.close(); // close cleanly on terminal event
        }
      }
    } catch {
      onError?.("Received an invalid pipeline event.");
    }
  };

  es.onerror = () => {
    if (!terminalClosed) {
      onError?.("Connection lost. Please refresh.");
    }
    es.close();
  };

  return () => es.close();
}

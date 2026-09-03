import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { isFillDefaults } from "../config/env";
import { toast } from "react-toastify";
import apiClient from "../api/client";
import {
  loadApplication,
  saveApplication,
  clearApplication,
} from "../utils/applicationStorage";
import AppShell from "../components/layout/AppShell";
import Button from "../components/FormElements/Button";
import ApplicantInfo from "../components/FormSteps/ApplicantInfo";
import AssetsLiabilities from "../components/FormSteps/AssetsLiabilities";
import EmploymentDetails from "../components/FormSteps/EmploymentDetails";
import AddressInfo from "../components/FormSteps/AddressInfo";
import IncomeInfo from "../components/FormSteps/IncomeInfo";
import LoanDetails from "../components/FormSteps/LoanDetails";
import ReviewSubmit from "../components/FormSteps/ReviewSubmit";
import DocumentUpload from "../components/FormSteps/DocumentUpload";
import DecisionScreen from "../components/Pipeline/DecisionScreen";
import DisbursementReceiptScreen from "../components/Pipeline/DisbursementReceiptScreen";
import PipelineScreen from "../components/Pipeline/PipelineScreen";
import SignatureScreen from "../components/Pipeline/SignatureScreen";
import { callDisburse } from "../api/disbursementApi";
import orchestratorClient from "../api/orchestratorClient";
import { getDisbursementOutcome, normalizeReceipt, buildDeclinedDecision } from "../utils/disbursementReceipt";
import "../styles/components.css";
import "../styles/pipeline.css";

const defaultFormData = {
  loan: {
    loan_type: "personal",
    credit_type: "individual",
    loan_purpose: "home_improvement",
    requested_amount: "100000",
    requested_term_months: "24",
    preferred_payment_day: "5",
    origination_channel: "web",
    application_status: "submitted",
  },
  applicant: {
    applicant_role: "primary",
    first_name: "Rahul",
    middle_name: "",
    last_name: "Mishra",
    suffix: "Mr.",
    date_of_birth: "1997-01-30",
    gender: "MALE",
    phone_number: "+919876543210",
    pan_number: "ABDCP0001F",
    aadhaar_no: "123456789012",
    father_name: "Sutendra Mishra",
    mother_name: "Sunita Mishra",
    citizenship_status: "citizen",
    email: `rahul${Date.now()}@example.com`, // new email every time to avoid backend duplicate checks during development
    addresses: [
      {
        address_type: "current",
        address_line1: "123 Main Street",
        address_line2: "Apt 4B",
        city: "Mumbai",
        state: "MH",
        zip_code: "100010",
        country: "India",
        housing_status: "rent",
        years_at_address: "3",
        months_at_address: "6",
      },
    ],
    employment: {
      employment_type: "salaried",
      employment_status: "active",
      employer_name: "Tech Corp",
      job_title: "Software Engineer",
      start_date: "2020-01-10",
      end_date: "",
      employer_phone: "+919876543211",
      employer_address: "456 Corporate Blvd, Mumbai",
      experience: "4",
      gross_monthly_income: "5000",
    },
    incomes: [
      {
        income_type: "bonus",
        description: "Annual Performance Bonus",
        monthly_amount: "800",
        income_frequency: "annual",
      },
    ],
    assets: [
      {
        asset_type: "savings",
        institution_name: "State Bank of India",
        value: "15000",
        ownership_type: "individual",
      },
      {
        asset_type: "investment",

        institution_name: "Zerodha",

        value: 45000.0,

        ownership_type: "joint",
      },
    ],
    liabilities: [
      {
        liability_type: "auto_loan",
        creditor_name: "HDFC Bank",
        outstanding_balance: "12000",
        monthly_payment: "350",
        months_remaining: "36",
        co_signed: false,
        federal_debt: false,
        delinquent: false,
      },
    ],
  },
  documents: {},
};

const initialFormData = isFillDefaults
  ? defaultFormData
  : {
      loan: {
        loan_type: "",
        credit_type: "individual",
        loan_purpose: "",
        requested_amount: "",
        requested_term_months: "",
        preferred_payment_day: "",
        origination_channel: "",
        application_status: "submitted",
      },
      applicant: {
        applicant_role: "primary",
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        date_of_birth: "",
        gender: "",
        phone_number: "",
        pan_number: "",
        aadhaar_no: "",
        father_name: "",
        mother_name: "",
        citizenship_status: "",
        email: "",
        addresses: [],
        employment: {},
        incomes: [],
        assets: [],
        liabilities: [],
      },
      documents: {},
    };

const steps = [
  { path: "loan-details", title: "Loan Details", description: "Basic loan information" },
  { path: "applicant-info", title: "Applicant Info", description: "Personal details" },
  { path: "address", title: "Address", description: "Contact information" },
  { path: "employment", title: "Employment", description: "Work details" },
  { path: "income", title: "Additional Income", description: "Other income sources" },
  { path: "assets-liabilities", title: "Assets & Liabilities", description: "Financial overview" },
  { path: "review", title: "Review & Submit", description: "Final review" },
];

const stepPath = (index) => `/apply/${steps[index].path}`;

// Mirrors the original single-component if/else waterfall's priority order,
// but expressed as "which route the current state implies" instead of
// "which screen to render" — used to keep the URL in sync with app state,
// and to recover cleanly on refresh (see applicationStorage.js).
function resolveGatePath({
  disbursementReceipt,
  pipelinePhase,
  applicationId,
  pipelineComplete,
  pipelineDecision,
  documentsComplete,
}) {
  if (disbursementReceipt) return "/apply/receipt";
  if (applicationId && pipelinePhase === "awaiting_signature") return "/apply/sign";
  if (applicationId && pipelineComplete && pipelineDecision) return "/apply/decision";
  if (applicationId && !documentsComplete) return "/apply/documents";
  if (applicationId && documentsComplete && !pipelineComplete) return "/apply/processing";
  return null; // no application in flight — the 7-step form is the active region
}

const ApplicationFlow = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [saved] = useState(() => loadApplication());

  const [formData, setFormData] = useState(() => saved?.formData || initialFormData);
  const [applicationId, setApplicationId] = useState(() => saved?.applicationId || null);
  const [documentsComplete, setDocumentsComplete] = useState(() => saved?.documentsComplete || false);
  // Steps the user has successfully validated/saved — persists independently
  // of which step is currently being viewed, so navigating back to review a
  // completed step never disables steps completed after it.
  const [completedSteps, setCompletedSteps] = useState(
    () => new Set(saved?.completedSteps || []),
  );
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [pipelineDecision, setPipelineDecision] = useState(null);
  const [disbursementLoading, setDisbursementLoading] = useState(false);
  const [disbursementReceipt, setDisbursementReceipt] = useState(null);
  const [pipelinePhase, setPipelinePhase] = useState(null); // 'awaiting_signature' | null
  const [acceptedTerms, setAcceptedTerms] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTriggeringVerification, setIsTriggeringVerification] = useState(false);

  // Debounced refresh-persistence — only the fields needed to resume the
  // 7-step form or reconnect to an in-flight application are saved; anything
  // downstream of the SSE pipeline is intentionally left in-memory only.
  const saveTimer = useRef(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveApplication({
        applicationId,
        formData,
        documentsComplete,
        completedSteps: Array.from(completedSteps),
      });
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [applicationId, formData, documentsComplete, completedSteps]);

  const resetApplication = useCallback(() => {
    clearApplication();
    // A hard reload (not just resetting state + SPA navigation) so every
    // component remounts fresh — no leftover in-flight/loading state from
    // whatever screen "Start New Application" was clicked from.
    window.location.href = stepPath(0);
  }, []);

  const handleLoanChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      loan: {
        ...prev.loan,
        [name]: value,
      },
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "documents") {
      setFormData((prev) => ({
        ...prev,
        documents: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      applicant: {
        ...prev.applicant,
        [name]: value,
      },
    }));
  };

  const validateStep = (step) => {
    const errors = [];

    if (step === 0) {
      const loan = formData.loan;
      if (!loan.loan_type) errors.push('Loan Type is required');
      if (!loan.credit_type) errors.push('Credit Type is required');
      if (!loan.loan_purpose?.trim()) errors.push('Loan Purpose is required');
      if (!loan.requested_amount || Number(loan.requested_amount) <= 0)
        errors.push('Requested Amount must be greater than 0');
      if (!loan.requested_term_months || Number(loan.requested_term_months) <= 0)
        errors.push('Requested Term (months) must be greater than 0');
      const pd = Number(loan.preferred_payment_day);
      if (!loan.preferred_payment_day || pd < 1 || pd > 30)
        errors.push('Preferred Payment Day must be between 1 and 30');
      if (!loan.origination_channel) errors.push('Origination Channel is required');
    }

    if (step === 1) {
      const a = formData.applicant;
      if (!a.first_name?.trim()) errors.push('First Name is required');
      if (!a.last_name?.trim()) errors.push('Last Name is required');
      if (!a.date_of_birth) errors.push('Date of Birth is required');
      if (!a.gender) errors.push('Gender is required');
      if (!a.pan_number) errors.push('PAN Number is required');
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(a.pan_number))
        errors.push('PAN Number format must be ABCDE1234F');
      if (!a.aadhaar_no) errors.push('Aadhaar Number is required');
      else if (a.aadhaar_no.replace(/\D/g, '').length !== 12)
        errors.push('Aadhaar Number must be exactly 12 digits');
      if (!a.email?.trim()) errors.push('Email Address is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email))
        errors.push('Please enter a valid email address');
    }

    if (step === 2) {
      const addresses = formData.applicant.addresses || [];
      if (addresses.length === 0) {
        errors.push('At least one address is required');
      } else {
        addresses.forEach((addr, i) => {
          const n = i + 1;
          if (!addr.address_line1?.trim()) errors.push(`Address ${n}: Address Line 1 is required`);
          if (!addr.city?.trim()) errors.push(`Address ${n}: City is required`);
          if (!addr.state) errors.push(`Address ${n}: State is required`);
          if (!addr.zip_code || String(addr.zip_code).replace(/\D/g, '').length !== 6)
            errors.push(`Address ${n}: Valid 6-digit PIN Code is required`);
          if (!addr.housing_status) errors.push(`Address ${n}: Housing Status is required`);
          if (addr.years_at_address === '' || addr.years_at_address === undefined)
            errors.push(`Address ${n}: Years at Address is required`);
          if (addr.months_at_address === '' || addr.months_at_address === undefined)
            errors.push(`Address ${n}: Months at Address is required`);
        });
      }
    }

    if (step === 4) {
      (formData.applicant.incomes || []).forEach((income, i) => {
        const n = i + 1;
        if (!income.income_type) errors.push(`Income ${n}: Income Type is required`);
        if (!income.monthly_amount || Number(income.monthly_amount) <= 0)
          errors.push(`Income ${n}: Monthly Amount must be greater than 0`);
      });
    }

    if (step === 5) {
      (formData.applicant.assets || []).forEach((a, i) => {
        const n = i + 1;
        if (!a.asset_type) errors.push(`Asset ${n}: Asset Type is required`);
        if (!a.value || Number(a.value) <= 0) errors.push(`Asset ${n}: Value must be greater than 0`);
      });
      (formData.applicant.liabilities || []).forEach((l, i) => {
        const n = i + 1;
        if (!l.liability_type) errors.push(`Liability ${n}: Liability Type is required`);
        if (!l.outstanding_balance || Number(l.outstanding_balance) <= 0)
          errors.push(`Liability ${n}: Outstanding Balance must be greater than 0`);
        if (!l.monthly_payment || Number(l.monthly_payment) <= 0)
          errors.push(`Liability ${n}: Monthly Payment must be greater than 0`);
        if (!l.months_remaining || Number(l.months_remaining) <= 0)
          errors.push(`Liability ${n}: Months Remaining must be greater than 0`);
      });
    }

    return errors;
  };

  const currentStepIndex = steps.findIndex((s) => location.pathname === `/apply/${s.path}`);

  // The furthest step the user has unlocked so far: either the step they're
  // currently viewing, or one past the last completed step — whichever is
  // greater. This only ever grows (aside from an explicit reset), so
  // navigating backward to review a completed step never shrinks it and
  // never disables steps completed after it.
  const furthestStepIndex = Math.max(
    currentStepIndex,
    completedSteps.size ? Math.max(...completedSteps) + 1 : 0,
  );

  const markStepCompleted = (stepIndex) => {
    setCompletedSteps((prev) => {
      if (prev.has(stepIndex)) return prev;
      const next = new Set(prev);
      next.add(stepIndex);
      return next;
    });
  };

  const handleNext = () => {
    const errors = validateStep(currentStepIndex);
    if (errors.length > 0) {
      errors.forEach((msg) => toast.error(msg));
      return;
    }
    markStepCompleted(currentStepIndex);
    if (currentStepIndex < steps.length - 1) {
      navigate(stepPath(currentStepIndex + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      navigate(stepPath(currentStepIndex - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (stepIndex) => {
    // Defensive: only the active step and previously-completed/unlocked
    // steps are navigable, regardless of how this is invoked (sidebar,
    // review-screen "edit" links, etc).
    if (stepIndex > furthestStepIndex) return;
    navigate(stepPath(stepIndex));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      request_id: crypto.randomUUID(),
      callback_url: "",
      app_id: crypto.randomUUID(),
      payload: {},
      ...formData.loan,
      requested_amount: Number(formData.loan.requested_amount),
      requested_term_months: Number(formData.loan.requested_term_months),
      preferred_payment_day: Number(formData.loan.preferred_payment_day),
      applicants: [
        {
          ...formData.applicant,
          pan_number: formData.applicant.pan_number,
          pan_last4: formData.applicant.pan_number
            ? formData.applicant.pan_number.slice(-4)
            : "",
          aadhaar_no: formData.applicant.aadhaar_no,
          aadhaar_last4: formData.applicant.aadhaar_no
            ? formData.applicant.aadhaar_no.replace(/\D/g, "").slice(-4)
            : "",
          employment:
            Object.keys(formData.applicant.employment || {}).length === 0
              ? null
              : formData.applicant.employment,
          incomes: formData.applicant.incomes.map((income) => ({
            ...income,
            monthly_amount: Number(income.monthly_amount),
          })),
          assets: formData.applicant.assets.map((asset) => ({
            ...asset,
            value: Number(asset.value),
          })),
          liabilities: formData.applicant.liabilities.map((liability) => ({
            ...liability,
            outstanding_balance: Number(liability.outstanding_balance),
            monthly_payment: Number(liability.monthly_payment),
            months_remaining: Number(liability.months_remaining),
          })),
        },
      ],
    };

    try {
      const response = await apiClient.post(
        "/loan_intake/submit_application",
        payload,
      );
      const backendApplicationId =
        response.data.application_id || crypto.randomUUID();

      markStepCompleted(currentStepIndex);
      setApplicationId(backendApplicationId);
      setDocumentsComplete(false);
      setPipelineComplete(false);
      setPipelineDecision(null);
      toast.success("Application submitted successfully!");
      navigate("/apply/documents");
    } catch (error) {
      console.error("Loan submission failed:", error);

      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          error.response.data.detail.forEach((entry) => {
            toast.error(entry.msg || entry);
          });
        } else {
          toast.error(error.response.data.detail);
        }
      } else {
        toast.error("Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePipelineComplete = useCallback((decision) => {
    setPipelineDecision(decision);
    setPipelineComplete(true);
    navigate("/apply/decision");
  }, [navigate]);

  // Triggers orchestrator and advances to pipeline on success
  const handleDocumentsComplete = useCallback(async () => {
    if (isTriggeringVerification) return;
    setIsTriggeringVerification(true);
    // Build raw_application to match backend schema
    const { loan, applicant } = formData;
    const raw_application = {
      ...loan,
      applicants: [
        {
          ...applicant,
          incomes: (applicant.incomes || []).map((income) => ({
            ...income,
            monthly_amount: Number(income.monthly_amount),
          })),
          assets: (applicant.assets || []).map((asset) => ({
            ...asset,
            value: Number(asset.value),
          })),
          liabilities: (applicant.liabilities || []).map((liability) => ({
            ...liability,
            outstanding_balance: Number(liability.outstanding_balance),
            monthly_payment: Number(liability.monthly_payment),
            months_remaining: Number(liability.months_remaining),
          })),
        },
      ],
    };
    try {
      await apiClient.post("/loan_intake/trigger_orchestrator", {
        application_id: applicationId,
        raw_application,
      });
      setDocumentsComplete(true);
      toast.success("Documents uploaded successfully. Starting verification.");
      navigate("/apply/processing");
    } catch (error) {
      console.error("Failed to trigger orchestrator:", error);
      toast.error("Failed to start verification. Please try again.");
    } finally {
      setIsTriggeringVerification(false);
    }
  }, [applicationId, formData, navigate, isTriggeringVerification]);

  const handleDecisionConfirm = useCallback(
    async (selectedTerms) => {
      if (pipelineDecision?.isNewCounterOfferFlow) {
        // New counter-offer flow: select specific option → signature
        setDisbursementLoading(true);
        try {
          await orchestratorClient.post(
            `/pipeline/${applicationId}/select-counter-offer`,
            { option_id: selectedTerms.option_id },
          );
          setAcceptedTerms(selectedTerms);
          setPipelinePhase("awaiting_signature");
          navigate("/apply/sign");
        } catch (error) {
          console.error("Counter offer selection failed:", error);
          toast.error(
            error.response?.data?.detail || "Failed to select offer. Please retry.",
          );
        } finally {
          setDisbursementLoading(false);
        }
        return;
      }

      if (pipelineDecision?.isHITLBankDecision) {
        // HITL flow: accept bank offer → show signature screen
        setDisbursementLoading(true);
        try {
          await orchestratorClient.post(`/pipeline/${applicationId}/accept`);
          setAcceptedTerms(selectedTerms);
          setPipelinePhase("awaiting_signature");
          navigate("/apply/sign");
        } catch (error) {
          console.error("Accept failed:", error);
          toast.error(
            error.response?.data?.detail || "Failed to accept offer. Please retry.",
          );
        } finally {
          setDisbursementLoading(false);
        }
        return;
      }

      // Legacy direct-disbursement flow (non-HITL / demo)
      const approvedAmount = Number(
        selectedTerms.amount || selectedTerms.approved_amount || 0,
      );
      const payload = {
        application_id: applicationId,
        approved_amount: approvedAmount,
        approved_tenure_months: Number(
          selectedTerms.term_months ||
            selectedTerms.approved_tenure_months ||
            0,
        ),
        interest_rate: Number(selectedTerms.interest_rate || 0),
        disbursement_amount: Number(
          selectedTerms.disbursement_amount ||
            approvedAmount - approvedAmount * 0.02,
        ),
        explanation:
          selectedTerms.terms_summary || selectedTerms.description || null,
      };

      setDisbursementLoading(true);
      try {
        const receipt = await callDisburse(payload);
        const normalized = normalizeReceipt(receipt);

        if (getDisbursementOutcome(normalized) === "failed") {
          // Never let a failed disbursement masquerade as a success receipt.
          toast.error(
            normalized?.explanation ||
              "Disbursement could not be completed. Please contact support.",
          );
          setPipelineDecision(buildDeclinedDecision(normalized, applicationId));
          navigate("/apply/decision");
          return;
        }

        setDisbursementReceipt(normalized);
        toast.success("Funds disbursed successfully!");
        navigate("/apply/receipt");
      } catch (error) {
        console.error("Disbursement failed:", error);
        toast.error(
          error.response?.data?.detail ||
            "Disbursement failed. Please try again.",
        );
      } finally {
        setDisbursementLoading(false);
      }
    },
    [applicationId, pipelineDecision, navigate],
  );

  const handleDecisionDecline = useCallback(async () => {
    if (pipelineDecision?.isNewCounterOfferFlow) {
      try {
        await orchestratorClient.post(`/pipeline/${applicationId}/decline-all-offers`);
      } catch {
        // best-effort; session will expire on its own
      }
      toast.info("All counter offers declined.");
      resetApplication();
      return;
    }
    if (pipelineDecision?.isHITLBankDecision) {
      try {
        await orchestratorClient.post(`/pipeline/${applicationId}/decline`);
      } catch {
        // best-effort; pipeline state will eventually expire
      }
    }
    toast.info("All offers declined. Starting a new application.");
    resetApplication();
  }, [applicationId, pipelineDecision, resetApplication]);

  const gatePath = resolveGatePath({
    disbursementReceipt,
    pipelinePhase,
    applicationId,
    pipelineComplete,
    pipelineDecision,
    documentsComplete,
  });

  // Keep the URL in sync with what the current application state actually
  // supports — mirrors the original if/else waterfall's priority order.
  if (gatePath) {
    if (location.pathname !== gatePath) {
      return <Navigate to={gatePath} replace />;
    }

    if (gatePath === "/apply/receipt") {
      // Owns its own full-width page shell, like Documents/Processing/the
      // approved-decision page.
      return (
        <DisbursementReceiptScreen
          receipt={disbursementReceipt}
          onReset={resetApplication}
        />
      );
    }

    if (gatePath === "/apply/sign") {
      // Owns its own full-width page shell, like Documents/Decision/Receipt.
      return (
        <SignatureScreen
          applicationId={applicationId}
          terms={acceptedTerms}
          onComplete={(receipt) => {
            const normalized = normalizeReceipt(receipt);
            setPipelinePhase(null);

            if (getDisbursementOutcome(normalized) === "failed") {
              // Never let a failed disbursement masquerade as a success receipt.
              toast.error(
                normalized?.explanation ||
                  "We couldn't complete disbursement after signing. Please contact support.",
              );
              setPipelineDecision(buildDeclinedDecision(normalized, applicationId));
              navigate("/apply/decision");
              return;
            }

            setDisbursementReceipt(normalized);
            navigate("/apply/receipt");
          }}
        />
      );
    }

    if (gatePath === "/apply/decision") {
      if (disbursementLoading) {
        const isAccepting =
          pipelineDecision?.isNewCounterOfferFlow || pipelineDecision?.isHITLBankDecision;
        return (
          <div className="aj-page decision-page">
            <div className="aj-topbar">
              <button type="button" className="aj-topbar-btn" disabled>
                <DecisionArrowLeftIcon /> Back
              </button>
              <button
                type="button"
                className="aj-topbar-btn"
                onClick={() =>
                  toast.info("Our support team is available in-app any time — we're here if you need us.")
                }
              >
                Need Help?
              </button>
            </div>

            <div className="decision-processing">
              <span className="aj-orb" aria-hidden="true">
                <span className="aj-orb-core" />
              </span>
              <h1 className="aj-hero-title">{isAccepting ? "Accepting Offer" : "Disbursing Funds"}</h1>
              <p className="aj-hero-subtitle">
                {isAccepting
                  ? "Confirming your acceptance with the bank…"
                  : "Executing fund transfer and generating your receipt…"}
              </p>
            </div>
          </div>
        );
      }

      // The approved-offer and declined branches own their own full-width
      // page shell (like Documents/Processing); COUNTER_OFFER/DISBURSED/
      // fallback still use the shared narrow-card shell.
      if (pipelineDecision?.decision === "APPROVED" || pipelineDecision?.decision === "DECLINED") {
        return (
          <DecisionScreen
            decision={pipelineDecision}
            onConfirm={handleDecisionConfirm}
            onDecline={handleDecisionDecline}
            onReset={resetApplication}
          />
        );
      }

      return (
        <div className="pipeline-page-shell">
          <DecisionScreen
            decision={pipelineDecision}
            onConfirm={handleDecisionConfirm}
            onDecline={handleDecisionDecline}
            onReset={resetApplication}
          />
        </div>
      );
    }

    if (gatePath === "/apply/documents") {
      // A dedicated, full-width post-submission stage — DocumentUpload owns
      // its entire page shell (header, layout, footer), not another step
      // inside the 7-step form.
      return (
        <DocumentUpload
          formData={formData}
          onChange={handleChange}
          applicationId={applicationId}
          onContinue={handleDocumentsComplete}
          isContinuing={isTriggeringVerification}
        />
      );
    }

    if (gatePath === "/apply/processing") {
      return (
        <PipelineScreen
          key={applicationId}
          applicationId={applicationId}
          onComplete={handlePipelineComplete}
        />
      );
    }
  }

  // No application in flight — the 7-step form is the active region.
  if (currentStepIndex === -1) {
    return <Navigate to={stepPath(0)} replace />;
  }

  const renderStep = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <LoanDetails formData={formData.loan} onChange={handleLoanChange} />
        );
      case 1:
        return (
          <ApplicantInfo
            formData={formData.applicant}
            onChange={handleChange}
          />
        );
      case 2:
        return (
          <AddressInfo formData={formData.applicant} onChange={handleChange} />
        );
      case 3:
        return (
          <EmploymentDetails
            formData={formData.applicant}
            onChange={handleChange}
          />
        );
      case 4:
        return (
          <IncomeInfo formData={formData.applicant} onChange={handleChange} />
        );
      case 5:
        return (
          <AssetsLiabilities
            formData={formData.applicant}
            onChange={handleChange}
          />
        );
      case 6:
        return <ReviewSubmit formData={formData} onEdit={handleStepClick} />;
      default:
        return null;
    }
  };

  return (
    <AppShell
      steps={steps}
      currentStep={currentStepIndex}
      completedSteps={completedSteps}
      furthestStepIndex={furthestStepIndex}
      onStepClick={handleStepClick}
    >
      <form onSubmit={handleSubmit}>
        {renderStep()}

        <div className="app-shell-nav">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSubmitting}
          >
            Back
          </Button>

          {currentStepIndex === steps.length - 1 ? (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleNext}>
              Continue
            </Button>
          )}
        </div>
      </form>
    </AppShell>
  );
};

const DecisionArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ApplicationFlow;

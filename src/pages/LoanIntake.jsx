import React, { useCallback, useState } from "react";
import { isFillDefaults } from "../config/env";
import { toast } from "react-toastify";
import apiClient from "../api/client";
import Sidebar from "../components/Sidebar";
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
    pan_number: "ELWPM8089J",
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
  { title: "Loan Details", description: "Basic loan information" },
  { title: "Applicant Info", description: "Personal details" },
  { title: "Address", description: "Contact information" },
  { title: "Employment", description: "Work details" },
  { title: "Additional Income", description: "Other income sources" },
  { title: "Assets & Liabilities", description: "Financial overview" },
  { title: "Review & Submit", description: "Final review" },
];

const LoanIntake = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [applicationId, setApplicationId] = useState(null);
  const [documentsComplete, setDocumentsComplete] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [pipelineDecision, setPipelineDecision] = useState(null);
  const [disbursementLoading, setDisbursementLoading] = useState(false);
  const [disbursementReceipt, setDisbursementReceipt] = useState(null);
  const [pipelinePhase, setPipelinePhase] = useState(null); // 'awaiting_signature' | null
  const [acceptedTerms, setAcceptedTerms] = useState(null);

  const resetApplication = useCallback(() => {
    setApplicationId(null);
    setDocumentsComplete(false);
    setPipelineComplete(false);
    setPipelineDecision(null);
    setDisbursementLoading(false);
    setDisbursementReceipt(null);
    setPipelinePhase(null);
    setAcceptedTerms(null);
    setCurrentStep(0);
    setFormData(initialFormData);
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((value) => !value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      setApplicationId(backendApplicationId);
      setDocumentsComplete(false);
      setPipelineComplete(false);
      setPipelineDecision(null);
      toast.success("Application submitted successfully!");
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
    }
  };

  const handlePipelineComplete = useCallback((decision) => {
    setPipelineDecision(decision);
    setPipelineComplete(true);
  }, []);

  // Triggers orchestrator and advances to pipeline on success
  const handleDocumentsComplete = useCallback(async () => {
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
    } catch (error) {
      console.error("Failed to trigger orchestrator:", error);
      toast.error("Failed to start verification. Please try again.");
    }
  }, [applicationId, formData]);

  const handleDecisionConfirm = useCallback(
    async (selectedTerms) => {
      if (pipelineDecision?.isHITLBankDecision) {
        // HITL flow: accept bank offer → show signature screen
        setDisbursementLoading(true);
        try {
          await orchestratorClient.post(`/pipeline/${applicationId}/accept`);
          setAcceptedTerms(selectedTerms);
          setPipelinePhase("awaiting_signature");
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
        setDisbursementReceipt(receipt);
        toast.success("Funds disbursed successfully!");
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
    [applicationId, pipelineDecision],
  );

  const handleDecisionDecline = useCallback(async () => {
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

  const renderStep = () => {
    switch (currentStep) {
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

  if (disbursementReceipt) {
    return (
      <div style={{ minHeight: "100vh", padding: "var(--spacing-2xl)" }}>
        <DisbursementReceiptScreen
          receipt={disbursementReceipt}
          onReset={resetApplication}
        />
      </div>
    );
  }

  if (applicationId && pipelinePhase === "awaiting_signature") {
    return (
      <div style={{ minHeight: "100vh", padding: "var(--spacing-2xl)" }}>
        <SignatureScreen
          applicationId={applicationId}
          terms={acceptedTerms}
          onComplete={(receipt) => {
            setDisbursementReceipt(receipt);
            setPipelinePhase(null);
          }}
        />
      </div>
    );
  }

  if (applicationId && pipelineComplete && pipelineDecision) {
    if (disbursementLoading) {
      return (
        <div style={{ minHeight: "100vh", padding: "var(--spacing-2xl)" }}>
          <div className="pipeline-shell fade-in">
            <div
              className="card decision-screen"
              style={{ textAlign: "center" }}
            >
              <div className="decision-hero">
                <span className="decision-badge">Processing</span>
                <h2 className="card-title">
                  {pipelineDecision?.isHITLBankDecision
                    ? "Accepting Offer"
                    : "Disbursing Funds"}
                </h2>
                <p className="card-subtitle">
                  {pipelineDecision?.isHITLBankDecision
                    ? "Confirming your acceptance with the bank…"
                    : "Executing fund transfer and generating your receipt…"}
                </p>
              </div>
              <div
                style={{
                  margin: "var(--spacing-xl) auto",
                  width: 40,
                  height: 40,
                  border: "3px solid var(--border-color)",
                  borderTopColor: "var(--primary-color)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: "100vh", padding: "var(--spacing-2xl)" }}>
        <DecisionScreen
          decision={pipelineDecision}
          onConfirm={handleDecisionConfirm}
          onDecline={handleDecisionDecline}
          onReset={resetApplication}
        />
      </div>
    );
  }

  if (applicationId && !documentsComplete) {
    return (
      <div style={{ minHeight: "100vh", padding: "var(--spacing-2xl)" }}>
        <DocumentUpload
          formData={formData}
          onChange={handleChange}
          applicationId={applicationId}
          onContinue={handleDocumentsComplete}
        />
      </div>
    );
  }

  if (applicationId && documentsComplete && !pipelineComplete) {
    return (
      <div style={{ minHeight: "100vh", padding: "var(--spacing-2xl)" }}>
        <PipelineScreen
          key={applicationId}
          applicationId={applicationId}
          onComplete={handlePipelineComplete}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        currentStep={currentStep}
        steps={steps}
        onStepClick={handleStepClick}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        style={{
          marginLeft: isCollapsed ? "60px" : "280px",
          flex: 1,
          padding: "var(--spacing-2xl)",
          maxWidth: "1200px",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        <form onSubmit={handleSubmit}>
          {renderStep()}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--spacing-xl)",
              gap: "var(--spacing-md)",
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            {currentStep === 6 ? (
              <Button type="submit" variant="primary">
                Submit Form
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanIntake;

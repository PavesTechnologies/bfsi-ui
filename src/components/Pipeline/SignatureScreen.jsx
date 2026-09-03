import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import orchestratorClient from "../../api/orchestratorClient";
import Button from "../FormElements/Button";
import Input from "../FormElements/Input";
import "../../styles/applicationJourney.css";

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtDate = (date) =>
  date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

const IMPORTANT_TERMS = [
  "This agreement is legally binding once signed and cannot be reversed.",
  "Repayments are due on the schedule shown in your loan terms — late payments may incur additional fees.",
  "You may prepay or foreclose the loan in part or in full, subject to the lender's prepayment terms.",
  "The lender will disburse the approved amount to your registered bank account after signing is complete.",
];

const DetailRow = ({ label, value, primary = false }) => (
  <div className={`decision-offer-row${primary ? " decision-offer-row--primary" : ""}`}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 1.5h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" strokeLinejoin="round" />
    <path d="M10 1.5v3h3" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm2 5H6V4a2 2 0 1 1 4 0v2z" />
  </svg>
);

const SignatureScreen = ({ applicationId, terms, onComplete }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreementExpanded, setAgreementExpanded] = useState(false);

  const readyToSign = Boolean(fullName.trim()) && agreed;

  const agreementNumber = applicationId
    ? `AGR-${applicationId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
    : "—";
  const agreementDate = fmtDate(new Date());

  const handleSign = async () => {
    if (!fullName.trim() || !agreed) return;
    setLoading(true);
    try {
      const res = await orchestratorClient.post(
        `/pipeline/${applicationId}/signature`,
        {
          full_name: fullName.trim(),
          agreed: true,
          ip: null,
          user_agent: navigator.userAgent,
        },
      );
      // Pass the whole envelope, not just the nested receipt — its outer
      // `status` can disagree with the receipt's own status and must not
      // be silently dropped before normalizeReceipt gets a chance to see it.
      onComplete(res.data);
    } catch (e) {
      toast.error(
        e.response?.data?.detail || "Signature submission failed. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNeedHelp = () => {
    toast.info("Our support team is available in-app any time — we're here if you need us.");
  };

  return (
    <div className="aj-page sign-page">
      <div className="aj-topbar">
        <button type="button" className="aj-topbar-btn" onClick={() => navigate(-1)}>
          <ArrowLeftIcon /> Back
        </button>
        <button type="button" className="aj-topbar-btn" onClick={handleNeedHelp}>
          Need Help?
        </button>
      </div>

      <div className="aj-hero">
        <span className="aj-success-badge">
          <DocIcon /> Loan Agreement
        </span>
        <h1 className="aj-hero-title">Review and sign your loan agreement</h1>
        <p className="aj-hero-subtitle">
          Your loan has been approved. Please review the agreement and sign it to continue with the disbursement process.
        </p>
      </div>

      <div className="sign-layout">
        <section className="receipt-panel" aria-label="Agreement details">
          <h2 className="doc-panel-heading">Loan Summary</h2>
          {terms ? (
            <dl className="decision-offer-list">
              <DetailRow label="Approved Amount" value={`₹${fmt(terms.amount)}`} primary />
              <DetailRow label="Loan Duration" value={`${terms.term_months} months`} />
              <DetailRow label="Interest Rate" value={`${terms.interest_rate}% p.a.`} />
              <DetailRow label="Monthly EMI" value={`₹${fmt(terms.monthly_payment)}`} />
              {terms.total_repayment != null && (
                <DetailRow label="Total Repayment" value={`₹${fmt(terms.total_repayment)}`} />
              )}
            </dl>
          ) : (
            <p className="decision-offer-empty">Loan terms were not included in the event payload.</p>
          )}

          <h2 className="doc-panel-heading sign-section-heading">Agreement Information</h2>
          <dl className="decision-offer-list">
            <DetailRow label="Agreement Number" value={agreementNumber} />
            <DetailRow label="Agreement Date" value={agreementDate} />
          </dl>

          <button
            type="button"
            className="receipt-schedule-link"
            onClick={() => setAgreementExpanded((v) => !v)}
          >
            {agreementExpanded ? "Hide Complete Agreement ↑" : "View Complete Agreement →"}
          </button>

          {agreementExpanded && (
            <div className="sign-terms-block">
              <h3 className="sign-terms-heading">Important Terms</h3>
              <ul className="sign-terms-list">
                {IMPORTANT_TERMS.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="sign-action-panel" aria-label="Sign agreement">
          <h2 className="doc-panel-heading">Ready to sign?</h2>
          <p className="sign-action-desc">
            By signing this agreement, you confirm that you have reviewed and accepted the loan terms and conditions.
          </p>

          <div className="sign-input-group">
            <Input
              label="Full Name (as per your ID)"
              name="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full legal name"
              required
            />
          </div>

          <label className="sign-agreement-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I have read, understood, and agree to the loan terms stated above.
              I authorise the bank to disburse the approved amount to my
              registered account as per the agreement.
            </span>
          </label>

          <span className="sign-secure-note">
            <LockIcon />
            256-bit encrypted &middot; legally binding e-signature
          </span>

          <div className="sign-cta-block">
            <Button
              type="button"
              variant="primary"
              onClick={handleSign}
              disabled={!readyToSign || loading}
              loading={loading}
            >
              {loading ? "Signing…" : "Sign & Continue"}
            </Button>
            <p className="decision-footer-note">
              After signing, your loan will proceed to the disbursement process.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SignatureScreen;

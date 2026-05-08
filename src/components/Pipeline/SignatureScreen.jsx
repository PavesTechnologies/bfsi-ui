import React, { useState } from "react";
import { toast } from "react-toastify";
import orchestratorClient from "../../api/orchestratorClient";
import Button from "../FormElements/Button";

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const SignatureScreen = ({ applicationId, terms, onComplete }) => {
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

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
      onComplete(res.data.disbursement_receipt);
    } catch (e) {
      toast.error(
        e.response?.data?.detail || "Signature submission failed. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pipeline-shell fade-in">
      <div className="card decision-screen">
        <div className="decision-hero">
          <span className="decision-badge decision-badge--success">
            Sign Agreement
          </span>
          <h2 className="card-title">Digital Loan Agreement</h2>
          <p className="card-subtitle">
            Review the approved terms and sign to proceed to disbursement.
          </p>
        </div>

        {terms && (
          <div className="decision-summary">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Loan Amount", `₹${fmt(terms.amount)}`],
                  ["Interest Rate", `${terms.interest_rate}% p.a.`],
                  ["Tenure", `${terms.term_months} months`],
                  ["Monthly EMI", `₹${fmt(terms.monthly_payment)}`],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td
                      style={{
                        padding: "6px 0",
                        color: "var(--text-secondary, #6b7280)",
                        fontSize: 14,
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        padding: "6px 0",
                        fontWeight: 600,
                        textAlign: "right",
                        fontSize: 14,
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="decision-summary" style={{ marginTop: "1.25rem" }}>
          <p style={{ marginBottom: "0.5rem", fontWeight: 600, fontSize: 14 }}>
            Full Name (as per your ID)
          </p>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full legal name"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: "1px solid var(--border-color, #e5e7eb)",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div className="decision-summary" style={{ marginTop: "1rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span>
              I have read, understood, and agree to the loan terms stated above.
              I authorise the bank to disburse the approved amount to my
              registered account as per the agreement.
            </span>
          </label>
        </div>

        <div className="decision-actions" style={{ marginTop: "1.5rem" }}>
          <Button
            type="button"
            variant="primary"
            onClick={handleSign}
            disabled={!fullName.trim() || !agreed || loading}
          >
            {loading ? "Submitting…" : "Sign & Proceed to Disbursement"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignatureScreen;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../FormElements/Button';
import OfferCard from './OfferCard';
import { ApprovedIcon, ReviewIcon, InfoNeededIcon, DeclinedIcon } from './StatusIcons';
import '../../styles/applicationJourney.css';

const ERROR_LIKE_DECISIONS = ['DECLINED', 'ERROR'];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DecisionScreen = ({ decision, onConfirm, onDecline, onReset }) => {
  const navigate = useNavigate();
  const [isDeclining, setIsDeclining] = useState(false);
  const decisionType = decision?.decision;

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onDecline();
    } finally {
      setIsDeclining(false);
    }
  };

  const handleNeedHelp = () => {
    toast.info("Our support team is available in-app any time — we're here if you need us.");
  };

  if (decisionType === 'APPROVED') {
    const terms = decision.approvedTerms;
    return (
      <div className="aj-page decision-page">
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
            <ApprovedIcon /> Application Approved
          </span>
          <h1 className="aj-hero-title">Your application is approved</h1>
          <p className="aj-hero-subtitle">
            Your loan application has been reviewed and approved. Review your approved offer and accept the terms to proceed with disbursement.
          </p>
        </div>

        {decision.reason && (
          <div className="decision-approval-note">
            <ApprovedIcon />
            <div>
              <strong>Application Approved</strong>
              <p>{decision.reason}</p>
            </div>
          </div>
        )}

        <div className="decision-layout">
          <section className="decision-offer-panel" aria-label="Approved offer">
            <h2 className="doc-panel-heading">Approved Offer</h2>

            {terms ? (
              <dl className="decision-offer-list">
                <div className="decision-offer-row decision-offer-row--primary">
                  <dt>Loan Amount</dt>
                  <dd>{formatCurrency(terms.amount)}</dd>
                </div>
                <div className="decision-offer-row">
                  <dt>Loan Term</dt>
                  <dd>{terms.term_months} months</dd>
                </div>
                <div className="decision-offer-row">
                  <dt>Interest Rate</dt>
                  <dd>{terms.interest_rate}% p.a.</dd>
                </div>
                {terms.monthly_payment != null && (
                  <div className="decision-offer-row">
                    <dt>Monthly EMI</dt>
                    <dd>{formatCurrency(terms.monthly_payment)}/mo</dd>
                  </div>
                )}
                {terms.disbursement_amount != null && (
                  <div className="decision-offer-row">
                    <dt>Net Disbursement</dt>
                    <dd>{formatCurrency(terms.disbursement_amount)}</dd>
                  </div>
                )}
                {terms.total_repayment != null && (
                  <div className="decision-offer-row">
                    <dt>Total Repayment</dt>
                    <dd>{formatCurrency(terms.total_repayment)}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="decision-offer-empty">
                Your application has been approved. Detailed offer terms were not included in the event payload.
              </p>
            )}

            {terms?.terms_summary && (
              <p className="decision-offer-summary">{terms.terms_summary}</p>
            )}
          </section>

          <section className="decision-next-panel" aria-label="What's next">
            <h2 className="doc-panel-heading">What's Next?</h2>
            <ol className="decision-steps">
              <li>
                <span className="decision-step-index">1</span>
                <div>
                  <strong>Review your offer</strong>
                  <p>Carefully review the approved loan amount, repayment terms, and other conditions.</p>
                </div>
              </li>
              <li>
                <span className="decision-step-index">2</span>
                <div>
                  <strong>Accept the offer</strong>
                  <p>Confirm that you accept the approved loan terms.</p>
                </div>
              </li>
              <li>
                <span className="decision-step-index">3</span>
                <div>
                  <strong>Loan disbursement</strong>
                  <p>Once accepted, the loan will proceed to the disbursement process.</p>
                </div>
              </li>
            </ol>
          </section>
        </div>

        <div className="decision-footer">
          <div className="decision-footer-primary">
            {terms && (
              <Button type="button" variant="primary" onClick={() => onConfirm(terms)}>
                {decision.isHITLBankDecision ? "Accept & Sign Agreement" : "Accept & Continue"}
              </Button>
            )}
            <p className="decision-footer-note">
              By continuing, you confirm that you have reviewed and accepted the approved loan terms.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDecline}
            disabled={isDeclining}
            loading={isDeclining}
          >
            {isDeclining ? "Declining…" : "Decline Offer"}
          </Button>
        </div>
      </div>
    );
  }

  if (decisionType === 'COUNTER_OFFER') {
    const options = decision.counterOfferOptions;
    return (
      <div className="pipeline-shell fade-in">
        <div className="card decision-screen">
          <div className="decision-hero">
            <span className="decision-hero-icon">
              <ReviewIcon />
            </span>
            <span className="decision-badge">Counter Offer</span>
            <h2 className="card-title">We have alternative offers for you</h2>
            <p className="card-subtitle">Your requested amount exceeded our lending capacity. Choose one of the options below.</p>
          </div>

          {decision.reason && (
            <div className="decision-summary">
              <p><strong>Reason:</strong> {decision.reason}</p>
            </div>
          )}

          {options && options.length > 0 ? (
            <div className={`offer-cards-grid${options.length === 1 ? ' offer-cards-grid--single' : ''}`}>
              {options.map((opt, idx) => (
                <OfferCard
                  key={opt.option_id || idx}
                  title={opt.description || `Option ${idx + 1}`}
                  terms={opt}
                  isHighlighted={opt.is_recommended ?? idx === 0}
                  onAccept={() => onConfirm(opt)}
                  ctaLabel={
                    decision.isNewCounterOfferFlow || decision.isHITLBankDecision
                      ? "Accept & Sign Agreement"
                      : "Select This Offer"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="decision-summary">
              <p>Counter offer options were not included in the event payload.</p>
            </div>
          )}

          <div className="decision-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDecline}
              disabled={isDeclining}
              loading={isDeclining}
            >
              {isDeclining ? "Declining…" : "Decline All Offers"}
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              Start New Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (decisionType === 'DISBURSED') {
    return (
      <div className="pipeline-shell fade-in">
        <div className="card decision-screen">
          <div className="decision-hero">
            <span className="decision-hero-icon decision-hero-icon--success">
              <ApprovedIcon />
            </span>
            <span className="decision-badge decision-badge--success">Disbursed</span>
            <h2 className="card-title">Funds have been disbursed</h2>
            <p className="card-subtitle">
              {decision?.reason || 'Your loan was approved and the disbursement completed successfully.'}
            </p>
          </div>

          <div className="decision-summary">
            <p>
              {decision?.disbursementReceipt?.reference_id
                ? `Reference ID: ${decision.disbursementReceipt.reference_id}`
                : 'Your receipt reference will appear here once the backend includes it in the event payload.'}
            </p>
          </div>

          <div className="decision-actions">
            <Button type="button" variant="primary" onClick={onReset}>
              Start New Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (decisionType === 'DECLINED') {
    const reason = decision?.reason || 'We could not extend an offer for this application at this time.';
    // Show every real field the backend returned — but never the raw
    // status strings (disbursement_status/transfer_status/outer_status)
    // themselves; the "Declined" badge above already represents the
    // outcome, and echoing "FAILED" as if it were a data field is exactly
    // the confusing behavior this page must avoid.
    const detailRows = [
      { label: 'Requested Amount', value: decision?.approved_amount != null ? formatCurrency(decision.approved_amount) : null },
      { label: 'Interest Rate', value: decision?.interest_rate != null ? `${decision.interest_rate}% p.a.` : null },
      { label: 'Tenure', value: decision?.tenure_months != null ? `${decision.tenure_months} months` : null },
      { label: 'Disbursement Amount', value: decision?.disbursement_amount != null ? formatCurrency(decision.disbursement_amount) : null },
      { label: 'Origination Fee', value: decision?.origination_fee_deducted != null ? formatCurrency(decision.origination_fee_deducted) : null },
      { label: 'Reference ID', value: decision?.transaction_id || null },
    ].filter((row) => row.value !== null && row.value !== undefined);

    return (
      <div className="aj-page decision-page">
        <div className="aj-topbar">
          <button type="button" className="aj-topbar-btn" onClick={() => navigate(-1)}>
            <ArrowLeftIcon /> Back
          </button>
          <button type="button" className="aj-topbar-btn" onClick={handleNeedHelp}>
            Need Help?
          </button>
        </div>

        <div className="aj-hero">
          <span className="aj-error-badge">
            <DeclinedIcon /> Declined
          </span>
          <h1 className="aj-hero-title">Application Declined</h1>
          <p className="aj-hero-subtitle">We were unable to approve your application.</p>
        </div>

        <div className="decision-approval-note decision-approval-note--error">
          <DeclinedIcon />
          <div>
            <strong>Reason</strong>
            <p>{reason}</p>
          </div>
        </div>

        {detailRows.length > 0 && (
          <div className="decision-declined-details">
            <section className="receipt-panel" aria-label="Application details">
              <h2 className="doc-panel-heading">Application Details</h2>
              <dl className="decision-offer-list">
                {detailRows.map((row) => (
                  <div className="decision-offer-row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        )}

        <div className="receipt-footer receipt-print-hide">
          <Button type="button" variant="primary" onClick={onReset}>
            Start New Application
          </Button>
        </div>
      </div>
    );
  }

  // Fallback for ERROR / DECISION_COMPLETE / unknown — only treat as an
  // error visually when the decision actually indicates one; otherwise
  // present it as a calm, neutral "under review" state.
  const isErrorLike = ERROR_LIKE_DECISIONS.includes(decisionType);
  return (
    <div className={`pipeline-shell fade-in`}>
      <div className={`card decision-screen${isErrorLike ? ' decision-screen--rejected' : ' decision-screen--review'}`}>
        <div className="decision-hero">
          <span className={`decision-hero-icon${isErrorLike ? ' decision-hero-icon--error' : ' decision-hero-icon--warning'}`}>
            {isErrorLike ? <DeclinedIcon /> : <InfoNeededIcon />}
          </span>
          <span className={`decision-badge${isErrorLike ? ' decision-badge--error' : ' decision-badge--warning'}`}>
            {decisionType || 'Decision Complete'}
          </span>
          <h2 className="card-title">Application decision</h2>
          <p className="card-subtitle">{decision?.reason || 'Processing complete.'}</p>
        </div>

        <div className="decision-actions">
          <Button type="button" variant="primary" onClick={onReset}>
            Start New Application
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DecisionScreen;

import Button from '../FormElements/Button';
import OfferCard from './OfferCard';

const DecisionScreen = ({ decision, onConfirm, onDecline, onReset }) => {
  const decisionType = decision?.decision;

  if (decisionType === 'APPROVED') {
    const terms = decision.approvedTerms;
    return (
      <div className="pipeline-shell fade-in">
        <div className="card decision-screen">
          <div className="decision-hero">
            <span className="decision-badge decision-badge--success">Approved</span>
            <h2 className="card-title">Your application is approved</h2>
            <p className="card-subtitle">Review the confirmed terms and accept to proceed to disbursement.</p>
          </div>

          {decision.reason && (
            <div className="decision-summary">
              <p><strong>Reason:</strong> {decision.reason}</p>
            </div>
          )}

          {terms ? (
            <div className="offer-cards-grid offer-cards-grid--single">
              <OfferCard
                title="Approved Offer"
                terms={terms}
                isHighlighted
                onAccept={() => onConfirm(terms)}
                ctaLabel={
                  decision.isHITLBankDecision
                    ? "Accept & Sign Agreement"
                    : "Accept & Proceed to Disbursement"
                }
              />
            </div>
          ) : (
            <div className="decision-summary">
              <p>Your application has been approved. Detailed offer terms were not included in the event payload.</p>
            </div>
          )}

          {terms?.terms_summary && (
            <div className="decision-summary">
              <p>{terms.terms_summary}</p>
            </div>
          )}
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
            <div className="offer-cards-grid" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
              {options.map((opt, idx) => (
                <OfferCard
                  key={opt.option_id || idx}
                  title={opt.description || `Option ${idx + 1}`}
                  terms={opt}
                  isHighlighted={idx === 0}
                  onAccept={() => onConfirm(opt)}
                  ctaLabel={
                    decision.isHITLBankDecision
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
            <Button type="button" variant="secondary" onClick={onDecline}>
              Decline All Offers
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
    return (
      <div className="pipeline-shell fade-in">
        <div className="card decision-screen decision-screen--rejected">
          <div className="decision-hero">
            <span className="decision-badge decision-badge--error">Declined</span>
            <h2 className="card-title">Application Declined</h2>
            <p className="card-subtitle">We were unable to approve your application.</p>
          </div>

          <div className="decision-summary">
            <p><strong>Reason:</strong> {reason}</p>
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

  // Fallback for ERROR / DECISION_COMPLETE / unknown
  return (
    <div className="pipeline-shell fade-in">
      <div className="card decision-screen decision-screen--rejected">
        <div className="decision-hero">
          <span className="decision-badge decision-badge--error">{decisionType || 'Decision Complete'}</span>
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

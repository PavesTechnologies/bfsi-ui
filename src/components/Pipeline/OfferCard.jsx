import React from 'react';
import Button from '../FormElements/Button';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

const OfferRow = ({ label, value, large = false }) => (
  <div className={`offer-row ${large ? 'offer-row--large' : ''}`}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const OfferCard = ({ title, terms, isHighlighted = false, onAccept, ctaLabel }) => {
  if (!terms) {
    return null;
  }

  return (
    <div className={`offer-card ${isHighlighted ? 'offer-card--highlighted' : ''}`}>
      <h3 className="offer-card-title">
        {title}
        {terms.is_recommended && (
          <span className="offer-recommended-badge"> ★ Recommended</span>
        )}
      </h3>
      <dl className="offer-terms">
        <OfferRow label="Loan Amount" value={formatCurrency(terms.amount)} />
        <OfferRow label="Term" value={`${terms.term_months} months`} />
        <OfferRow label="Interest Rate" value={`${terms.interest_rate}% p.a.`} />
        {terms.monthly_payment != null && (
          <OfferRow label="Monthly EMI" value={`${formatCurrency(terms.monthly_payment)}/mo`} large />
        )}
        {terms.disbursement_amount != null && (
          <OfferRow label="Net Disbursement" value={formatCurrency(terms.disbursement_amount)} />
        )}
        {terms.total_repayment != null && (
          <OfferRow label="Total Repayment" value={formatCurrency(terms.total_repayment)} />
        )}
      </dl>
      {onAccept ? (
        <Button type="button" variant="primary" onClick={onAccept}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default OfferCard;

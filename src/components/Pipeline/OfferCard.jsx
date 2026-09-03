import React from 'react';
import Button from '../FormElements/Button';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

const OfferRow = ({ label, value, primary = false }) => (
  <div className={`decision-offer-row${primary ? ' decision-offer-row--primary' : ''}`}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const OfferCard = ({ title, terms, isHighlighted = false, onAccept, ctaLabel }) => {
  if (!terms) {
    return null;
  }

  return (
    <div className={`counter-offer-card${isHighlighted ? ' counter-offer-card--highlighted' : ''}`}>
      <div className="counter-offer-card-head">
        <h3 className="counter-offer-card-title">{title}</h3>
        {terms.is_recommended && (
          <span className="counter-offer-recommended-badge">Recommended</span>
        )}
      </div>
      <dl className="decision-offer-list">
        <OfferRow label="Loan Amount" value={formatCurrency(terms.amount)} primary />
        <OfferRow label="Loan Term" value={`${terms.term_months} months`} />
        <OfferRow label="Interest Rate" value={`${terms.interest_rate}% p.a.`} />
        {terms.monthly_payment != null && (
          <OfferRow label="Monthly EMI" value={`${formatCurrency(terms.monthly_payment)}/mo`} />
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

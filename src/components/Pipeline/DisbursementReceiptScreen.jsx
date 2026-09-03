import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../FormElements/Button';
import { getDisbursementOutcome, looksLikeFailureText } from '../../utils/disbursementReceipt';
import '../../styles/applicationJourney.css';

// Distinguishes "genuinely zero" from "missing" — a mapped-but-absent field
// should read as "—", not a misleading ₹0.
const fmt = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fmtTimestamp = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const DetailRow = ({ label, value, primary = false }) => (
  <div className={`decision-offer-row${primary ? ' decision-offer-row--primary' : ''}`}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
    <path d="M5 8.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExclaimIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 10.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a.5.5 0 0 1 .5.5v7.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 9.293V1.5A.5.5 0 0 1 8 1z" />
    <path d="M2.5 12a.5.5 0 0 1 .5.5v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a.5.5 0 0 1 1 0v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a.5.5 0 0 1 .5-.5z" />
    </svg>
);

// A standalone, print-only document — independent of the on-screen page's
// layout/theme so every downloaded receipt looks the same regardless of
// viewport size or which fields happen to be populated.
const ReceiptPrintTemplate = ({ receipt, statusLabel }) => {
  const {
    application_id,
    transaction_id,
    transfer_status,
    transfer_timestamp,
    approved_amount,
    disbursement_amount,
    origination_fee_deducted,
    interest_rate,
    tenure_months,
    monthly_emi,
    total_interest,
    total_repayment,
    first_emi_date,
  } = receipt;

  return (
    <div className="receipt-print-template">
      <div className="receipt-print-header">
        <span className="receipt-print-brand">Loan Application</span>
        <span className="receipt-print-title">Payment Receipt</span>
      </div>

      <div className="receipt-print-meta">
        <div>
          <span>Application ID</span>
          <strong>{application_id || '—'}</strong>
        </div>
        <div>
          <span>Transaction ID</span>
          <strong>{transaction_id || '—'}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{statusLabel || 'Disbursed'}</strong>
        </div>
        <div>
          <span>Issued On</span>
          <strong>{fmtTimestamp(new Date().toISOString())}</strong>
        </div>
      </div>

      <h3 className="receipt-print-section">Transfer Details</h3>
      <table className="receipt-print-table">
        <tbody>
          <tr>
            <td>Transfer Status</td>
            <td>{transfer_status === 'SUCCESS' || !transfer_status ? 'Successfully Disbursed' : transfer_status}</td>
          </tr>
          <tr>
            <td>Disbursed On</td>
            <td>{fmtTimestamp(transfer_timestamp)}</td>
          </tr>
          <tr>
            <td>Approved Amount</td>
            <td>{fmt(approved_amount)}</td>
          </tr>
          <tr>
            <td>Origination Fee</td>
            <td>{fmt(origination_fee_deducted)}</td>
          </tr>
          <tr className="receipt-print-total">
            <td>Net Amount Disbursed</td>
            <td>{fmt(disbursement_amount)}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="receipt-print-section">Repayment Overview</h3>
      <table className="receipt-print-table">
        <tbody>
          <tr className="receipt-print-total">
            <td>Monthly EMI</td>
            <td>{fmt(monthly_emi)}</td>
          </tr>
          <tr>
            <td>First EMI Date</td>
            <td>{fmtDate(first_emi_date)}</td>
          </tr>
          <tr>
            <td>Loan Duration</td>
            <td>{tenure_months != null ? `${tenure_months} months` : '—'}</td>
          </tr>
          <tr>
            <td>Interest Rate</td>
            <td>{interest_rate != null ? `${interest_rate}% p.a.` : '—'}</td>
          </tr>
          <tr>
            <td>Total Interest</td>
            <td>{fmt(total_interest)}</td>
          </tr>
          <tr>
            <td>Total Repayment</td>
            <td>{fmt(total_repayment)}</td>
          </tr>
        </tbody>
      </table>

      <p className="receipt-print-footer">
        This is a system-generated receipt and does not require a signature.
      </p>
    </div>
  );
};

const COMPLETED_STEPS = [
  'Application Submitted',
  'Identity Verified',
  'Application Approved',
  'Agreement Signed',
  'Funds Disbursed',
];

const DisbursementReceiptScreen = ({ receipt, onReset }) => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!receipt) return null;

  const {
    disbursement_status,
    outer_status,
    transaction_id,
    transfer_status,
    transfer_timestamp,
    approved_amount,
    disbursement_amount,
    origination_fee_deducted,
    interest_rate,
    tenure_months,
    monthly_emi,
    total_interest,
    total_repayment,
    first_emi_date,
    schedule_preview,
    explanation,
  } = receipt;

  const outcome = getDisbursementOutcome(receipt);
  // Mirror the same priority used to decide the outcome itself — the
  // nested receipt's own disbursement_status has been observed to
  // contradict a trustworthy outer envelope status, so whichever field
  // won that decision is also the only one shown to the user. No default
  // baked in here; each branch below supplies its own fallback text.
  const statusLabel = outer_status || disbursement_status || transfer_status || null;

  const handleDownload = () => {
    setIsDownloading(true);
    window.setTimeout(() => {
      window.print();
      setIsDownloading(false);
    }, 500);
  };

  const handleNeedHelp = () => {
    toast.info("Our support team is available in-app any time — we're here if you need us.");
  };

  // The schedule is always rendered when present — this just jumps to it.
  const scrollToSchedule = () => {
    document.getElementById('receipt-schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const topbar = (
    <div className="aj-topbar">
      <button type="button" className="aj-topbar-btn" onClick={() => navigate(-1)}>
        <ArrowLeftIcon /> Back
      </button>
      <button type="button" className="aj-topbar-btn" onClick={handleNeedHelp}>
        Need Help?
      </button>
    </div>
  );

  // A failed/declined outcome must never render as a success receipt — this
  // is a defensive fallback; ApplicationFlow already redirects failed
  // outcomes to the decision screen before a receipt is ever set.
  if (outcome === 'failed') {
    return (
      <div className="aj-page receipt-page">
        {topbar}
        <div className="aj-hero">
          <span className="aj-error-badge">
            <ExclaimIcon /> {statusLabel || 'Disbursement Failed'}
          </span>
          <h1 className="aj-hero-title">We couldn't complete your disbursement</h1>
          <p className="aj-hero-subtitle">
            {explanation || "Something went wrong while transferring your funds. Our team has been notified and will follow up shortly."}
          </p>
          {transaction_id && (
            <div className="receipt-id-row">
              <div className="aj-app-id">
                <span>Reference ID</span>
                <strong>{transaction_id}</strong>
              </div>
            </div>
          )}
        </div>
        <div className="receipt-footer">
          <Button type="button" variant="primary" onClick={handleNeedHelp}>
            Contact Support
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            Start New Application
          </Button>
        </div>
      </div>
    );
  }

  if (outcome === 'pending') {
    return (
      <div className="aj-page receipt-page">
        {topbar}
        <div className="aj-hero">
          <span className="aj-pending-badge">
            <span className="aj-live-dot" aria-hidden="true" /> {statusLabel || 'Processing'}
          </span>
          <h1 className="aj-hero-title">Disbursement in progress</h1>
          <p className="aj-hero-subtitle">
            We're finalizing the transfer of your approved funds. This can take a few minutes — no action is needed from you.
          </p>
          {transaction_id && (
            <div className="receipt-id-row">
              <div className="aj-app-id">
                <span>Transaction ID</span>
                <strong>{transaction_id}</strong>
              </div>
            </div>
          )}
        </div>
        <div className="receipt-footer">
          <Button type="button" variant="secondary" onClick={handleNeedHelp}>
            Contact Support
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            Start New Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="aj-page receipt-page">
      {topbar}

      <div className="aj-hero">
        <span className="aj-success-badge">
          <CheckIcon /> {statusLabel || 'Funds Disbursed'}
        </span>
        <h1 className="aj-hero-title">Your funds have been successfully transferred</h1>
        <p className="aj-hero-subtitle">
          Your loan has been approved, processed, and the funds have been successfully disbursed.
        </p>
        {explanation && !looksLikeFailureText(explanation) && (
          <p className="receipt-explanation">{explanation}</p>
        )}

        <div className="receipt-id-row">
          <div className="aj-app-id">
            <span>Transaction ID</span>
            <strong>{transaction_id || '—'}</strong>
          </div>
        </div>
      </div>

      <div className="receipt-layout">
        <section className="receipt-panel" aria-label="Transfer details">
          <h2 className="doc-panel-heading">Transfer Details</h2>
          <dl className="decision-offer-list">
            <DetailRow
              label="Transfer Status"
              value={
                <span className="receipt-status-pill receipt-status-pill--success">
                  {transfer_status === 'SUCCESS' || !transfer_status ? 'Successfully Disbursed' : transfer_status}
                </span>
              }
            />
            <DetailRow label="Transaction ID" value={transaction_id || '—'} />
            <DetailRow label="Disbursed On" value={fmtTimestamp(transfer_timestamp)} />
            <DetailRow label="Approved Amount" value={fmt(approved_amount)} />
            <DetailRow label="Origination Fee" value={fmt(origination_fee_deducted)} />
            <DetailRow label="Net Amount Disbursed" value={fmt(disbursement_amount)} primary />
          </dl>
        </section>

        <section className="receipt-panel" aria-label="Repayment overview">
          <h2 className="doc-panel-heading">Repayment Overview</h2>
          <div className="receipt-emi-highlight">
            <span className="receipt-emi-value">{fmt(monthly_emi)}</span>
            <span className="receipt-emi-caption">per month</span>
          </div>
          <dl className="decision-offer-list">
            <DetailRow label="First EMI Date" value={fmtDate(first_emi_date)} />
            <DetailRow label="Loan Duration" value={tenure_months != null ? `${tenure_months} months` : '—'} />
            <DetailRow label="Interest Rate" value={interest_rate != null ? `${interest_rate}% p.a.` : '—'} />
            <DetailRow label="Total Interest" value={fmt(total_interest)} />
            <DetailRow label="Total Repayment" value={fmt(total_repayment)} />
          </dl>
        </section>
      </div>

      <div className="receipt-journey">
        <h2 className="doc-panel-heading">Loan Journey</h2>
        <ol className="receipt-journey-list">
          {COMPLETED_STEPS.map((step) => (
            <li className="receipt-journey-item" key={step}>
              <CheckIcon /> {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="receipt-next">
        <h2 className="doc-panel-heading">What's Next?</h2>
        <p className="receipt-next-lead">
          Your first EMI is due on <strong>{fmtDate(first_emi_date)}</strong>.
        </p>
        <p className="receipt-next-note">
          Make sure sufficient funds are available in your linked repayment account before the due date.
        </p>
        {schedule_preview && schedule_preview.length > 0 && (
          <button type="button" className="receipt-schedule-link" onClick={scrollToSchedule}>
            View Repayment Schedule →
          </button>
        )}
      </div>

      {schedule_preview && schedule_preview.length > 0 && (
        <div className="receipt-schedule" id="receipt-schedule">
          <h2 className="doc-panel-heading">Repayment Schedule Preview</h2>
          <p className="receipt-schedule-note">
            Showing first 3 installments{tenure_months > 3 ? ` and final installment (#${tenure_months})` : ''}.
          </p>
          <div className="receipt-table-wrapper">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>Opening Balance</th>
                  <th>EMI</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule_preview.map((inst, idx) => {
                  const isFirst3 = idx < 3;
                  const isLast = idx === schedule_preview.length - 1;
                  const shouldShowEllipsis = idx === 3 && schedule_preview.length > 4;

                  if (shouldShowEllipsis) {
                    return (
                      <tr key="ellipsis" className="receipt-table-ellipsis">
                        <td colSpan={7}>· · ·</td>
                      </tr>
                    );
                  }

                  if (isFirst3 || isLast) {
                    return (
                      <tr key={inst.installment_number} className={isLast ? 'receipt-table-row--last' : ''}>
                        <td>{inst.installment_number}</td>
                        <td>{fmtDate(inst.due_date)}</td>
                        <td>{fmt(inst.opening_balance)}</td>
                        <td>{fmt(inst.emi_amount)}</td>
                        <td>{fmt(inst.principal_component)}</td>
                        <td>{fmt(inst.interest_component)}</td>
                        <td>{fmt(inst.closing_balance)}</td>
                      </tr>
                    );
                  }

                  return null;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="receipt-footer">
        {schedule_preview && schedule_preview.length > 0 && (
          <Button type="button" variant="primary" onClick={scrollToSchedule}>
            View Repayment Schedule
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={handleDownload}
          disabled={isDownloading}
          loading={isDownloading}
        >
          {isDownloading ? "Generating Receipt…" : (<><DownloadIcon /> Download Receipt</>)}
        </Button>
        <Button type="button" variant="secondary" onClick={handleNeedHelp}>
          Contact Support
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          Start New Application
        </Button>
      </div>

      <ReceiptPrintTemplate receipt={receipt} statusLabel={statusLabel} />
    </div>
  );
};

export default DisbursementReceiptScreen;

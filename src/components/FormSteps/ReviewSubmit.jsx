import React from 'react';
import Button from '../FormElements/Button';
import StepInfoLayout from './StepInfoLayout';
import '../../styles/components.css';

const ReviewSubmit = ({ formData, onEdit }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };
     const loan = formData.loan || {};
    const applicant = formData.applicant || {};
    // const employee=formData.employee || {};
    const renderSection = (title, data, editStep) => (
        <div style={{
            background: 'var(--panel-subtle-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-lg)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {title}
                </h3>
                <button
                    onClick={() => onEdit(editStep)}
                    style={{
                        background: 'transparent',
                        color: 'var(--primary-color)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        textDecoration: 'underline'
                    }}
                >
                    Edit
                </button>
            </div>
            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                {Object.entries(data).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    return (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                                {typeof value === 'number' && key.includes('amount') ? formatCurrency(value) : String(value)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <StepInfoLayout
            title="Almost There"
            text="Double-check every section below. Once submitted, you'll move on to document verification."
        >
            {renderSection('Loan Details', {
                loan_type: loan.loan_type,
                credit_type: loan.credit_type,
                loan_purpose: loan.loan_purpose,
                requested_amount: loan.requested_amount,
                requested_term_months: loan.requested_term_months,
                preferred_payment_day: loan.preferred_payment_day,
                origination_channel: loan.origination_channel
            }, 0)}

            {renderSection('Applicant Information', {
                name: `${applicant.first_name || ''} ${applicant.middle_name || ''} ${applicant.last_name || ''}`.trim(),
                date_of_birth: applicant.date_of_birth,
                email: applicant.email,
                citizenship_status: applicant.citizenship_status
            }, 1)}

            {applicant.addresses && applicant.addresses.length > 0 && (
                <div style={{
                    background: 'var(--panel-subtle-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Addresses ({applicant.addresses.length})
                        </h3>
                        <button
                            onClick={() => onEdit(2)}
                            style={{
                                background: 'transparent',
                                color: 'var(--primary-color)',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 'var(--font-size-sm)',
                                textDecoration: 'underline'
                            }}
                        >
                            Edit
                        </button>
                    </div>
                    {applicant.addresses.map((addr, idx) => (
                        <p key={idx} style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                            {addr.address_type}: {addr.address_line1}
                            {addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} {addr.zip_code}
                        </p>
                    ))}
                </div>
            )}

            {applicant.employment && renderSection('Employment', {
                employer: applicant.employment.employer_name,
                job_title: applicant.employment.job_title,
                employment_type: applicant.employment.employment_type,
                gross_monthly_income: applicant.employment.gross_monthly_income
            }, 3)}

          {applicant.incomes && applicant.incomes.length > 0 &&
 renderSection(
     'Additional Income',
     applicant.incomes.reduce((acc, inc, index) => {
         acc[`income_${index + 1}_type`] = inc.income_type;
         acc[`income_${index + 1}_monthly_amount`] = inc.monthly_amount;
         acc[`income_${index + 1}_frequency`] = inc.frequency;
         return acc;
     }, {}),
     4
 )
}

 

 {applicant.assets && applicant.assets.length > 0 &&
 renderSection(
     'Assets',
     applicant.assets.reduce((acc, asset, index) => {
         acc[`asset_${index + 1}_type`] = asset.asset_type;
         acc[`asset_${index + 1}_value`] = asset.value;
         return acc;
     }, {}),
     5
 )
}



{applicant.liabilities && applicant.liabilities.length > 0 &&
 renderSection(
     'Liabilities',
     applicant.liabilities.reduce((acc, liab, index) => {
         acc[`liability_${index + 1}_type`] = liab.liability_type;
         acc[`liability_${index + 1}_outstanding_balance`] = liab.outstanding_balance;
         acc[`liability_${index + 1}_monthly_payment`] = liab.monthly_payment;
         acc[`liability_${index + 1}_months_remaining`] = liab.months_remaining;
         return acc;
     }, {}),
     5
 )
}



            <div style={{
                background: 'var(--panel-primary-bg)',
                border: '1px solid var(--panel-primary-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-lg)',
                marginTop: 'var(--spacing-xl)'
            }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
                    By submitting this application, you certify that all information provided is accurate and complete.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <input type="checkbox" id="terms" style={{ width: '18px', height: '18px' }} required />
                    <label htmlFor="terms" style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                        I agree to the terms and conditions
                    </label>
                </div>
            </div>
        </StepInfoLayout>
    );
};

export default ReviewSubmit;

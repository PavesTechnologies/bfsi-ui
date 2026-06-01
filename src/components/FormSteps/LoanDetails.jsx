import React from 'react';
import Input from '../FormElements/Input';
import Select from '../FormElements/Select';
import '../../styles/components.css';

const LoanDetails = ({ formData, onChange }) => {
    const loanTypeOptions = [
        { value: 'personal', label: 'Personal Loan' },
        { value: 'auto', label: 'Auto Loan' },
        { value: 'mortgage', label: 'Mortgage' },
        { value: 'business', label: 'Business Loan' }
    ];

    const creditTypeOptions = [
        { value: 'individual', label: 'Individual' },
        { value: 'joint', label: 'Joint' }
    ];

    const originationChannelOptions = [
        { value: 'online', label: 'Online' },
        { value: 'branch', label: 'Branch' },
        { value: 'phone', label: 'Phone' },
        { value: 'partner', label: 'Partner' }
    ];

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h2 className="card-title">Loan Details</h2>
                <p className="card-subtitle">Tell us about the loan you're applying for</p>
            </div>

            <div className="form-grid-2">
                <Select
                    label="Loan Type"
                    name="loan_type"
                    value={formData.loan_type || ''}
                    onChange={onChange}
                    options={loanTypeOptions}
                    required
                />

                <Select
                    label="Credit Type"
                    name="credit_type"
                    value={formData.credit_type || ''}
                    onChange={onChange}
                    options={creditTypeOptions}
                    required
                />
            </div>

            <Input
  label="Loan Purpose"
  name="loan_purpose"
  value={formData.loan_purpose || ''}
  onChange={(e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9 ,.]/g, '');
    onChange({
      target: {
        name: "loan_purpose",
        value: filteredValue
      }
    });
  }}
  placeholder="e.g., Home renovation, debt consolidation"
  required
/>


            <div className="form-grid-2">
                <Input
  label="Requested Amount"
  name="requested_amount"
  type="text"
  value={formData.requested_amount ?? ''}
  onChange={(e) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');

    onChange({
      target: {
        name: "requested_amount",
        value: onlyNumbers === '' ? '' : Number(onlyNumbers)
      }
    });
  }}
  placeholder="0"
  required
/>

<Input
  label="Requested Term Months"
  name="requested_term_months"
  type="text"
  value={formData.requested_term_months ?? ''}
  onChange={(e) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');

    onChange({
      target: {
        name: "requested_term_months",
        value: onlyNumbers === '' ? '' : Number(onlyNumbers)
      }
    });
  }}
  placeholder="0"
  required
/>
            </div>

            <div className="form-grid-2">
                <Input
                    label="Preferred Payment Day"
                    name="preferred_payment_day"
                    type="text"
                    value={formData.preferred_payment_day || ''}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        if (raw === '') {
                            onChange({ target: { name: 'preferred_payment_day', value: '' } });
                            return;
                        }
                        const num = parseInt(raw, 10);
                        if (num < 1 || num > 30) return; // hard block — don't update state
                        onChange({ target: { name: 'preferred_payment_day', value: num } });
                    }}
                    placeholder="1-30"
                    required
                />

                <Select
                    label="Origination Channel"
                    name="origination_channel"
                    value={formData.origination_channel || ''}
                    onChange={onChange}
                    options={originationChannelOptions}
                    required
                />
            </div>
        </div>
    );
};

export default LoanDetails;

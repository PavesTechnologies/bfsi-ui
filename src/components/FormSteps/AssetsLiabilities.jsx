import React, { useState } from 'react';
import Input from '../FormElements/Input';
import Select from '../FormElements/Select';
import StepInfoLayout from './StepInfoLayout';
import '../../styles/components.css';

const AssetsLiabilities = ({ formData, onChange }) => {
    const [assets, setAssets] = useState(formData.assets || []);
    const [liabilities, setLiabilities] = useState(formData.liabilities || []);

    /* ---------------- ASSETS ---------------- */

    const assetTypeOptions = [
        { value: 'savings', label: 'Savings Account' },
        { value: 'checking', label: 'Checking Account' },
        { value: 'investment', label: 'Investment Account' },
        { value: 'property', label: 'Real Estate' },
        { value: 'vehicle', label: 'Vehicle' },
        { value: 'other', label: 'Other' }
    ];

    const ownershipOptions = [
        { value: 'individual', label: 'Individual' },
        { value: 'joint', label: 'Joint' }
    ];

    const addAsset = () => {
        const newAsset = {
            asset_type: '',
            institution_name: '',
            value: '',
            ownership_type: 'individual'
        };
        const updated = [...assets, newAsset];
        setAssets(updated);
        onChange({ target: { name: 'assets', value: updated } });
    };

    const updateAsset = (i, f, v) => {
        const updated = [...assets];
        updated[i][f] = v;
        setAssets(updated);
        onChange({ target: { name: 'assets', value: updated } });
    };

    const removeAsset = (i) => {
        const updated = assets.filter((_, idx) => idx !== i);
        setAssets(updated);
        onChange({ target: { name: 'assets', value: updated } });
    };

    /* ---------------- LIABILITIES ---------------- */

    const liabilityTypeOptions = [
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'auto_loan', label: 'Auto Loan' },
        { value: 'mortgage', label: 'Mortgage' },
        { value: 'student_loan', label: 'Student Loan' },
        { value: 'personal_loan', label: 'Personal Loan' },
        { value: 'other', label: 'Other' }
    ];

    const yesNoOptions = [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' }
    ];

    const addLiability = () => {
        const newLiability = {
            liability_type: '',
            creditor_name: '',
            outstanding_balance: '',
            monthly_payment: '',
            months_remaining: '',
            co_signed: false,
            federal_debt: false,
            delinquent_flag: false,
            days_delinquent: 0
        };
        const updated = [...liabilities, newLiability];
        setLiabilities(updated);
        onChange({ target: { name: 'liabilities', value: updated } });
    };

    const updateLiability = (i, f, v) => {
        const updated = [...liabilities];
        updated[i][f] = v;
        setLiabilities(updated);
        onChange({ target: { name: 'liabilities', value: updated } });
    };

    const removeLiability = (i) => {
        const updated = liabilities.filter((_, idx) => idx !== i);
        setLiabilities(updated);
        onChange({ target: { name: 'liabilities', value: updated } });
    };

    return (
        <StepInfoLayout
            title="Your Finances"
            text="A clear picture of what you own and owe helps us offer terms that fit your financial situation."
        >
            {/* -------- ASSETS -------- */}
            <h3 className="section-title">Assets</h3>

            {assets.map((a, i) => (
                <div key={i} className="dynamic-list-item">
                    <Select
                        label="Asset Type"
                        value={a.asset_type}
                        onChange={(e) => updateAsset(i, 'asset_type', e.target.value)}
                        options={assetTypeOptions}
                        
                    />

                    <Input
                        label="Institution Name"
                        value={a.institution_name}
                        onChange={(e) => {
                            const filteredValue=e.target.value.replace(/[^a-zA-Z0-9 ,.]/g,'');
                            updateAsset(i, 'institution_name', filteredValue);
                        }}
                
                    />

                    <Input
                        label="Estimated Value"
                        type="number"
                        value={a.value}
                        onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                            updateAsset(i, 'value', onlyNumbers);
                        }}
                    
                    />

                    <Select
                        label="Ownership Type"
                        value={a.ownership_type}
                        onChange={(e) => updateAsset(i, 'ownership_type', e.target.value)}
                        options={ownershipOptions}
                    
                    />

                    <button className="btn-remove" onClick={() => removeAsset(i)} type="button">
                        Remove Asset
                    </button>
                </div>
            ))}

            <button className="btn-add" onClick={addAsset} type="button">
                + Add Asset
            </button>

            {/* -------- LIABILITIES -------- */}
            <h3 className="section-title">Liabilities</h3>

            {liabilities.map((l, i) => (
                <div key={i} className="dynamic-list-item">
                    <Select
                        label="Liability Type"
                        value={l.liability_type}
                        onChange={(e) => updateLiability(i, 'liability_type', e.target.value)}
                        options={liabilityTypeOptions}
                    
                    />

                    <Input
                        label="Creditor Name"
                        value={l.creditor_name}
                        onChange={(e) => updateLiability(i, 'creditor_name', e.target.value)}
                        
                    />

                    <Input
                        label="Outstanding Balance"
                        type="number"
                        value={l.outstanding_balance}
                        onChange={(e) => updateLiability(i, 'outstanding_balance', e.target.value)}
                    
                    />

                    <Input
                        label="Monthly Payment"
                        type="number"
                        value={l.monthly_payment}
                        onChange={(e) => updateLiability(i, 'monthly_payment', e.target.value)}
                    
                    />

                    <Input
                        label="Months Remaining"
                        type="number"
                        value={l.months_remaining}
                        onChange={(e) => updateLiability(i, 'months_remaining', e.target.value)}
                    
                    />

                    <Select
                        label="Co-signed?"
                        value={l.co_signed}
                        onChange={(e) => updateLiability(i, 'co_signed', e.target.value === 'true')}
                        options={yesNoOptions}
                    />

                    <Select
                        label="Federal Debt?"
                        value={l.federal_debt}
                        onChange={(e) => updateLiability(i, 'federal_debt', e.target.value === 'true')}
                        options={yesNoOptions}
                    />

                    <Select
                        label="Delinquent?"
                        value={l.delinquent_flag}
                        onChange={(e) => updateLiability(i, 'delinquent_flag', e.target.value === 'true')}
                        options={yesNoOptions}
                    />

                    {l.delinquent_flag && (
                        <Input
                            label="Days Delinquent"
                            type="number"
                            value={l.days_delinquent}
                            onChange={(e) => updateLiability(i, 'days_delinquent', e.target.value)}
                        
                        />
                    )}

                    <button className="btn-remove" onClick={() => removeLiability(i)} type="button">
                        Remove Liability
                    </button>
                </div>
            ))}

            <button className="btn-add" onClick={addLiability} type="button">
                + Add Liability
            </button>
        </StepInfoLayout>
    );
};

export default AssetsLiabilities;

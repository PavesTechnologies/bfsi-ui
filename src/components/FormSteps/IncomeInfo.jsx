import React, { useState } from 'react';
import Input from '../FormElements/Input';
import Select from '../FormElements/Select';
import StepInfoLayout from './StepInfoLayout';
import '../../styles/components.css';

const IncomeInfo = ({ formData, onChange }) => {
    const [incomes, setIncomes] = useState(formData.incomes || []);

    const incomeTypeOptions = [
        { value: 'salary', label: 'Salary' },
        { value: 'bonus', label: 'Bonus' },
        { value: 'commission', label: 'Commission' },
        { value: 'rental', label: 'Rental Income' },
        { value: 'investment', label: 'Investment Income' },
        { value: 'other', label: 'Other' }
    ];

    const frequencyOptions = [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' }
    ];

    const addIncome = () => {
        const newIncome = {
            income_type: '',
            description: '',
            monthly_amount: '',
            income_frequency: 'monthly'
        };

        const updatedIncomes = [...incomes, newIncome];
        setIncomes(updatedIncomes);
        onChange({ target: { name: 'incomes', value: updatedIncomes } });
    };

    const removeIncome = (index) => {
        const updatedIncomes = incomes.filter((_, i) => i !== index);
        setIncomes(updatedIncomes);
        onChange({ target: { name: 'incomes', value: updatedIncomes } });
    };

    const updateIncome = (index, field, value) => {
        const updatedIncomes = [...incomes];
        updatedIncomes[index][field] = value;
        setIncomes(updatedIncomes);
        onChange({ target: { name: 'incomes', value: updatedIncomes } });
    };

    return (
        <StepInfoLayout
            title="Your Income"
            text="List every source of income so we can calculate the loan amount you're eligible for."
        >
            {incomes.map((income, index) => (
                <div key={index} className="dynamic-list-item">
                    <div className="dynamic-list-header">
                        <h3 className="dynamic-list-title">
                            Income {index + 1}
                        </h3>
                        <button
                            className="btn-remove"
                            onClick={() => removeIncome(index)}
                            type="button"
                        >
                            Remove
                        </button>
                    </div>

                    <div className="form-grid-2">
                        <Select
                            label="Income Type"
                            value={income.income_type || ''}
                            onChange={(e) =>
                                updateIncome(index, 'income_type', e.target.value)
                            }
                            options={incomeTypeOptions}
                            
                        />

                        <Select
                            label="Income Frequency"
                            value={income.income_frequency || 'monthly'}
                            onChange={(e) =>
                                updateIncome(index, 'income_frequency', e.target.value)
                            }
                            options={frequencyOptions}
                            
                        />
                    </div>

                    <Input
                        label="Monthly Amount"
                        type="text"
                        value={income.monthly_amount || ''}
                        onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                            updateIncome(index, 'monthly_amount', onlyNumbers);
                        }}
                        placeholder="0.00"
                       
                    />

                    <Input
                        label="Description"
                        value={income.description || ''}
                        onChange={(e) => {
                            const filteredValue=e.target.value.replace(/[^a-zA-Z0-9 ,.]/g,'');
                            updateIncome(index, 'description', filteredValue);
                        }}

                        placeholder="Employer name, rental property, etc."
                    />
                </div>
            ))}

            <button className="btn-add" onClick={addIncome} type="button">
                + Add Income
            </button>
        </StepInfoLayout>
    );
};

export default IncomeInfo;

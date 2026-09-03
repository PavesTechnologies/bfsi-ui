import React from 'react';
import Input from '../FormElements/Input';
import Select from '../FormElements/Select';
import DatePicker from '../FormElements/DatePicker';
import StepInfoLayout from './StepInfoLayout';
import '../../styles/components.css';

const EmploymentDetails = ({ formData, onChange }) => {
    const employment = formData.employment || {};

    const handleEmploymentChange = (e) => {
        const { name, value, type, checked } = e.target;
        const updatedEmployment = {
            ...employment,
            [name]: type === 'checkbox' ? checked : value
        };
        onChange({ target: { name: 'employment', value: updatedEmployment } });
    };

   const employmentTypeOptions = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Unemployed' }
];



    const employmentStatusOptions = [
        { value: 'employed', label: 'Employed' },
        { value: 'unemployed', label: 'Unemployed' },
        { value: 'retired', label: 'Retired' },
        { value: 'student', label: 'Student' }
    ];

    return (
        <StepInfoLayout
            title="Your Work"
            text="Employment details help us understand your income stability and assess your loan eligibility."
        >
            <div className="form-grid-2">
                <Select
                    label="Employment Type"
                    name="employment_type"
                    value={employment.employment_type || ''}
                    onChange={handleEmploymentChange}
                    options={employmentTypeOptions}
                 
                />

                <Select
                    label="Employment Status"
                    name="employment_status"
                    value={employment.employment_status || ''}
                    onChange={handleEmploymentChange}
                    options={employmentStatusOptions}
                   
                />
            </div>

            <div className="form-grid-2">
                <Input
                    label="Employer Name"
                    name="employer_name"
                    value={employment.employer_name || ''}
                    
                    onChange={(e)=>{                    const filteredValue = e.target.value.replace(/[^a-zA-Z0-9 ,.]/g, '');
                        handleEmploymentChange({
                            target:{
                                name:"employer_name",
                                value:filteredValue
                            }
                        });
                    }}
                    
                />

                <Input
                    label="Job Title"
                    name="job_title"
                    value={employment.job_title || ''}
                    onChange={(e)=>{
                        const filteredValue = e.target.value.replace(/[^a-zA-Z0-9 ,.]/g, '');
                        handleEmploymentChange({
                            target:{
                                name:"job_title",
                                value:filteredValue
                            }
                        });
                    }}
                    
                />
            </div>

            <div className="form-grid-2">
                <Input
                    label="Employer Phone"
                    name="employer_phone"
                    type="tel"
                    value={employment.employer_phone || ''}
                    onChange={(e)=>{
                        const filteredValue=e.target.value.replace(/[^0-9 +]/g, '');
                        handleEmploymentChange({
                            target:{
                                name:"employer_phone",
                                value:filteredValue
                            }
                        });
                    }}
                    placeholder="(555) 123-4567"
                />

                <DatePicker
                    label="Start Date"
                    name="start_date"
                    value={employment.start_date || ''}
                    onChange={handleEmploymentChange}
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            <Input
                label="Employer Address"
                name="employer_address"
                value={employment.employer_address || ''}
                onChange={(e)=>{
                    const filteredValue = e.target.value.replace(/[^a-zA-Z0-9 ,.]/g, '');
                    handleEmploymentChange({
                        target:{
                            name:"employer_address",
                            value:filteredValue
                        }
                    });
                }}
            />

            <div className="form-grid-2">
                <Input
                    label="Years of Experience"
                    name="experience"
                    type="number"
                    value={employment.experience || ''}
                    onChange={handleEmploymentChange}
                    placeholder="0"
                />

                <Input
  label="Gross Monthly Income"
  name="gross_monthly_income"
  type="text"
  value={employment.gross_monthly_income || ''}
  onChange={(e) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');

    const numericValue = onlyNumbers === '' ? '' : Number(onlyNumbers);

    handleEmploymentChange({
      target: {
        name: "gross_monthly_income",
        value: numericValue
      }
    });
  }}
  placeholder="0"
/>

            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        name="self_employed_flag"
                        checked={employment.self_employed_flag || false}
                        onChange={handleEmploymentChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Self-Employed
                    </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        name="family_employment"
                        checked={employment.family_employment || false}
                        onChange={handleEmploymentChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Family Employment
                    </span>
                </label>
            </div>
        </StepInfoLayout>
    );
};

export default EmploymentDetails;

import React from 'react';
import Input from '../FormElements/Input';
import Select from '../FormElements/Select';
import DatePicker from '../FormElements/DatePicker';
import '../../styles/components.css';

const ApplicantInfo = ({ formData, onChange }) => {
    const applicantRoleOptions = [
        { value: 'primary', label: 'Primary Applicant' },
        { value: 'co-applicant', label: 'Co-Applicant' }
    ];

    const suffixOptions = [
        { value: '', label: 'None' },
        { value: 'Mr.', label: 'Mr.' },
        { value: 'Ms.', label: 'Ms.' },
        { value: 'Mrs.', label: 'Mrs.' },
        // { value: 'Miss', label: 'Miss' },
    ];
   const genderOptions=[
        { value: 'MALE', label: 'MALE' },
        { value: 'FEMALE', label: 'FEMALE' },
        { value: 'OTHER', label: 'OTHER' },
        {value:'PREFER_NOT_TO_SAY', label: 'Prefer not to say'},
        {value:'NON_BINARY', label: 'Non-binary'},
    ];
    return (
        <div className="card fade-in">
            <div className="card-header">
                <h2 className="card-title">Applicant Information</h2>
                <p className="card-subtitle">Provide your personal details</p>
            </div>

            <Select
                label="Applicant Role"
                name="applicant_role"
                value={formData.applicant_role || 'primary'}
                onChange={onChange}
                options={applicantRoleOptions}
                required
            />

            <div className="form-grid-3">
                <Input
  label="First Name"
  name="first_name"
  value={formData.first_name || ''}
  onChange={(e) => {
    const onlyLettersAndNumbers = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
    
    onChange({
      target: {
        name: "first_name",
        value: onlyLettersAndNumbers
      }
    });
  }}
  required
/>


                <Input
                    label="Middle Name"
                    name="middle_name"
                    value={formData.middle_name || ''}
                    onChange={(e) => {
    const onlyLettersAndNumbers = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
    
    onChange({
      target: {
        name: "middle_name",
        value: onlyLettersAndNumbers
      }
    });
    }}
                />

                <Input
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name || ''}
onChange={(e) => {
    const onlyLettersAndNumbers = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
    
    onChange({
      target: {
        name: "last_name",
        value: onlyLettersAndNumbers
      }
    });
    }}
                    required
                />
            </div>

            <div className="form-grid-2">
                <Select
                    label="Suffix"
                    name="suffix"
                    value={formData.suffix || ''}
                    onChange={onChange}
                    options={suffixOptions}
                />

                <DatePicker
                    label="Date of Birth"
                    name="date_of_birth"
                    value={formData.date_of_birth || ''}
                    onChange={onChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                />
                 <Input
                    label="Phone Number"
                    name="phone_number"
                    value={formData.phone_number || ''}
                    onChange={(e) => {
    const onlyNumbers = e.target.value.replace(/[^0-9 +]/g, '');
    
    onChange({
      target: {
        name: "phone_number",
        value: onlyNumbers
      }
    });
    }}
                  
                />
                 <Select
                    label="Gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={onChange}
                    options={genderOptions}
                    required
                />
                
            </div>

            <div className="form-grid-2">
                <Input
                    label="PAN Number"
                    name="pan_number"
                    value={formData.pan_number || ''}
                    onChange={(e) => {
                        const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        onChange({ target: { name: 'pan_number', value: filtered } });
                    }}
                    placeholder="ABCDE1234F"
                    maxLength="10"
                    required
                />

                <Input
                    label="Aadhaar Number"
                    name="aadhaar_no"
                    value={formData.aadhaar_no || ''}
                    onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                        onChange({ target: { name: 'aadhaar_no', value: onlyNumbers } });
                    }}
                    placeholder="12-digit Aadhaar number"
                    maxLength="12"
                    required
                />
            </div>

            <div className="form-grid-2">
                <Input
                    label="Father's Name"
                    name="father_name"
                    value={formData.father_name || ''}
                    onChange={(e) => {
                        const filtered = e.target.value.replace(/[^a-zA-Z ]/g, '');
                        onChange({ target: { name: 'father_name', value: filtered } });
                    }}
                />
                <Input
                    label="Mother's Name"
                    name="mother_name"
                    value={formData.mother_name || ''}
                    onChange={(e) => {
                        const filtered = e.target.value.replace(/[^a-zA-Z ]/g, '');
                        onChange({ target: { name: 'mother_name', value: filtered } });
                    }}
                />
            </div>

            <div className="form-grid-2">
                <Input
                    label="Citizenship Status"
                    name="citizenship_status"
                    value={formData.citizenship_status || ''}
                    onChange={onChange}
                    placeholder="e.g., Indian Citizen, NRI, OCI"
                />

                <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={onChange}
                    required
                />
            </div>
        </div>
    );
};

export default ApplicantInfo;

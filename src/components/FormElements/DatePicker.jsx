import React from 'react';
import '../../styles/components.css';

const CalendarIcon = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
    </svg>
);

const DatePicker = ({
    label,
    name,
    value,
    onChange,
    error,
    required = false,
    min,
    max,
    ...props
}) => {
    return (
        <div className="form-group">
            {label && (
                <label htmlFor={name} className="form-label">
                    {label}{required && <span className="required-star">*</span>}
                </label>
            )}
            <div className="form-input-wrapper">
                <span className="form-input-icon form-input-icon-left">
                    <CalendarIcon />
                </span>
                <input
                    id={name}
                    name={name}
                    type="date"
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    className={['form-input', 'has-icon', error && 'error'].filter(Boolean).join(' ')}
                    required={required}
                    {...props}
                />
            </div>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export default DatePicker;

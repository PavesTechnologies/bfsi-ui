import React from 'react';

const StepInfoLayout = ({ title, text, children }) => (
    <div className="form-step-layout fade-in">
        <aside className="form-step-info">
            <h3 className="form-step-info-title">{title}</h3>
            <p className="form-step-info-text">{text}</p>
        </aside>
        <div className="form-step-fields">{children}</div>
    </div>
);

export default StepInfoLayout;

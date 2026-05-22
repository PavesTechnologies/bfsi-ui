import React from 'react';
import '../styles/components.css';

const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
    </svg>
);

const Sidebar = ({ currentStep, steps, onStepClick, isCollapsed, onToggleCollapse }) => {
    const getStepStatus = (index) => {
        if (index < currentStep) return 'completed';
        if (index === currentStep) return 'active';
        return 'pending';
    };

    return (
        <div style={{
            width: isCollapsed ? '60px' : '260px',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            padding: isCollapsed ? 'var(--spacing-md) var(--spacing-xs)' : 'var(--spacing-xl) var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            transition: 'width 0.3s ease-in-out, padding 0.3s ease-in-out',
            overflowY: 'auto',
            overflowX: 'hidden'
        }}>
            {/* Toggle Button */}
            <button
                onClick={onToggleCollapse}
                style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    right: isCollapsed ? '50%' : 'var(--spacing-md)',
                    transform: isCollapsed ? 'translateX(50%)' : 'none',
                    background: 'var(--bg-tertiary)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.3s ease-in-out',
                    zIndex: 10,
                    flexShrink: 0
                }}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>

            {/* Brand Header */}
            {!isCollapsed && (
                <div style={{ marginBottom: 'var(--spacing-xl)', marginTop: 'var(--spacing-2xl)' }}>
                    <h1 style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 700,
                        color: 'var(--primary-700)',
                        marginBottom: '2px',
                        letterSpacing: '-0.01em'
                    }}>
                        Loan Application
                    </h1>
                    <p style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontWeight: 500
                    }}>
                        Secure Portal
                    </p>
                </div>
            )}

            {/* Progress bar */}
            {!isCollapsed && (
                <div style={{
                    marginBottom: 'var(--spacing-md)',
                    padding: '0 var(--spacing-xs)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px'
                    }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Progress
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                            {Math.round((currentStep / (steps.length - 1)) * 100)}%
                        </span>
                    </div>
                    <div style={{
                        height: '4px',
                        background: 'var(--border-color)',
                        borderRadius: '99px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.round((currentStep / (steps.length - 1)) * 100)}%`,
                            background: 'var(--color-primary)',
                            borderRadius: '99px',
                            transition: 'width 0.4s ease-in-out'
                        }} />
                    </div>
                </div>
            )}

            {/* Vertical Stepper */}
            <div className="stepper" style={{ marginTop: isCollapsed ? 'var(--spacing-2xl)' : '0' }}>
                {steps.map((step, index) => {
                    const status = getStepStatus(index);
                    return (
                        <div
                            key={index}
                            className={`stepper-item ${status}`}
                            onClick={() => onStepClick && onStepClick(index)}
                            style={{
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                paddingLeft: isCollapsed ? 0 : undefined
                            }}
                            title={isCollapsed ? step.title : ''}
                        >
                            <div className="stepper-icon">
                                {status === 'completed' ? <CheckIcon /> : index + 1}
                            </div>
                            {!isCollapsed && (
                                <div className="stepper-content">
                                    <div className="stepper-title">{step.title}</div>
                                    <div className="stepper-description">{step.description}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            {!isCollapsed && (
                <div style={{
                    marginTop: 'auto',
                    paddingTop: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <p style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        fontWeight: 500
                    }}>
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Sidebar;

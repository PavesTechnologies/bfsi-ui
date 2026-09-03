import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";

const AppShell = ({ steps, currentStep, completedSteps, furthestStepIndex, onStepClick, children }) => {
  const step = steps[currentStep];
  const canGoBack = currentStep > 0;

  return (
    <div className="app-shell">
      <aside className="app-shell-sidebar">
        <Link to="/" className="app-shell-brand">
          <span className="app-shell-brand-mark" aria-hidden="true">
            <ShieldIcon />
          </span>
          <span>Loan Application</span>
        </Link>

        <Sidebar
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          furthestStepIndex={furthestStepIndex}
          onStepClick={onStepClick}
        />

        <span className="app-shell-secure-note">
          <LockIcon />
          Your information is encrypted
        </span>
      </aside>

      <main className="app-shell-main">
        <div className="app-shell-main-inner">
          <div className="app-shell-header">
            <button
              type="button"
              className="app-shell-back"
              onClick={() => canGoBack && onStepClick(currentStep - 1)}
              disabled={!canGoBack}
            >
              <BackIcon />
              Back
            </button>

            <span className="app-shell-step-count">
              Step {currentStep + 1} of {steps.length}
            </span>
            <h1 className="app-shell-title">{step.title}</h1>
            <p className="app-shell-subtitle">{step.description}</p>
          </div>

          <div className="fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
};

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm2 5H6V4a2 2 0 1 1 4 0v2z" />
  </svg>
);

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default AppShell;

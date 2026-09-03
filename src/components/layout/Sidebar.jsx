import React from "react";

const Sidebar = ({ steps, currentStep, completedSteps, furthestStepIndex, onStepClick }) => {
  return (
    <ol className="app-sidebar-steps">
      {steps.map((step, index) => {
        const isCompleted = completedSteps?.has(index) ?? index < currentStep;
        const isReachable = index <= (furthestStepIndex ?? currentStep);
        // Active takes priority over completed: revisiting a completed step
        // still shows it as "you are here", not as a checked-off item.
        const status = index === currentStep ? "active" : isCompleted ? "completed" : "pending";

        return (
          <li key={step.path} className={`app-sidebar-step app-sidebar-step--${status}`}>
            <button
              type="button"
              className="app-sidebar-step-indicator"
              onClick={() => isReachable && onStepClick(index)}
              disabled={!isReachable}
              aria-current={status === "active" ? "step" : undefined}
            >
              {status === "completed" ? <CheckIcon /> : index + 1}
            </button>
            <span className="app-sidebar-step-body">
              <span className="app-sidebar-step-title">{step.title}</span>
              <span className="app-sidebar-step-description">{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

export default Sidebar;

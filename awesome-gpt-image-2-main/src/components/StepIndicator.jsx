import React from 'react';

export function StepIndicator({ steps, currentStep }) {
  return (
    <div className="stepIndicator">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className={`stepItem ${currentStep === step.key ? 'active' : ''} ${steps.findIndex(s => s.key === currentStep) > index ? 'completed' : ''}`}>
            <span className="stepNumber">{index + 1}</span>
            <span>{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`stepConnector ${steps.findIndex(s => s.key === currentStep) > index ? 'active' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

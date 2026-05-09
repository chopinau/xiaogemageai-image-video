import React from 'react';
import { Image, Video, ArrowRight, Check } from 'lucide-react';

export function WorkflowChain({ steps }) {
  if (!steps || steps.length < 2) return null;

  return (
    <div className="workflowChain">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className={`workflowChainStep ${step.status}`}>
            <div className="workflowChainStepIcon">
              {step.type === 'image' ? <Image size={14} /> : <Video size={14} />}
            </div>
            <div className="workflowChainStepInfo">
              <span className="workflowChainStepLabel">{step.label}</span>
              {step.model && <span className="workflowChainStepModel">{step.model}</span>}
            </div>
            {step.status === 'completed' && (
              <div className="workflowChainStepCheck">
                <Check size={12} />
              </div>
            )}
          </div>
          {idx < steps.length - 1 && (
            <div className="workflowChainArrow">
              <ArrowRight size={14} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

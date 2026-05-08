import React from 'react';

export function ProgressBar({ progress = 0 }) {
  return (
    <div className="progressBar">
      <div className="progressBarFill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
    </div>
  );
}

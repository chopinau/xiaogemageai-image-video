import React from 'react';

export function Modal({ children, onClose }) {
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
      <button className="modalClose" onClick={onClose}>✕</button>
    </div>
  );
}

import React from 'react';

export function RadioGroup({ value, onChange, options, label, icon: Icon }) {
  return (
    <div className="paramSection">
      {label && <div className="paramLabel">{Icon && <Icon size={16} />}{label}</div>}
      <div className="radioGroup">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`radioItem ${value === opt.value ? 'active' : ''}`}
          >
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
            {opt.description && <span style={{ fontSize: '11px', color: '#5a6a80' }}>{opt.description}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

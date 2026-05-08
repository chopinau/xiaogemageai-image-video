import React from 'react';

export function SelectDropdown({ value, onChange, options, label, icon: Icon }) {
  return (
    <div className="paramSection">
      {label && <div className="paramLabel">{Icon && <Icon size={16} />}{label}</div>}
      <div className="selectWrap">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.provider ? `${opt.label} (${opt.provider})` : opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

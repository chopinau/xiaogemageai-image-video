import React from 'react';

export function TextAreaWithCount({ value, onChange, maxLength = 350, placeholder, example, label, icon: Icon }) {
  const isOver = value.length > maxLength;
  return (
    <div className="paramSection">
      {label && <div className="paramLabel">{Icon && <Icon size={16} />}{label}</div>}
      <div className="textAreaWrap">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength + 50}
          placeholder={placeholder}
          rows={3}
        />
        <span className={`charCount ${isOver ? 'over' : ''}`}>{value.length}/{maxLength}</span>
      </div>
      {example && <div className="exampleHint">参考：{example}</div>}
    </div>
  );
}

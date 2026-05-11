import React, { useState, useCallback } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { getModelParams, getModelGroups } from '../config/modelParams';

function ParamSelect({ param, value, onChange }) {
  return (
    <div className="dppField">
      <div className="dppFieldHeader">
        <span className="dppLabel">{param.label}</span>
        {param.help && <ParamHelp text={param.help} />}
      </div>
      <div className="dppSelectGrid">
        {param.options.map(opt => (
          <button
            key={String(opt.value)}
            className={`dppSelectBtn ${value === opt.value ? 'selected' : ''}`}
            onClick={() => onChange(param.id, opt.value)}
            title={opt.detail || ''}
          >
            <span className="dppSelectLabel">{opt.label}</span>
            {opt.detail && <span className="dppSelectDetail">{opt.detail}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParamSlider({ param, value, onChange }) {
  const { min, max, step } = param.range;
  return (
    <div className="dppField">
      <div className="dppFieldHeader">
        <span className="dppLabel">{param.label}</span>
        <span className="dppValue">{value}</span>
        {param.help && <ParamHelp text={param.help} />}
      </div>
      <input
        type="range"
        className="dppSlider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
      />
      <div className="dppSliderRange">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ParamToggle({ param, value, onChange }) {
  return (
    <div className="dppField dppFieldRow">
      <div className="dppFieldHeader">
        <span className="dppLabel">{param.label}</span>
        {param.help && <ParamHelp text={param.help} />}
      </div>
      <button
        className={`dppToggle ${value ? 'on' : ''}`}
        onClick={() => onChange(param.id, !value)}
      >
        <span className="dppToggleKnob" />
      </button>
    </div>
  );
}

function ParamCounter({ param, value, onChange }) {
  const { min, max } = param.range;
  return (
    <div className="dppField dppFieldRow">
      <div className="dppFieldHeader">
        <span className="dppLabel">{param.label}</span>
        {param.help && <ParamHelp text={param.help} />}
      </div>
      <div className="dppCounter">
        <button className="dppCounterBtn" onClick={() => onChange(param.id, Math.max(min, value - 1))}>-</button>
        <span className="dppCounterValue">{value}</span>
        <button className="dppCounterBtn" onClick={() => onChange(param.id, Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

function ParamInput({ param, value, onChange }) {
  return (
    <div className="dppField">
      <div className="dppFieldHeader">
        <span className="dppLabel">{param.label}</span>
        {param.help && <ParamHelp text={param.help} />}
      </div>
      <input
        type="text"
        className="dppInput"
        value={value || ''}
        placeholder={param.placeholder || ''}
        onChange={(e) => onChange(param.id, e.target.value)}
      />
    </div>
  );
}

function ParamHelp({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div className="dppHelpWrap" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <HelpCircle size={12} className="dppHelpIcon" />
      {show && <div className="dppHelpTooltip">{text}</div>}
    </div>
  );
}

export function DynamicParamPanel({ modelId, values, onChange }) {
  const config = getModelParams(modelId);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const handleChange = useCallback((paramId, value) => {
    if (onChange) onChange(paramId, value);
  }, [onChange]);

  const toggleGroup = useCallback((groupId) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  if (!config) return null;

  const groups = getModelGroups(modelId);

  const renderParam = (param) => {
    const value = values?.[param.id] !== undefined ? values[param.id] : param.default;
    const props = { param, value, onChange: handleChange };

    switch (param.type) {
      case 'select': return <ParamSelect key={param.id} {...props} />;
      case 'slider': return <ParamSlider key={param.id} {...props} />;
      case 'toggle': return <ParamToggle key={param.id} {...props} />;
      case 'counter': return <ParamCounter key={param.id} {...props} />;
      case 'input': return <ParamInput key={param.id} {...props} />;
      default: return null;
    }
  };

  return (
    <div className="dynamicParamPanel">
      {groups.map(group => {
        const groupParams = config.params.filter(p => p.group === group.id);
        if (groupParams.length === 0) return null;
        const isCollapsed = collapsedGroups[group.id];

        return (
          <div key={group.id} className="dppGroup">
            <button className="dppGroupHeader" onClick={() => toggleGroup(group.id)}>
              <span className="dppGroupIcon">{group.icon}</span>
              <span className="dppGroupLabel">{group.label}</span>
              <ChevronDown size={12} className={`dppGroupChevron ${isCollapsed ? '' : 'open'}`} />
            </button>
            {!isCollapsed && (
              <div className="dppGroupContent">
                {groupParams.map(renderParam)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

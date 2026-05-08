import React from 'react';

export function TabGroup({ tabs, activeTab, onChange }) {
  return (
    <div className="tabGroup">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`tabItem ${activeTab === tab.value ? 'active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

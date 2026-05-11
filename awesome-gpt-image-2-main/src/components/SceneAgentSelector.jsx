import React, { useState } from 'react';
import { CheckCircle, Lock, Sparkles, X } from 'lucide-react';
import { SCENE_AGENTS } from '../config/models';

export function SceneAgentSelector({ isOpen, onClose, onSelect }) {
  const [hoveredAgent, setHoveredAgent] = useState(null);

  if (!isOpen) return null;

  const availableAgents = SCENE_AGENTS.filter(a => a.status === 'available');
  const comingSoonAgents = SCENE_AGENTS.filter(a => a.status === 'coming-soon');

  const handleSelect = (agent) => {
    if (agent.status === 'available') {
      onSelect?.(agent);
      onClose?.();
    }
  };

  const handleComingSoonClick = (agent) => {
    // 可以显示一个提示或toast
    console.log(`场景 "${agent.name}" 即将上线`);
  };

  return (
    <div className="sceneAgentOverlay" onClick={onClose}>
      <div className="sceneAgentPanel" onClick={(e) => e.stopPropagation()}>
        <div className="sceneAgentHeader">
          <div className="sceneAgentTitleRow">
            <Sparkles size={18} className="sceneAgentIcon" />
            <h3>选择场景</h3>
          </div>
          <span className="sceneAgentCount">{SCENE_AGENTS.length} 个场景</span>
          <button className="sceneAgentClose" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="sceneAgentContent">
          {/* 可用场景 */}
          {availableAgents.length > 0 && (
            <div className="sceneAgentSection">
              <div className="sectionLabel">可用</div>
              <div className="sceneAgentList">
                {availableAgents.map(agent => (
                  <div
                    key={agent.id}
                    className={`sceneAgentItem available`}
                    onClick={() => handleSelect(agent)}
                    onMouseEnter={() => setHoveredAgent(agent.id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    <span className="agentIcon">{agent.icon}</span>
                    <div className="agentInfo">
                      <span className="agentName">{agent.name}</span>
                      <span className="agentDesc">{agent.description}</span>
                    </div>
                    <CheckCircle size={20} className="statusIcon available" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 即将上线 */}
          {comingSoonAgents.length > 0 && (
            <div className="sceneAgentSection">
              <div className="sectionLabel">即将上线</div>
              <div className="sceneAgentList">
                {comingSoonAgents.map(agent => (
                  <div
                    key={agent.id}
                    className={`sceneAgentItem coming-soon`}
                    onClick={() => handleComingSoonClick(agent)}
                    onMouseEnter={() => setHoveredAgent(agent.id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    <span className="agentIcon">{agent.icon}</span>
                    <div className="agentInfo">
                      <span className="agentName">{agent.name}</span>
                      <span className="agentDesc">{agent.description}</span>
                    </div>
                    <div className="comingSoonBadge">
                      <Lock size={12} />
                      <span>即将上线</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sceneAgentFooter">
          <p className="footerHint">
            💡 场景智能体会根据你的需求自动优化生成参数
          </p>
        </div>
      </div>
    </div>
  );
}

export function SceneAgentButton({ onClick, selectedScene }) {
  return (
    <button 
      className="sceneAgentTrigger"
      onClick={onClick}
      title="选择场景智能体"
    >
      <Sparkles size={16} />
      <span>{selectedScene ? selectedScene.name : '场景'}</span>
    </button>
  );
}

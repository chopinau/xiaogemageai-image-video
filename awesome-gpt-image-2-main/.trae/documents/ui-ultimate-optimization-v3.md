# UI 终极优化计划 - 参考图片风格升级

## 📋 需求分析

根据用户提供的参考图片，当前界面需要以下优化：

### 核心需求
1. ✅ **模型成功率显示** - 每个模型旁边显示成功率百分比
2. ✅ **比例选项增强** - 更多比例选择（1:1, 4:3, 16:9, 9:16 等）
3. ✅ **画质选项** - 标准/高清/超清等画质选择
4. ✅ **场景智能体功能** - 服装/电商等场景（待开放状态）
5. ✅ **对话框优化** - 更清晰的视觉层次

---

## 🔧 实施步骤

### Phase 1: 数据层扩展 (models.js)

#### 1.1 为每个模型添加成功率字段
```javascript
'gpt-image-2': {
  // ...现有字段
  successRate: 95,        // 成功率百分比
  qualityLevels: ['standard', 'hd', 'ultra'], // 支持的画质
  sizeOptions: ['1024x1024', '1536x1024', '1024x1536', '2048x2048'] // 支持的尺寸
}
```

#### 1.2 添加场景智能体配置
```javascript
export const SCENE_AGENTS = [
  { id: 'fashion-ecommerce', name: '虚拟模特/电商', icon: '👗', status: 'coming-soon', description: '电商产品图生成' },
  { id: 'virtual-fitting', name: '虚拟试衣', icon: '👔', status: 'coming-soon', description: 'AI换装体验' },
  { id: 'image-editing', name: '图像编辑', icon: '✏️', status: 'available', description: '智能图像处理' }
];
```

---

### Phase 2: ModelCapsuleGroup 组件优化

#### 2.1 显示成功率徽章
```jsx
<button className={`modelCapsule ${isSelected ? 'selected' : ''}`}>
  <ModelLogo provider={model.provider} size={22} />
  <span className="capsuleName">{model.name}</span>
  {/* 新增：成功率 */}
  <span className="successRateBadge" style={{ 
    color: model.successRate >= 90 ? '#10b981' : model.successRate >= 80 ? '#f59e0b' : '#ef4444'
  }}>
    {model.successRate}%
  </span>
  <span className="capsulePrice">{price}</span>
</button>
```

---

### Phase 3: ParamCapsuleGroup 组件增强

#### 3.1 扩展比例选项
```javascript
const IMAGE_SIZES = [
  { value: '1024x1024', label: '1:1', detail: '1024×1024' },
  { value: '1536x1024', label: '16:9', detail: '1536×1024' },
  { value: '1024x1536', label: '9:16', detail: '1024×1536' },
  { value: '1344x768', label: '16:9 HD', detail: '1344×768' },
  { value: '768x1344', label: '9:16 HD', detail: '768×1344' },
  { value: '2048x2048', label: '1:1 4K', detail: '2048×2048' }
];
```

#### 3.2 添加画质选项
```javascript
const QUALITY_LEVELS = [
  { value: 'standard', label: '标准', priceMultiplier: 1 },
  { value: 'hd', label: '高清', priceMultiplier: 1.5 },
  { value: 'ultra', label: '超清', priceMultiplier: 2 }
];
```

---

### Phase 4: 场景智能体组件 (新组件)

#### 4.1 创建 SceneAgentSelector.jsx
- 显示可用/待开放的场景列表
- 待开放项显示"即将上线"标签
- 点击待开放项显示提示信息

```jsx
export function SceneAgentSelector({ onSelect }) {
  return (
    <div className="sceneAgentPanel">
      <div className="sceneAgentHeader">
        <h3>🎯 选择场景</h3>
        <span className="sceneAgentCount">3 个场景</span>
      </div>
      <div className="sceneAgentList">
        {SCENE_AGENTS.map(agent => (
          <div key={agent.id} className={`sceneAgentItem ${agent.status}`}>
            <span className="sceneAgentIcon">{agent.icon}</span>
            <div className="sceneAgentInfo">
              <span className="sceneAgentName">{agent.name}</span>
              <span className="sceneAgentDesc">{agent.description}</span>
            </div>
            {agent.status === 'coming-soon' && (
              <span className="comingSoonBadge">即将上线</span>
            )}
            {agent.status === 'available' && (
              <CheckCircle size={20} className="availableIcon" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Phase 5: CreativeHub 主页面集成

#### 5.1 添加场景智能体入口按钮
在输入框区域添加场景选择器入口

#### 5.2 添加画质状态管理
```javascript
const [qualityLevel, setQualityLevel] = useState('standard');
const [selectedScene, setSelectedScene] = useState(null);
const [showScenePanel, setShowScenePanel] = useState(false);
```

---

### Phase 6: CSS 样式优化

#### 6.1 成功率样式
```css
.successRateBadge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  margin-left: auto;
}
```

#### 6.2 场景智能体样式
```css
.sceneAgentItem.coming-soon {
  opacity: 0.6;
  cursor: not-allowed;
}

.comingSoonBadge {
  font-size: 10px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  border-radius: 12px;
  font-weight: 600;
}
```

#### 6.3 参数行增强布局
```css
.smartCommandParamRow {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.paramCapsuleGroup .paramGroup {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 画质选择器 */
.qualitySelector {
  display: flex;
  gap: 4px;
  background: rgba(0,0,0,0.3);
  padding: 4px;
  border-radius: 8px;
}
```

---

## 📁 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/config/models.js` | 修改 | 添加 successRate、qualityLevels、sizeOptions 字段 |
| `src/config/models.js` | 修改 | 添加 SCENE_AGENTS 配置 |
| `src/components/ModelCapsuleGroup.jsx` | 修改 | 添加成功率显示 |
| `src/components/ParamCapsuleGroup.jsx` | 修改 | 添加更多比例、画质选项 |
| `src/components/SceneAgentSelector.jsx` | 新建 | 场景智能体选择组件 |
| `src/pages/CreativeHub.jsx` | 修改 | 集成场景选择器和画质控制 |
| `src/styles/creative-hub.css` | 修改 | 添加新组件样式 |

---

## 🎯 实现优先级

1. **P0 - 必须完成**
   - 模型成功率显示
   - 比例选项扩展
   - 画质选项添加

2. **P1 - 重要功能**
   - 场景智能体组件（带待开放状态）
   - 视觉层次优化

3. **P2 - 锦上添花**
   - 动画效果
   - 响应式适配

---

## ⚠️ 注意事项

1. **成功率数据** - 当前使用静态数据，后续可接入真实统计
2. **场景智能体** - 功能暂时不可用，仅展示UI，点击显示"即将上线"
3. **向后兼容** - 所有新增字段都有默认值，不影响现有功能
4. **性能考虑** - 新增组件使用 React.memo 优化渲染

---

## 🚀 预期效果

完成后界面将具备：
- ✅ 每个模型卡片显示成功率（绿色≥90%，黄色≥80%，红色<80%）
- ✅ 6种比例选择 + 3种画质等级
- ✅ 场景智能体面板（服装/电商/虚拟试衣等）
- ✅ 与参考图片一致的现代化设计风格

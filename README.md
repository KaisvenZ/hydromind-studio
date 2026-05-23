<p align="center">
  <img src="build/icon.png" width="96" alt="HydroMind Studio" />
</p>

<h1 align="center">HydroMind Studio</h1>

<p align="center">
  <b>流域数字孪生与 AI 调度研判系统</b><br/>
  Flow Basin Digital Twin & AI Dispatch Briefing Workbench
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.2.0-0ea5e9" alt="version" />
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-64748b" alt="platform" />
  <img src="https://img.shields.io/badge/tests-17%2F17-10b981" alt="tests" />
  <img src="https://img.shields.io/badge/build-passing-10b981" alt="build" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-10b981" alt="node" />
  <img src="https://img.shields.io/badge/license-MIT-f59e0b" alt="license" />
</p>

---

## 目录

- [简介](#简介)
- [界面概览](#界面概览)
- [核心功能](#核心功能)
- [快速开始](#快速开始)
- [下载安装](#下载安装)
- [使用指南](#使用指南)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [数据服务扩展](#数据服务扩展)
- [键盘快捷键](#键盘快捷键)
- [变更日志](#变更日志)
- [后续规划](#后续规划)
- [许可证](#许可证)

---

## 简介

HydroMind Studio 是一款面向防汛指挥场景的桌面端数字孪生系统。它以流域为单元，融合卫星影像、水文模型、情景推演和 AI 研判能力，在统一的指挥舱界面中呈现风险态势、驱动因子、行动建议和调度简报。

系统设计目标是在有限演示时间内清晰体现"**数据驱动决策 + 专业指挥界面 + 可解释 AI 简报**"的完整闭环，适用于应急管理教学、防汛演练、比赛评审和实际指挥场景的原型验证。

### 设计理念

- **专业优先**：深色指挥舱布局，非装饰性动画，颜色仅传达风险语义
- **证据透明**：每个风险分数都可拆解为具体驱动因子，知其然更知其所以然
- **离线可用**：核心功能不依赖网络，本地规则引擎保证演示稳定性
- **自动更新**：内置 GitHub Release 版本检查，一键跳转下载最新版本
- **可扩展**：数据服务抽象层支持从演示模式切换到真实水文数据源

---

## 界面概览

应用采用四区布局的指挥舱结构：

```
┌─────────────────────────────────────────────────┐
│  Topbar: 品牌 · 流域选择器 · 时钟 · 状态 · 语言 │
├────┬──────────────────────────────┬──────────────┤
│    │                              │  优先行动     │
│ 模 │    流域数字孪生地图           │  风险驱动     │
│ 式 │    (卫星底图+河网+节点)       │  场景对比     │
│ 栏 │                              │  行动状态     │
├────┴──────────────────────────────┴──────────────┤
│  情景控制台  │  预报过程线  │  节点列表  │ AI简报 │
│  操作日志   │              │            │        │
└─────────────────────────────────────────────────┘
```

---

## 核心功能

### 流域数字孪生地图

- 卫星影像底图叠加 SVG 矢量图层
- 河网主河道/支流动态光效，流向粒子动画
- 5 类节点图标：水库、城镇、泵站、闸门、湿地
- 点击节点弹出检查器：风险评分、水位高程、暴露人口
- 可切换图层：降雨单元（椭圆）和人口暴露（热力点）
- 风险场着色随预警等级变化（绿/黄/橙/红）

### 多流域支持

内置三个中国典型流域的演示配置：

| 流域 | 特点 | 节点数 |
|------|------|--------|
| 长江下游 | 水库-闸门-三角洲泵站串联，城镇密集 | 5 |
| 珠江三角洲 | 河网分叉多，下游泵排压力大，城市暴露高 | 5 |
| 太湖平原 | 湖体调蓄+平原河网，土壤饱和度高 | 5 |

每个流域拥有独立的节点布局、河网路径、风险场和默认情景参数。切换流域时自动重置场景和快照。

### 情景推演控制台

6 个可调节参数，范围 0–100（预报时窗 6–48h）：

- **暴雨强度** — 影响风险评分 35% 权重
- **水库水位** — 影响库容压力和节点水位
- **土壤饱和度** — 影响洪峰时间和风险传播
- **闸门开度** — 约束泄洪能力
- **泵站准备度** — 影响低洼节点排水
- **预报时窗** — 决定时间线跨度

三个预设情景一键加载：常规值守、台风脉冲、城市顶托。

### 风险解释引擎

综合风险评分 (0–100) 拆解为 6 个贡献因子，按权重排序：

| 因子 | 权重 | 说明 |
|------|------|------|
| 暴雨强度 | 35% | 直接降雨输入 |
| 预报时窗 | 25% | 预警准备时间压力 |
| 土壤饱和度 | 24% | 产流系数 |
| 水库水位 | 22% | 库容安全裕度 |
| 闸门约束 | 13% | 泄洪能力瓶颈 |
| 泵站约束 | 5% | 低洼排水瓶颈 |

每个因子有独立的预警等级（绿/黄/橙/红）和可视化进度条。

### 行动状态闭环

4 阶段指挥行动追踪：

```
计划中 (Planned) → 已前置 (Staged) → 已发送 (Sent) → 已复核 (Verified)
```

状态变更实时反映在决策栏和 AI 简报行动列表中。

### 场景快照与对比

- 一键保存当前场景（含完整参数和流域状态）
- 快照列表支持加载、删除
- 选择基线快照后，决策栏显示差异卡片：风险评分 Δ、库容压力 Δ、峰值时间 Δ、最高节点风险 Δ
- 对比数据同步显示在 AI 简报的证据条中

### AI 调度简报

三种简报模板，适配不同汇报对象：

| 模板 | 适用场景 | 内容特点 |
|------|----------|----------|
| 指挥摘要 | 指挥中心大屏 | 风险分数 + 证据 + 建议行动 |
| 管理备忘录 | 领导汇报 | 态势 + 影响 + 决策需求 + 风险提示 |
| 现场清单 | 一线队伍 | checkbox 行动清单 + 时序 + 核查要点 |

两种生成模式：

- **本地规则引擎**（默认）：确定性算法，离线可用，毫秒级响应
- **远程 OpenAI**（可选）：输入 API Key 后切换至 Responses API，GPT-5.1 生成自然语言简报；失败自动降级至本地模式

简报支持复制到剪贴板、导出 Markdown 文件。

### 操作日志

自动记录 17 种操作类型：语言切换、流域切换、参数调整、预设应用、快照保存/加载/删除/编辑、对比开始/清除、文件导入、简报导出/AI生成/复制、JSON 导出、模拟开始/停止、情景重置、面板打开。

日志面板显示时间戳、操作类型和详情，支持清空，最多保留 100 条，前 50 条持久化到本地存储。

### 数据服务抽象层

```typescript
interface DataServiceProvider {
  fetchBasinTelemetry(basinId: BasinId): Promise<BasinTelemetry>
  getStatus(): 'demo' | 'live'
}
```

当前使用 `DemoDataService` 生成模拟传感器读数和水文预报。通过 `setDataService()` 可替换为真实数据源（如水文站 API、气象预报服务），无需修改 UI 和业务逻辑层。

### 国际化

完整的中/英/日/韩四语支持，覆盖：

- 界面标签和按钮（60+ 翻译项）
- 节点名称（15 个节点均有四语名称）
- 风险驱动因子标签（6 项）
- 预警等级（绿/黄/橙/红）
- 行动名称、影响描述
- 简报模板和导出文案
- 操作日志类型标签
- 预设情景描述

默认语言为中文，可通过顶部栏按钮循环切换，偏好持久化保存。

---

## 快速开始

### 环境要求

- Node.js >= 20
- npm >= 9
- macOS / Windows / Linux

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/KaisvenZ/hydromind-studio.git
cd hydromind-studio

# 安装依赖
npm install

# 浏览器开发模式（推荐首发体验）
npm run dev
# 访问 http://localhost:5173
```

### 桌面端模式

```bash
# Electron 开发模式（热更新 + 原生窗口）
npm run desktop:dev

# 打包 macOS 安装包
npm run desktop:dist
# 输出: release/HydroMind Studio-1.2.0-arm64-mac.zip

# 仅打包不解压
npm run desktop:pack
```

### 验证

```bash
# 运行全部测试
npm run test

# 类型检查 + 生产构建
npm run build

# 代码检查
npm run lint
```

---

## 下载安装

前往 [Releases](https://github.com/KaisvenZ/hydromind-studio/releases) 下载对应平台的安装包。

### macOS

```bash
# 1. 解压 zip
unzip "HydroMind Studio-1.2.0-arm64-mac.zip"

# 2. 右键 HydroMind Studio.app → 打开
#    （首次需绕过 Gatekeeper，因应用未参与 Apple 签名计划）

# 或终端运行
xattr -cr "HydroMind Studio.app" && open "HydroMind Studio.app"
```

### Windows

```bash
npm install
npm run desktop:dist
# 输出 NSIS 安装包: release/HydroMind Studio Setup 1.2.0.exe
```

### Linux

```bash
npm install
npm run desktop:dist
# 输出 AppImage: release/HydroMind Studio-1.2.0.AppImage
```

---

## 使用指南

### 典型演示流程（3 分钟）

1. **打开应用** → 第一屏展示流域地图、风险评分、驱动因子和优先行动
2. **点击地图节点**（如"三角洲泵站"）→ 弹出节点检查器，展示风险、水位、暴露人口
3. **切换流域** → 顶部栏流域选择器切换至"珠江三角洲"，观察不同流域的风险特征
4. **调节参数** → 拖动暴雨强度滑块至 88，观察风险分数变化和驱动因子重排
5. **保存快照** → 点击保存，再加载"台风脉冲"预设，选择快照作为对比基线
6. **查看差异** → 决策栏显示风险 Δ、库容压力 Δ、峰值时间 Δ
7. **切换简报模板** → 选择"现场清单"，点击生成，查看 checkbox 格式的行动清单
8. **导出简报** → 点击导出 Markdown，可用任意 Markdown 编辑器打开

### 导入外部场景数据

支持 JSON 和 CSV 格式：

```json
{
  "stormIntensity": 78,
  "reservoirLevel": 82,
  "soilSaturation": 70,
  "gateOpening": 35,
  "forecastHours": 30,
  "pumpReadiness": 60
}
```

```csv
stormIntensity,reservoirLevel,soilSaturation,gateOpening,forecastHours,pumpReadiness
78,82,70,35,30,60
```

点击"导入 JSON/CSV"按钮选择文件，数据即刻载入。

### API Key 配置（可选）

1. 在 AI 简报面板输入 OpenAI API Key
2. 点击生成，系统通过 Responses API 调用远程模型
3. 若远程请求失败，自动回退至本地规则引擎
4. API Key 仅存储在本地，不上传至任何服务器

---

## 技术架构

```
┌──────────────────────────────────────────┐
│              Electron 42                 │
│         (main.cjs + preload.cjs)          │
├──────────────────────────────────────────┤
│              React 19 + Vite 8           │
│  ┌─────────────┐  ┌───────────────────┐  │
│  │  Components │  │   Zustand Store   │  │
│  │  10 panels  │  │  (persist + migrate)│  │
│  └──────┬──────┘  └────────┬──────────┘  │
│         │                  │              │
│  ┌──────┴──────────────────┴──────────┐  │
│  │           Domain Layer              │  │
│  │  hydro.ts  compare.ts  basin-defs  │  │
│  │  audit-log.ts                      │  │
│  └────────────────┬───────────────────┘  │
│                   │                      │
│  ┌────────────────┴───────────────────┐  │
│  │         Services Layer             │  │
│  │   ai.ts (OpenAI + local fallback)  │  │
│  │   data-service.ts (Demo/Live)      │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│     Recharts  │  SVG  │  Lucide Icons    │
│     Framer Motion  │  Tailwind-merge     │
└──────────────────────────────────────────┘
```

### 设计决策

- **无路由**：单页指挥舱，模式栏为结构性锚点，不引入 React Router
- **无后端**：所有逻辑在客户端执行，本地规则引擎保证离线可用
- **领域独立**：`src/domain/` 不依赖 React，纯函数可独立测试
- **国际化在 UI 层**：领域模型返回语言无关的数据结构，翻译在组件层完成
- **持久化保守**：仅持久化语言、API Key、最近 20 条快照、简报模板、图层设置、前 50 条操作日志

---

## 项目结构

```
hydromind-studio/
├── build/                     # 应用图标 (icns/png/svg)
├── docs/superpowers/          # 设计文档与实施计划
│   ├── plans/                 # 实施计划
│   └── specs/                 # 设计规格说明
├── electron/                  # Electron 主进程
│   ├── main.cjs               # 窗口创建、加载策略
│   └── preload.cjs            # 上下文桥接
├── public/
│   └── assets/                # 静态资源（卫星底图等）
├── src/
│   ├── components/
│   │   ├── briefing/          # BriefingRenderer — Markdown→JSX
│   │   ├── layout/            # CommandShell, Topbar, ModeRail
│   │   ├── map/               # BasinMap — SVG 地图渲染引擎
│   │   ├── panels/            # 7 个功能面板 + AboutPanel + AuditLogPanel + ReplayPanel
│   │   └── ui/                # 7 个通用 UI 组件
│   ├── domain/                # 纯函数领域模型
│   │   ├── hydro.ts           # 水文计算、风险评分、简报导出
│   │   ├── hydro.test.ts      # 领域模型单元测试
│   │   ├── compare.ts         # 场景对比计算
│   │   ├── basin-defs.ts      # 流域定义与节点配置
│   │   └── audit-log.ts       # 操作日志类型定义
│   ├── services/
│   │   ├── ai.ts              # AI 简报服务
│   │   ├── ai.test.ts         # AI 服务单元测试
│   │   ├── data-service.ts    # 数据服务抽象层
│   │   └── version-check.ts   # GitHub Release 版本检查
│   ├── stores/
│   │   └── useAppStore.ts     # Zustand 全局状态
│   ├── hooks/                 # useFlashAnimation, useKeyboardShortcuts
│   ├── styles/                # tokens.css, animations.css
│   ├── utils/
│   │   └── i18n.ts            # 中英双语翻译表
│   ├── types/
│   │   └── index.ts           # TypeScript 类型汇总
│   ├── test/
│   │   └── setup.ts           # Vitest + Testing Library 配置
│   ├── App.tsx                # 根组件（编排所有面板）
│   ├── App.test.tsx           # 集成测试
│   ├── App.css                # 全局样式
│   ├── main.tsx               # React 入口
│   └── index.css              # CSS 重置
├── index.html                 # Vite HTML 入口
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .gitignore
└── README.md
```

---

## 开发指南

### 代码规范

- TypeScript strict 模式
- 组件使用函数式声明 + Hooks
- 领域层纯函数，不依赖 React
- 新增 i18n key 需同时在 `en` 和 `zh-CN` 中添加
- 测试覆盖：领域模型、AI 服务、应用集成

### 添加新流域

编辑 `src/domain/basin-defs.ts`：

```typescript
{
  id: 'your-basin',
  nameZh: '你的流域名',
  nameEn: 'Your Basin Name',
  baseScenario: { stormIntensity: 64, ... },
  nodes: [ { id: '...', name: '...', type: 'reservoir', x: 20, y: 30, population: '0' } ],
  riverMainPath: 'M...',        // SVG path
  riverBranchPaths: ['M...'],   // SVG paths
  riskFieldPath: 'M...',        // SVG path
  mapImage: 'nasa-flood-satellite.jpg',
}
```

然后在 `BasinId` 联合类型和 `BASIN_DEFINITIONS` 中注册即可，UI 自动适配。

### 接入真实数据源

实现 `DataServiceProvider` 接口并注入：

```typescript
import { setDataService, type DataServiceProvider } from './services/data-service'

class RealHydroService implements DataServiceProvider {
  async fetchBasinTelemetry(basinId) {
    const res = await fetch(`https://api.example.com/basin/${basinId}`)
    return { ...await res.json(), source: 'live' }
  }
  getStatus() { return 'live' }
}

setDataService(new RealHydroService())
```

### 运行测试

```bash
npm run test              # 全部测试（watch 模式）
npm run test -- --run     # 单次运行
npm run test -- src/domain/hydro.test.ts  # 指定文件
```

---

## 键盘快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl/Cmd + G` | 生成 AI 简报 |
| `Ctrl/Cmd + E` | 导出简报 |
| `Ctrl/Cmd + R` | 重置情景 |
| `Ctrl/Cmd + L` | 切换语言 |
| `Ctrl/Cmd + S` | 保存快照 |

---

## 变更日志

### v1.2.0 (2026-05-24)

- 新增历史回放面板：保存的场景快照支持按时间轴逐帧回放
- 新增快照预案管理：快照可编辑说明、标签和备注
- 新增日/韩语言支持（日本語、한국어），覆盖全部界面与节点名称
- 新增关于面板：展示版本信息、技术栈、GitHub 链接
- 新增 GitHub Release 版本检查更新功能

### v1.1.0 (2026-05-23)

- 新增多流域支持（长江下游/珠江三角洲/太湖平原）
- 新增流域选择器组件
- 新增操作日志/审计追踪面板（16 种操作类型）
- 新增数据服务抽象层（DemoDataService + 扩展接口）
- 默认语言改为中文
- 修复风险驱动因子、运行状态、预警等级、节点提示的英文硬编码
- 修复模式栏文字截断和点击反馈
- 新增 10 个流域节点中英文名称翻译
- 完善 Windows NSIS 安装包配置
- Zustand 持久化版本迁移（v1→v2，强制默认中文）

### v1.0.0 (2026-05-23)

- 初始版本：指挥舱布局、流域地图、情景推演、AI 简报、快照对比

---

## 后续规划

- [ ] 接入真实水文传感器和气象预报 API
- [ ] 增加多预案管理和预案对比
- [ ] 多角色协同标注和操作留痕
- [ ] 引入模型服务端和权限体系
- [ ] Windows 安装包构建与发布
- [ ] 移动端适配（响应式已有基础）
- [ ] 内置自动更新下载（Electron autoUpdater）

---

## 许可证

MIT License — 详见 [LICENSE](LICENSE.md)

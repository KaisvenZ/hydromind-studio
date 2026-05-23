# HydroMind Command Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild HydroMind Studio into a professional flood command workbench with scenario comparison, risk evidence, action readiness, map layer controls, node inspection, and upgraded AI briefing controls.

**Architecture:** Keep the deterministic flood model in `src/domain`, UI state in Zustand, and visual surfaces in focused layout/panel components. The implementation starts with tested domain helpers, then wires store/i18n, then refactors the app shell and panels without introducing routing or backend services.

**Tech Stack:** React 19, TypeScript, Vite 8, Electron 42, Zustand, Framer Motion, Recharts, Lucide React, Vitest, Testing Library.

**Repository Note:** This project directory is not inside a git repository. Skip commit steps during execution and use test/build/browser verification as checkpoints.

---

## File Structure

- Create: `src/domain/compare.ts`
  - Owns scenario snapshot comparison and delta formatting.
- Modify: `src/domain/hydro.ts`
  - Adds `RiskDriver`, `BriefingTemplate`, risk-driver calculation, and templated briefing export.
- Modify: `src/types/index.ts`
  - Mirrors new app-facing types used by React components.
- Modify: `src/domain/hydro.test.ts`
  - Covers deterministic risk drivers and scenario deltas.
- Modify: `src/services/ai.ts`
  - Accepts briefing templates and emits local/remote template-aware prompts.
- Modify: `src/services/ai.test.ts`
  - Covers template-aware local generation and remote request shape.
- Modify: `src/stores/useAppStore.ts`
  - Wires comparison snapshot, simulation speed, action statuses, briefing template, and map layer defaults.
- Modify: `src/utils/i18n.ts`
  - Adds bilingual copy for new controls and panels.
- Create: `src/components/layout/CommandShell.tsx`
  - Owns top-level command layout.
- Create: `src/components/layout/ModeRail.tsx`
  - Renders structural mode rail with accessible icon buttons.
- Create: `src/components/panels/DecisionRail.tsx`
  - Renders priority action, risk drivers, scenario delta, and action readiness queue.
- Modify: `src/components/layout/Topbar.tsx`
  - Compact command header with simulation state.
- Modify: `src/components/panels/BasinMapPanel.tsx`
  - Adds KPI strip and map layer controls.
- Modify: `src/components/map/BasinMap.tsx`
  - Adds accessible node buttons, layer toggles, and node inspector.
- Modify: `src/components/panels/ControlDeck.tsx`
  - Adds simulation speed and snapshot comparison controls.
- Modify: `src/components/panels/TimelinePanel.tsx`
  - Removes redundant native bar fallback and keeps the Recharts view.
- Modify: `src/components/panels/AiBriefingPanel.tsx`
  - Adds template selector, evidence chips, copy/export actions, and Lucide key visibility icon.
- Modify: `src/components/briefing/BriefingRenderer.tsx`
  - Accepts translated action statuses when provided.
- Modify: `src/App.tsx`
  - Wires new shell, derived data, handlers, map layers, selected node, comparison, and template-aware AI generation.
- Modify: `src/styles/tokens.css`, `src/App.css`
  - Rebuilds visual language around the professional command shell.
- Modify: `src/App.test.tsx`
  - Updates shell assertions and keeps existing map layer/node inspector tests.

---

### Task 1: Domain Risk Evidence And Scenario Comparison

**Files:**
- Modify: `src/domain/hydro.ts`
- Create: `src/domain/compare.ts`
- Modify: `src/types/index.ts`
- Modify: `src/domain/hydro.test.ts`

- [ ] **Step 1: Write failing tests for risk drivers and scenario deltas**

Add these imports to `src/domain/hydro.test.ts`:

```ts
import { computeScenarioDelta } from './compare'
```

Add these tests inside the existing `describe('hydrology scenario engine', () => { ... })` block:

```ts
it('explains the current risk score with ranked deterministic drivers', () => {
  const state = computeBasinState({
    ...DEFAULT_SCENARIO,
    stormIntensity: 90,
    reservoirLevel: 86,
    soilSaturation: 82,
    gateOpening: 28,
    pumpReadiness: 54,
    forecastHours: 30,
  })

  expect(state.riskDrivers).toHaveLength(6)
  expect(state.riskDrivers[0]).toMatchObject({
    key: 'stormIntensity',
    label: 'Storm intensity',
    value: 90,
    status: 'red',
  })
  expect(state.riskDrivers.map((driver) => driver.contribution)).toEqual(
    [...state.riskDrivers.map((driver) => driver.contribution)].sort((a, b) => b - a),
  )
})

it('computes scenario deltas against a saved baseline snapshot', () => {
  const baseline = computeBasinState({
    ...DEFAULT_SCENARIO,
    stormIntensity: 54,
    reservoirLevel: 68,
    soilSaturation: 52,
    gateOpening: 52,
  })
  const current = computeBasinState({
    ...DEFAULT_SCENARIO,
    stormIntensity: 88,
    reservoirLevel: 84,
    soilSaturation: 80,
    gateOpening: 28,
  })

  const delta = computeScenarioDelta(current, baseline)

  expect(delta.riskScore).toBe(current.riskScore - baseline.riskScore)
  expect(delta.storagePressure).toBe(current.storagePressure - baseline.storagePressure)
  expect(delta.peakHour).toBe(current.expectedPeakHour - baseline.expectedPeakHour)
  expect(delta.maxNodeRisk).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run the failing domain tests**

Run:

```bash
npm run test -- src/domain/hydro.test.ts
```

Expected: FAIL because `riskDrivers` and `src/domain/compare.ts` do not exist.

- [ ] **Step 3: Add domain types and risk-driver calculation**

In `src/domain/hydro.ts`, add these exports near the existing type exports:

```ts
export type BriefingTemplate = 'command-summary' | 'executive-memo' | 'field-checklist'

export type RiskDriver = {
  key: keyof Scenario | 'gateConstraint' | 'pumpConstraint'
  label: string
  value: number
  contribution: number
  status: AlertLevel
}
```

Add `riskDrivers: RiskDriver[]` to `BasinState`.

Add this function below `getAlertLevel`:

```ts
export function computeRiskDrivers(scenario: Scenario): RiskDriver[] {
  const normalized = normalizeScenario(scenario)
  const forecastPressure = Math.round(((normalized.forecastHours - 6) / 42) * 100)
  const drivers: RiskDriver[] = [
    {
      key: 'stormIntensity',
      label: 'Storm intensity',
      value: normalized.stormIntensity,
      contribution: Math.round(normalized.stormIntensity * 0.35),
      status: getAlertLevel(normalized.stormIntensity),
    },
    {
      key: 'soilSaturation',
      label: 'Soil saturation',
      value: normalized.soilSaturation,
      contribution: Math.round(normalized.soilSaturation * 0.24),
      status: getAlertLevel(normalized.soilSaturation),
    },
    {
      key: 'reservoirLevel',
      label: 'Reservoir level',
      value: normalized.reservoirLevel,
      contribution: Math.round(normalized.reservoirLevel * 0.22),
      status: getAlertLevel(normalized.reservoirLevel),
    },
    {
      key: 'gateConstraint',
      label: 'Gate constraint',
      value: 100 - normalized.gateOpening,
      contribution: Math.round((100 - normalized.gateOpening) * 0.13),
      status: getAlertLevel(100 - normalized.gateOpening),
    },
    {
      key: 'forecastHours',
      label: 'Forecast horizon',
      value: normalized.forecastHours,
      contribution: Math.round(forecastPressure * 0.25),
      status: getAlertLevel(forecastPressure),
    },
    {
      key: 'pumpConstraint',
      label: 'Pump constraint',
      value: 100 - normalized.pumpReadiness,
      contribution: Math.round((100 - normalized.pumpReadiness) * 0.05),
      status: getAlertLevel(100 - normalized.pumpReadiness),
    },
  ]

  return drivers.sort((a, b) => b.contribution - a.contribution)
}
```

Inside `computeBasinState`, add `riskDrivers: computeRiskDrivers(normalized),` to the returned object.

- [ ] **Step 4: Add scenario comparison helper**

Create `src/domain/compare.ts`:

```ts
import type { BasinState } from './hydro'

export type ScenarioDelta = {
  riskScore: number
  storagePressure: number
  peakHour: number
  maxNodeRisk: number
}

function maxRisk(state: BasinState): number {
  return Math.max(...state.nodes.map((node) => node.risk))
}

export function computeScenarioDelta(current: BasinState, baseline: BasinState): ScenarioDelta {
  return {
    riskScore: current.riskScore - baseline.riskScore,
    storagePressure: current.storagePressure - baseline.storagePressure,
    peakHour: current.expectedPeakHour - baseline.expectedPeakHour,
    maxNodeRisk: maxRisk(current) - maxRisk(baseline),
  }
}

export function formatDelta(value: number): string {
  if (value > 0) return `+${value}`
  return String(value)
}
```

- [ ] **Step 5: Mirror new types for UI imports**

In `src/types/index.ts`, add:

```ts
export type BriefingTemplate = 'command-summary' | 'executive-memo' | 'field-checklist'

export type RiskDriver = {
  key: keyof Scenario | 'gateConstraint' | 'pumpConstraint'
  label: string
  value: number
  contribution: number
  status: AlertLevel
}
```

Add `riskDrivers: RiskDriver[]` to `BasinState`.

Add store-facing types:

```ts
export type ActionStatus = 'planned' | 'staged' | 'sent' | 'verified'

export type MapLayers = {
  rain: boolean
  population: boolean
}
```

- [ ] **Step 6: Run domain tests**

Run:

```bash
npm run test -- src/domain/hydro.test.ts
```

Expected: PASS.

---

### Task 2: Template-Aware AI Briefings

**Files:**
- Modify: `src/services/ai.ts`
- Modify: `src/services/ai.test.ts`
- Modify: `src/domain/hydro.ts`

- [ ] **Step 1: Write failing AI service test for templates**

Add this test to `src/services/ai.test.ts`:

```ts
it('generates a field checklist local briefing when requested', async () => {
  const state = computeBasinState(DEFAULT_SCENARIO)

  const briefing = await createAiBriefing({
    mode: 'local',
    state,
    template: 'field-checklist',
  })

  expect(briefing.source).toBe('local')
  expect(briefing.markdown).toContain('Field checklist')
  expect(briefing.markdown).toContain('[ ]')
})
```

- [ ] **Step 2: Run failing AI tests**

Run:

```bash
npm run test -- src/services/ai.test.ts
```

Expected: FAIL because `template` is not accepted.

- [ ] **Step 3: Add template support**

In `src/services/ai.ts`, import the new type:

```ts
import { exportBriefingMarkdown, translateAction, type BasinState, type BriefingTemplate, type Language } from '../domain/hydro'
```

Add `template?: BriefingTemplate` to `AiBriefingRequest`.

In the remote request body, change `instructions` to:

```ts
instructions: createInstructions(request.template ?? 'command-summary'),
```

Change `input` to:

```ts
input: exportBriefingMarkdown(request.state, request.language ?? 'en', request.template ?? 'command-summary'),
```

Change local calls to pass the template:

```ts
markdown: createLocalBriefing(request.state, request.language ?? 'en', request.template ?? 'command-summary'),
```

Add this helper above `createLocalBriefing`:

```ts
function createInstructions(template: BriefingTemplate): string {
  const templateFocus: Record<BriefingTemplate, string> = {
    'command-summary': 'Produce a concise command summary with risk, evidence, and recommended dispatch actions.',
    'executive-memo': 'Produce a polished executive memo with situation, implications, decision needs, and caveats.',
    'field-checklist': 'Produce a field checklist with checkbox actions, timing, and verification notes.',
  }

  return `You are a flood-control decision-support analyst. ${templateFocus[template]} Include a disclaimer that this is not an official operational command.`
}
```

Change the local function signature:

```ts
function createLocalBriefing(state: BasinState, language: Language, template: BriefingTemplate): string {
```

At the top of `createLocalBriefing`, add:

```ts
if (template === 'field-checklist') {
  const checklist = state.actions.map((action) => {
    const translated = translateAction(action, language)
    return `- [ ] ${translated.title}: ${translated.impact}`
  })

  if (language === 'zh-CN') {
    return ['## 现场核查清单', '', ...checklist, '', '本清单用于情景推演，不替代正式防汛调度命令。'].join('\n')
  }

  return ['## Field checklist', '', ...checklist, '', 'This checklist supports scenario rehearsal and does not replace official flood-control orders.'].join('\n')
}
```

- [ ] **Step 4: Extend briefing export template parameter**

In `src/domain/hydro.ts`, change:

```ts
export function exportBriefingMarkdown(state: BasinState, language: Language = 'en'): string {
```

to:

```ts
export function exportBriefingMarkdown(
  state: BasinState,
  language: Language = 'en',
  template: BriefingTemplate = 'command-summary',
): string {
```

At the start of the function after `actionText`, add:

```ts
if (template === 'field-checklist') {
  const checklist = state.actions
    .map((action) => {
      const translated = translateAction(action, language)
      return `- [ ] ${translated.title}: ${translated.impact}`
    })
    .join('\n')

  return language === 'zh-CN'
    ? ['# HydroMind 现场核查清单', '', checklist, '', '本清单用于情景推演，不替代正式防汛调度命令。'].join('\n')
    : ['# HydroMind Field Checklist', '', checklist, '', 'This checklist supports scenario rehearsal and does not replace official flood-control orders.'].join('\n')
}
```

- [ ] **Step 5: Run AI and domain tests**

Run:

```bash
npm run test -- src/services/ai.test.ts src/domain/hydro.test.ts
```

Expected: PASS.

---

### Task 3: Store And Copy Wiring

**Files:**
- Modify: `src/stores/useAppStore.ts`
- Modify: `src/utils/i18n.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Extend store state and actions**

In `src/stores/useAppStore.ts`, update imports:

```ts
import type {
  ActionStatus,
  BriefingTemplate,
  ImportMessage,
  Language,
  MapLayers,
  Scenario,
  ScenarioSnapshot,
} from '../types'
```

Add to `AppState`:

```ts
actionStatuses: Record<string, ActionStatus>
briefingTemplate: BriefingTemplate
mapLayers: MapLayers
setActionStatus: (actionKey: string, status: ActionStatus) => void
setBriefingTemplate: (template: BriefingTemplate) => void
setMapLayer: (layer: keyof MapLayers, enabled: boolean) => void
```

Add default values:

```ts
actionStatuses: {},
briefingTemplate: 'command-summary',
mapLayers: { rain: true, population: true },
```

Add actions:

```ts
setActionStatus: (actionKey, status) =>
  set((state) => ({
    actionStatuses: { ...state.actionStatuses, [actionKey]: status },
  })),

setBriefingTemplate: (briefingTemplate) => set({ briefingTemplate }),

setMapLayer: (layer, enabled) =>
  set((state) => ({
    mapLayers: { ...state.mapLayers, [layer]: enabled },
  })),
```

Add persisted fields to `partialize`:

```ts
briefingTemplate: state.briefingTemplate,
mapLayers: state.mapLayers,
```

- [ ] **Step 2: Add bilingual copy keys**

In `src/types/index.ts`, extend `CopyText` with these fields:

```ts
commandCenter: string
monitorMode: string
scenarioMode: string
briefingMode: string
exportsMode: string
runStatus: string
simulationSpeed: string
compareBaseline: string
clearCompare: string
riskDrivers: string
priorityAction: string
actionReadiness: string
planned: string
staged: string
sent: string
verified: string
briefingTemplate: string
commandSummary: string
executiveMemo: string
fieldChecklist: string
copyBriefing: string
rainCells: string
populationExposure: string
nodeInspector: string
exposure: string
maxNode: string
```

In `src/utils/i18n.ts`, add English values:

```ts
commandCenter: 'Command center',
monitorMode: 'Monitor',
scenarioMode: 'Scenario',
briefingMode: 'Briefing',
exportsMode: 'Exports',
runStatus: 'Run status',
simulationSpeed: 'Simulation speed',
compareBaseline: 'Compare baseline',
clearCompare: 'Clear compare',
riskDrivers: 'Risk drivers',
priorityAction: 'Priority action',
actionReadiness: 'Action readiness',
planned: 'Planned',
staged: 'Staged',
sent: 'Sent',
verified: 'Verified',
briefingTemplate: 'Briefing template',
commandSummary: 'Command summary',
executiveMemo: 'Executive memo',
fieldChecklist: 'Field checklist',
copyBriefing: 'Copy briefing',
rainCells: 'Rain cells',
populationExposure: 'Population exposure',
nodeInspector: 'Node Inspector',
exposure: 'Exposure',
maxNode: 'Max node',
```

Add Chinese values:

```ts
commandCenter: '指挥中心',
monitorMode: '监测',
scenarioMode: '情景',
briefingMode: '简报',
exportsMode: '导出',
runStatus: '运行状态',
simulationSpeed: '模拟速度',
compareBaseline: '对比基线',
clearCompare: '清除对比',
riskDrivers: '风险驱动',
priorityAction: '优先行动',
actionReadiness: '行动状态',
planned: '计划中',
staged: '已前置',
sent: '已发送',
verified: '已复核',
briefingTemplate: '简报模板',
commandSummary: '指挥摘要',
executiveMemo: '管理备忘录',
fieldChecklist: '现场清单',
copyBriefing: '复制简报',
rainCells: '降雨单元',
populationExposure: '人口暴露',
nodeInspector: '节点检查器',
exposure: '暴露度',
maxNode: '最高节点',
```

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
npm run build
```

Expected: FAIL until UI call sites are updated in later tasks, but no syntax errors should point to malformed copy/store code.

---

### Task 4: Map Layers And Node Inspector

**Files:**
- Modify: `src/components/map/BasinMap.tsx`
- Modify: `src/components/panels/BasinMapPanel.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Run existing app tests to confirm current gap**

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected: FAIL on `Rain cells`, `Population exposure`, and `Node Inspector` because the current UI does not provide those controls.

- [ ] **Step 2: Update BasinMap props**

In `src/components/map/BasinMap.tsx`, import `MapLayers`:

```ts
import type { BasinNode, BasinState, CopyText, MapLayers } from '../../types'
```

Change `BasinMapProps`:

```ts
interface BasinMapProps {
  state: BasinState
  t: CopyText
  layers: MapLayers
  selectedNodeId: string | null
  onSelectNode: (node: BasinNode) => void
}
```

Change `MapNode` props to include `onSelect`:

```ts
function MapNode({
  node,
  isMaxRisk,
  t,
  onSelect,
}: {
  node: BasinNode
  isMaxRisk: boolean
  t: CopyText
  onSelect: () => void
}) {
```

Replace the outer `<g ...>` with:

```tsx
<g
  className={`map-node ${alert} ${isMaxRisk ? 'node-pulse' : ''}`}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  onClick={onSelect}
  role="button"
  tabIndex={0}
  aria-label={`${translateNodeName(node.name, t)} risk ${node.risk}`}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }}
  style={{ cursor: 'pointer' }}
>
```

- [ ] **Step 3: Add visual layers to the map**

Inside `BasinMap`, before the risk field path, add:

```tsx
{layers.rain && (
  <g className="rain-cells" aria-hidden="true">
    <ellipse cx="26" cy="31" rx="16" ry="9" />
    <ellipse cx="66" cy="58" rx="18" ry="10" />
    <ellipse cx="78" cy="38" rx="12" ry="7" />
  </g>
)}

{layers.population && (
  <g className="population-exposure" aria-hidden="true">
    <circle cx="39" cy="42" r="8" />
    <circle cx="72" cy="64" r="7" />
    <circle cx="82" cy="36" r="5" />
  </g>
)}
```

When mapping nodes, pass:

```tsx
onSelect={() => onSelectNode(node)}
```

- [ ] **Step 4: Add map controls and inspector panel**

In `src/components/panels/BasinMapPanel.tsx`, update imports:

```ts
import type { BasinNode, BasinState, CopyText, MapLayers } from '../../types'
```

Change props:

```ts
interface BasinMapPanelProps {
  state: BasinState
  t: CopyText
  layers: MapLayers
  selectedNode: BasinNode | null
  onLayerChange: (layer: keyof MapLayers, enabled: boolean) => void
  onSelectNode: (node: BasinNode) => void
}
```

Add controls in the toolbar:

```tsx
<div className="map-layer-controls" aria-label="Map layers">
  <button
    type="button"
    aria-pressed={layers.rain}
    onClick={() => onLayerChange('rain', !layers.rain)}
  >
    {t.rainCells}
  </button>
  <button
    type="button"
    aria-pressed={layers.population}
    onClick={() => onLayerChange('population', !layers.population)}
  >
    {t.populationExposure}
  </button>
</div>
```

Render `BasinMap` with new props:

```tsx
<BasinMap state={state} t={t} layers={layers} selectedNodeId={selectedNode?.id ?? null} onSelectNode={onSelectNode} />
```

Below the map, render:

```tsx
{selectedNode && (
  <aside className="node-inspector">
    <p className="eyebrow">{t.nodeInspector}</p>
    <h3>{translateNodeName(selectedNode.name, t)}</h3>
    <div className="node-inspector-grid">
      <span>{t.risk}</span>
      <strong>{selectedNode.risk}</strong>
      <span>{t.waterLevel}</span>
      <strong>{selectedNode.waterLevel}m</strong>
      <span>{t.exposure}</span>
      <strong>{selectedNode.population} {t.people}</strong>
    </div>
  </aside>
)}
```

Also import `translateNodeName`.

- [ ] **Step 5: Run app tests**

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected: still FAIL until `App.tsx` wires props in Task 7.

---

### Task 5: Command Shell, Mode Rail, And Decision Rail

**Files:**
- Create: `src/components/layout/CommandShell.tsx`
- Create: `src/components/layout/ModeRail.tsx`
- Create: `src/components/panels/DecisionRail.tsx`
- Modify: `src/components/layout/Topbar.tsx`

- [ ] **Step 1: Create ModeRail**

Create `src/components/layout/ModeRail.tsx`:

```tsx
import { Bot, Download, Map, SlidersHorizontal } from 'lucide-react'
import type { CopyText } from '../../types'

interface ModeRailProps {
  t: CopyText
}

export function ModeRail({ t }: ModeRailProps) {
  const items = [
    { label: t.monitorMode, icon: <Map size={18} />, active: true },
    { label: t.scenarioMode, icon: <SlidersHorizontal size={18} />, active: false },
    { label: t.briefingMode, icon: <Bot size={18} />, active: false },
    { label: t.exportsMode, icon: <Download size={18} />, active: false },
  ]

  return (
    <nav className="mode-rail" aria-label={t.commandCenter}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={item.active ? 'active' : ''}
          aria-current={item.active ? 'page' : undefined}
          aria-label={item.label}
          title={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Create CommandShell**

Create `src/components/layout/CommandShell.tsx`:

```tsx
import type { ReactNode } from 'react'
import type { BasinState, CopyText, Language } from '../../types'
import { ModeRail } from './ModeRail'
import { Topbar } from './Topbar'

interface CommandShellProps {
  language: Language
  state: BasinState
  t: CopyText
  isSimulating: boolean
  onSwitchLanguage: () => void
  mapPanel: ReactNode
  decisionRail: ReactNode
  analysisPanels: ReactNode
}

export function CommandShell({
  language,
  state,
  t,
  isSimulating,
  onSwitchLanguage,
  mapPanel,
  decisionRail,
  analysisPanels,
}: CommandShellProps) {
  return (
    <main className="command-shell" lang={language === 'zh-CN' ? 'zh-Hans' : 'en'}>
      <Topbar
        language={language}
        state={state}
        t={t}
        isSimulating={isSimulating}
        onSwitchLanguage={onSwitchLanguage}
      />
      <div className="command-body">
        <ModeRail t={t} />
        <section className="command-canvas">{mapPanel}</section>
        <aside className="decision-column">{decisionRail}</aside>
      </div>
      <section className="analysis-grid">{analysisPanels}</section>
    </main>
  )
}
```

- [ ] **Step 3: Update Topbar props**

In `src/components/layout/Topbar.tsx`, add `isSimulating` to props and signature:

```ts
isSimulating: boolean
```

Add this badge before the language button:

```tsx
<span className={`run-status ${isSimulating ? 'running' : 'paused'}`}>
  {t.runStatus}: {isSimulating ? 'LIVE' : 'READY'}
</span>
```

- [ ] **Step 4: Create DecisionRail**

Create `src/components/panels/DecisionRail.tsx`:

```tsx
import { CheckCircle2, Circle, RadioTower, TrendingUp } from 'lucide-react'
import type { ActionStatus, BasinState, CopyText } from '../../types'
import type { ScenarioDelta } from '../../domain/compare'
import { formatDelta } from '../../domain/compare'
import { translateAction } from '../../domain/hydro'

interface DecisionRailProps {
  state: BasinState
  t: CopyText
  language: 'en' | 'zh-CN'
  delta: ScenarioDelta | null
  actionStatuses: Record<string, ActionStatus>
  onActionStatusChange: (actionKey: string, status: ActionStatus) => void
}

const statuses: ActionStatus[] = ['planned', 'staged', 'sent', 'verified']

export function DecisionRail({
  state,
  t,
  language,
  delta,
  actionStatuses,
  onActionStatusChange,
}: DecisionRailProps) {
  const priority = state.actions[0]

  return (
    <div className="decision-rail">
      <section className="decision-card priority">
        <div className="section-title compact">
          <RadioTower size={17} />
          <div>
            <p className="eyebrow">{t.priorityAction}</p>
            <h2>{priority ? translateAction(priority, language).title : t.noSnapshots}</h2>
          </div>
        </div>
        {priority && <p>{translateAction(priority, language).impact}</p>}
      </section>

      <section className="decision-card">
        <div className="section-title compact">
          <TrendingUp size={17} />
          <div>
            <p className="eyebrow">{t.riskDrivers}</p>
            <h2>{t.riskScore} {state.riskScore}</h2>
          </div>
        </div>
        <div className="driver-list">
          {state.riskDrivers.slice(0, 5).map((driver) => (
            <div key={driver.key} className="driver-row">
              <span>{driver.label}</span>
              <strong>{driver.contribution}</strong>
              <div className={`driver-bar ${driver.status}`} style={{ '--driver': `${driver.contribution}%` } as React.CSSProperties} />
            </div>
          ))}
        </div>
      </section>

      {delta && (
        <section className="decision-card">
          <p className="eyebrow">{t.compareBaseline}</p>
          <div className="delta-grid">
            <span>{t.riskScore}<strong>{formatDelta(delta.riskScore)}</strong></span>
            <span>{t.storagePressure}<strong>{formatDelta(delta.storagePressure)}</strong></span>
            <span>{t.peakWindow}<strong>{formatDelta(delta.peakHour)}h</strong></span>
            <span>{t.maxNode}<strong>{formatDelta(delta.maxNodeRisk)}</strong></span>
          </div>
        </section>
      )}

      <section className="decision-card">
        <p className="eyebrow">{t.actionReadiness}</p>
        <div className="action-status-list">
          {state.actions.map((action) => {
            const translated = translateAction(action, language)
            const current = actionStatuses[action.title] ?? 'planned'
            return (
              <article key={action.title} className="action-status-card">
                <strong>{translated.title}</strong>
                <div className="status-segments">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={current === status ? 'active' : ''}
                      onClick={() => onActionStatusChange(action.title, status)}
                    >
                      {current === status ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                      {t[status]}
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Run TypeScript check**

Run:

```bash
npm run build
```

Expected: FAIL until `App.tsx` imports and uses these components.

---

### Task 6: Control Deck And AI Panel Upgrades

**Files:**
- Modify: `src/components/panels/ControlDeck.tsx`
- Modify: `src/components/panels/AiBriefingPanel.tsx`
- Modify: `src/components/briefing/BriefingRenderer.tsx`

- [ ] **Step 1: Extend ControlDeck props**

In `ControlDeckProps`, add:

```ts
compareSnapshot: ScenarioSnapshot | null
simulationSpeed: number
onCompareSnapshot: (snapshot: ScenarioSnapshot | null) => void
onSimulationSpeedChange: (speed: number) => void
```

In the function signature, destructure these props.

Add simulation speed buttons after the play/pause button:

```tsx
<div className="speed-control" aria-label={t.simulationSpeed}>
  {[0.5, 1, 2, 4].map((speed) => (
    <button
      key={speed}
      type="button"
      className={simulationSpeed === speed ? 'active' : ''}
      onClick={() => onSimulationSpeedChange(speed)}
    >
      {speed}x
    </button>
  ))}
</div>
```

Inside the snapshot list, before `snapshot-items`, add:

```tsx
<div className="compare-row">
  <span>{t.compareBaseline}</span>
  <select
    value={compareSnapshot?.id ?? ''}
    onChange={(event) => {
      const selected = snapshots.find((snapshot) => snapshot.id === event.currentTarget.value) ?? null
      onCompareSnapshot(selected)
    }}
  >
    <option value="">{t.noSnapshots}</option>
    {snapshots.map((snapshot) => (
      <option key={snapshot.id} value={snapshot.id}>{snapshot.name}</option>
    ))}
  </select>
  {compareSnapshot && (
    <button type="button" onClick={() => onCompareSnapshot(null)}>
      {t.clearCompare}
    </button>
  )}
</div>
```

- [ ] **Step 2: Extend AiBriefingPanel props**

In `AiBriefingPanelProps`, add:

```ts
briefingTemplate: BriefingTemplate
onBriefingTemplateChange: (template: BriefingTemplate) => void
onCopyBriefing: () => void
onExport: () => void
```

Import the type:

```ts
import type { BasinState, BriefingTemplate, CopyText, Language } from '../../types'
```

Replace the emoji key toggle import with Lucide icons:

```ts
import { Brain, ChevronRight, ClipboardCopy, Download, Eye, EyeOff } from 'lucide-react'
```

Replace the key toggle button content:

```tsx
{showKey ? <EyeOff size={15} /> : <Eye size={15} />}
```

Add template selector before the API key input:

```tsx
<div className="briefing-template-row">
  {[
    ['command-summary', t.commandSummary],
    ['executive-memo', t.executiveMemo],
    ['field-checklist', t.fieldChecklist],
  ].map(([value, label]) => (
    <button
      key={value}
      type="button"
      className={briefingTemplate === value ? 'active' : ''}
      onClick={() => onBriefingTemplateChange(value as BriefingTemplate)}
    >
      {label}
    </button>
  ))}
</div>
```

Add copy/export buttons after generate:

```tsx
<Button variant="secondary" onClick={onCopyBriefing} icon={<ClipboardCopy size={15} />}>
  {t.copyBriefing}
</Button>
<Button variant="secondary" onClick={onExport} icon={<Download size={15} />}>
  {t.exportBriefing}
</Button>
```

Add evidence chips before `briefing-output`:

```tsx
<div className="evidence-chips">
  {state.riskDrivers.slice(0, 3).map((driver) => (
    <span key={driver.key} className={`evidence-chip ${driver.status}`}>
      {driver.label}: {driver.contribution}
    </span>
  ))}
</div>
```

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
npm run build
```

Expected: FAIL until `App.tsx` passes new props.

---

### Task 7: App Orchestration Refactor

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Import new components and comparison helper**

In `src/App.tsx`, add:

```ts
import { CommandShell } from './components/layout/CommandShell'
import { DecisionRail } from './components/panels/DecisionRail'
import { computeScenarioDelta } from './domain/compare'
import type { BasinNode } from './types'
```

- [ ] **Step 2: Pull new store fields**

In the store destructuring, add:

```ts
compareSnapshot,
simulationSpeed,
actionStatuses,
briefingTemplate,
mapLayers,
setCompareSnapshot,
setSimulationSpeed,
setActionStatus,
setBriefingTemplate,
setMapLayer,
```

Add local selected node state:

```ts
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
```

Import `useState` from React.

Add derived selected node and delta:

```ts
const selectedNode = useMemo(
  () => state.nodes.find((node) => node.id === selectedNodeId) ?? state.nodes[0] ?? null,
  [state.nodes, selectedNodeId],
)

const scenarioDelta = useMemo(
  () => compareSnapshot ? computeScenarioDelta(state, compareSnapshot.state) : null,
  [state, compareSnapshot],
)
```

- [ ] **Step 3: Wire template-aware generation and exports**

In `generateBriefing`, pass:

```ts
template: briefingTemplate,
```

Add `briefingTemplate` to the callback dependency array.

In `downloadReport`, pass:

```ts
exportBriefingMarkdown(state, language, briefingTemplate)
```

Add `briefingTemplate` to its dependency array.

Add copy handler:

```ts
const copyBriefing = useCallback(async () => {
  const text = briefing || exportBriefingMarkdown(state, language, briefingTemplate)
  try {
    await navigator.clipboard.writeText(text)
    showToast(language === 'zh-CN' ? '简报已复制' : 'Briefing copied', 'success')
  } catch {
    showToast(language === 'zh-CN' ? '复制失败' : 'Copy failed', 'error')
  }
}, [briefing, state, language, briefingTemplate, showToast])
```

- [ ] **Step 4: Wire simulation speed**

Replace the interval delay:

```ts
}, 1500)
```

with:

```ts
}, Math.max(300, Math.round(1500 / simulationSpeed)))
```

Add `simulationSpeed` to the simulation `useEffect` dependency array.

- [ ] **Step 5: Replace return markup with CommandShell**

Replace the current `return (...)` shell with:

```tsx
return (
  <>
    <CommandShell
      language={language}
      state={state}
      t={t}
      isSimulating={isSimulating}
      onSwitchLanguage={switchLanguage}
      mapPanel={
        <BasinMapPanel
          state={state}
          t={t}
          layers={mapLayers}
          selectedNode={selectedNode}
          onLayerChange={setMapLayer}
          onSelectNode={(node: BasinNode) => setSelectedNodeId(node.id)}
        />
      }
      decisionRail={
        <DecisionRail
          state={state}
          t={t}
          language={language}
          delta={scenarioDelta}
          actionStatuses={actionStatuses}
          onActionStatusChange={setActionStatus}
        />
      }
      analysisPanels={
        <>
          <ControlDeck
            scenario={scenario}
            t={t}
            snapshots={snapshots}
            compareSnapshot={compareSnapshot}
            importMessage={importMessage}
            isSimulating={isSimulating}
            simulationSpeed={simulationSpeed}
            onUpdateParam={updateScenarioParam}
            onPreset={(preset) => setScenario(preset)}
            onImport={handleImport}
            onExport={downloadReport}
            onExportJson={downloadJson}
            onSaveSnapshot={handleSaveSnapshot}
            onLoadSnapshot={loadSnapshot}
            onDeleteSnapshot={deleteSnapshot}
            onCompareSnapshot={setCompareSnapshot}
            onReset={resetScenario}
            onToggleSimulation={handleToggleSimulation}
            onSimulationSpeedChange={setSimulationSpeed}
          />
          <TimelinePanel timeline={state.timeline} t={t} />
          <NodeListPanel
            nodes={state.nodes}
            t={t}
            expandedNode={expandedNode}
            onToggleNode={(id) => setExpandedNode(expandedNode === id ? null : id)}
          />
          <AiBriefingPanel
            state={state}
            t={t}
            language={language}
            apiKey={apiKey}
            briefing={briefing}
            briefingSource={briefingSource}
            briefingTemplate={briefingTemplate}
            isGenerating={isGenerating}
            onApiKeyChange={setApiKey}
            onBriefingTemplateChange={setBriefingTemplate}
            onGenerate={generateBriefing}
            onCopyBriefing={copyBriefing}
            onExport={downloadReport}
          />
        </>
      }
    />
    {toast && <Toast />}
  </>
)
```

- [ ] **Step 6: Update App test identity assertions**

In `src/App.test.tsx`, change:

```ts
expect(screen.getByText('Flow Basin Digital Twin')).toBeInTheDocument()
```

to:

```ts
expect(screen.getByText('Flow Basin Digital Twin')).toBeInTheDocument()
expect(screen.getByLabelText('Command center')).toBeInTheDocument()
```

Keep the existing map layer and node inspector tests.

- [ ] **Step 7: Run app tests**

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected: PASS after CSS-independent UI wiring is complete.

---

### Task 8: Timeline Cleanup And Professional Styling

**Files:**
- Modify: `src/components/panels/TimelinePanel.tsx`
- Modify: `src/styles/tokens.css`
- Modify: `src/App.css`

- [ ] **Step 1: Remove redundant native timeline bars**

In `src/components/panels/TimelinePanel.tsx`, delete the block starting with:

```tsx
{/* Native bars as fallback/overlay */}
<div className="timeline-bars" aria-hidden="true">
```

and ending with the matching closing `</div>` before `</Card>`.

- [ ] **Step 2: Replace shell-level CSS structure**

In `src/App.css`, replace `.app-shell`, `.command-hero`, `.hero-grid`, `.dashboard-grid`, and `.insight-grid` layout rules with:

```css
.command-shell {
  min-height: 100vh;
  color: var(--color-text-secondary);
  background:
    linear-gradient(180deg, #071017 0%, #0b1420 46%, #101827 100%);
  font-family: var(--font-sans);
}

.command-shell::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.42;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
  background-size: 44px 44px;
}

.command-body {
  position: relative;
  z-index: 1;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px 20px;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) minmax(320px, 0.42fr);
  gap: 16px;
}

.command-canvas,
.decision-column,
.analysis-grid,
.topbar {
  position: relative;
  z-index: 1;
}

.analysis-grid {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px 28px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(330px, 0.85fr);
  gap: 16px;
}

.analysis-grid .node-list {
  grid-column: span 1;
}

.analysis-grid .ai-panel {
  grid-column: span 1;
}
```

- [ ] **Step 3: Add CSS for new controls and panels**

Append these classes to `src/App.css`:

```css
.mode-rail {
  display: grid;
  gap: 8px;
  align-content: start;
  padding: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.76);
}

.mode-rail button,
.map-layer-controls button,
.speed-control button,
.briefing-template-row button,
.status-segments button {
  min-height: 34px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-tertiary);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.mode-rail button {
  display: grid;
  place-items: center;
  gap: 4px;
  padding: 8px 4px;
}

.mode-rail button span {
  font-size: 10px;
}

.mode-rail button.active,
.map-layer-controls button[aria-pressed='true'],
.speed-control button.active,
.briefing-template-row button.active,
.status-segments button.active {
  color: var(--color-text-primary);
  border-color: var(--border-active);
  background: rgba(14, 165, 233, 0.14);
}

.run-status {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  color: var(--color-text-tertiary);
  background: rgba(255,255,255,0.04);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

.run-status.running {
  color: #a7f3d0;
  border-color: rgba(16, 185, 129, 0.32);
  background: rgba(16, 185, 129, 0.1);
}

.decision-rail {
  display: grid;
  gap: 12px;
}

.decision-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: rgba(15, 23, 42, 0.78);
  padding: 14px;
}

.section-title.compact {
  margin-bottom: 10px;
}

.driver-list,
.action-status-list {
  display: grid;
  gap: 10px;
}

.driver-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px 10px;
  align-items: center;
}

.driver-bar {
  grid-column: 1 / -1;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-accent-blue) var(--driver), rgba(148, 163, 184, 0.12) 0);
}

.driver-bar.red { background: linear-gradient(90deg, var(--color-risk-red) var(--driver), rgba(148, 163, 184, 0.12) 0); }
.driver-bar.orange { background: linear-gradient(90deg, var(--color-risk-orange) var(--driver), rgba(148, 163, 184, 0.12) 0); }
.driver-bar.yellow { background: linear-gradient(90deg, var(--color-risk-yellow) var(--driver), rgba(148, 163, 184, 0.12) 0); }
.driver-bar.green { background: linear-gradient(90deg, var(--color-risk-green) var(--driver), rgba(148, 163, 184, 0.12) 0); }

.delta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.delta-grid span {
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.04);
  color: var(--color-text-tertiary);
}

.delta-grid strong {
  color: var(--color-text-primary);
  font-size: var(--text-md);
}

.status-segments,
.briefing-template-row,
.speed-control,
.map-layer-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rain-cells ellipse {
  fill: rgba(56, 189, 248, 0.16);
  stroke: rgba(125, 211, 252, 0.34);
  stroke-width: 0.4;
}

.population-exposure circle {
  fill: rgba(245, 158, 11, 0.12);
  stroke: rgba(251, 191, 36, 0.36);
  stroke-width: 0.5;
}

.node-inspector {
  margin-top: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: rgba(15, 23, 42, 0.7);
  padding: 14px;
}

.node-inspector-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.evidence-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.evidence-chip {
  border-radius: var(--radius-pill);
  padding: 6px 10px;
  border: 1px solid var(--border-subtle);
  color: var(--color-text-tertiary);
  background: rgba(255,255,255,0.04);
  font-size: var(--text-xs);
}
```

- [ ] **Step 4: Add responsive rules**

Append:

```css
@media (max-width: 1180px) {
  .command-body {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .decision-column {
    grid-column: 2;
  }
}

@media (max-width: 760px) {
  .command-body,
  .analysis-grid {
    grid-template-columns: 1fr;
    padding-inline: 14px;
  }

  .mode-rail {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-flow: column;
  }

  .decision-column {
    grid-column: auto;
  }

  .topbar {
    padding-inline: 14px;
  }
}
```

- [ ] **Step 5: Run app tests and build**

Run:

```bash
npm run test -- src/App.test.tsx
npm run build
```

Expected: PASS.

---

### Task 9: Full Verification And Browser QA

**Files:**
- No planned file edits unless verification exposes defects.

- [ ] **Step 1: Run full unit test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Start dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL.

- [ ] **Step 4: Browser desktop verification**

Open the local Vite URL in the in-app browser.

Verify:

- Header, mode rail, map canvas, and decision rail are visible above the fold.
- `Rain cells` and `Population exposure` toggle `aria-pressed`.
- Clicking `Delta Pump Station` opens `Node Inspector`.
- Simulation starts, pauses, and speed buttons update active state.
- Saving a snapshot makes it available as a comparison baseline.
- Selecting comparison shows delta cards in the decision rail.
- AI template buttons switch active state.
- Local AI generation still renders briefing content.

- [ ] **Step 5: Browser mobile verification**

Resize or emulate a narrow viewport around 390px wide.

Verify:

- No text overlaps in header, map layer buttons, KPI cards, action readiness buttons, AI controls, and snapshot rows.
- Mode rail collapses to horizontal.
- Decision rail appears below map without overflow.
- Map remains at a usable height.

- [ ] **Step 6: Fix verification defects**

If a defect is found, edit the smallest affected file and rerun:

```bash
npm run test
npm run build
```

Expected: PASS after each fix.

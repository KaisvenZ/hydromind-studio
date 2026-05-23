export type AlertLevel = 'green' | 'yellow' | 'orange' | 'red'
export type Language = 'en' | 'zh-CN'
export type BriefingTemplate = 'command-summary' | 'executive-memo' | 'field-checklist'

export type Scenario = {
  stormIntensity: number
  reservoirLevel: number
  soilSaturation: number
  gateOpening: number
  forecastHours: number
  pumpReadiness: number
}

export type BasinNode = {
  id: string
  name: string
  type: 'reservoir' | 'town' | 'pump' | 'gate' | 'wetland'
  x: number
  y: number
  risk: number
  waterLevel: number
  population: string
}

export type DispatchAction = {
  title: string
  impact: string
  urgency: AlertLevel
}

export type RiskDriver = {
  key: keyof Scenario | 'gateConstraint' | 'pumpConstraint'
  label: string
  value: number
  contribution: number
  status: AlertLevel
}

export type BasinState = {
  scenario: Scenario
  riskScore: number
  alertLevel: AlertLevel
  expectedPeakHour: number
  affectedPopulation: string
  storagePressure: number
  nodes: BasinNode[]
  riskDrivers: RiskDriver[]
  actions: DispatchAction[]
  timeline: Array<{
    hour: number
    inflow: number
    level: number
    risk: number
  }>
}

export const DEFAULT_SCENARIO: Scenario = {
  stormIntensity: 64,
  reservoirLevel: 74,
  soilSaturation: 66,
  gateOpening: 42,
  forecastHours: 24,
  pumpReadiness: 68,
}

const BASE_NODES: Array<Omit<BasinNode, 'risk' | 'waterLevel'>> = [
  {
    id: 'upstream-reservoir',
    name: 'Upstream Reservoir',
    type: 'reservoir',
    x: 18,
    y: 27,
    population: '0',
  },
  {
    id: 'north-town',
    name: 'North Bank Town',
    type: 'town',
    x: 39,
    y: 42,
    population: '18k',
  },
  {
    id: 'main-gate',
    name: 'Main Sluice Gate',
    type: 'gate',
    x: 56,
    y: 51,
    population: '0',
  },
  {
    id: 'delta-pump',
    name: 'Delta Pump Station',
    type: 'pump',
    x: 72,
    y: 64,
    population: '8k',
  },
  {
    id: 'wetland-buffer',
    name: 'Wetland Buffer',
    type: 'wetland',
    x: 82,
    y: 36,
    population: '2k',
  },
]

export function computeBasinState(
  scenario: Scenario,
  basinNodes?: Array<Omit<BasinNode, 'risk' | 'waterLevel'>>,
): BasinState {
  const normalized = normalizeScenario(scenario)
  const nodeDefs = basinNodes ?? BASE_NODES
  const storagePressure = clamp(
    Math.round(
      normalized.reservoirLevel * 0.58 +
        normalized.soilSaturation * 0.24 +
        (100 - normalized.gateOpening) * 0.18,
    ),
  )
  const riskScore = clamp(
    Math.round(
      normalized.stormIntensity * 0.35 +
        normalized.reservoirLevel * 0.22 +
        normalized.soilSaturation * 0.24 +
        (100 - normalized.gateOpening) * 0.13 +
        normalized.forecastHours * 0.25 +
        (100 - normalized.pumpReadiness) * 0.05,
    ),
  )
  const alertLevel = getAlertLevel(riskScore)
  const expectedPeakHour = Math.max(
    3,
    Math.min(36, Math.round(normalized.forecastHours * (0.42 + normalized.soilSaturation / 380))),
  )
  const nodes = nodeDefs.map((node, index) => {
    const exposure = [0.8, 1.02, 0.92, 1.1, 0.7][index % 5] ?? 1
    const localRisk = clamp(
      Math.round(riskScore * exposure + normalized.soilSaturation * 0.08 - normalized.pumpReadiness * 0.04),
    )
    return {
      ...node,
      risk: localRisk,
      waterLevel: Number((2.1 + localRisk / 24 + normalized.reservoirLevel / 85).toFixed(1)),
    }
  })

  return {
    scenario: normalized,
    riskScore,
    alertLevel,
    expectedPeakHour,
    affectedPopulation: formatAffectedPopulation(riskScore),
    storagePressure,
    nodes,
    riskDrivers: computeRiskDrivers(normalized),
    actions: createActions(normalized, riskScore),
    timeline: createTimeline(normalized, riskScore),
  }
}

export function parseScenarioFile(filename: string, content: string): Scenario {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.json')) {
    return normalizeScenario(JSON.parse(content) as Partial<Scenario>)
  }
  if (lower.endsWith('.csv')) {
    return normalizeScenario(parseCsvRow(content))
  }
  throw new Error('Unsupported scenario file. Use JSON or CSV.')
}

export function exportBriefingMarkdown(
  state: BasinState,
  language: Language = 'en',
  template: BriefingTemplate = 'command-summary',
): string {
  const actionText = state.actions
    .map((action, index) => {
      const translated = translateAction(action, language)
      return `${index + 1}. ${translated.title}: ${translated.impact}`
    })
    .join('\n')

  if (template === 'field-checklist') {
    const checklist = createTemplateActionLines(state, language, '- [ ] ').join('\n')

    return language === 'zh-CN'
      ? ['# HydroMind 现场核查清单', '', checklist, '', '本清单用于情景推演，不替代正式防汛调度命令。'].join('\n')
      : ['# HydroMind Field Checklist', '', checklist, '', 'This checklist supports scenario rehearsal and does not replace official flood-control orders.'].join('\n')
  }

  if (template === 'executive-memo') {
    const decisionNeeds = createTemplateActionLines(state, language, '- ').join('\n')
    const topNodes = formatTopNodes(state)

    return language === 'zh-CN'
      ? [
          '## 管理备忘录',
          '',
          `态势: 当前流域风险评分为 ${state.riskScore}，预警等级为 ${translateAlertLevel(state.alertLevel)}，预计压力峰值出现在 T+${state.expectedPeakHour}h。`,
          '',
          `影响: 最高风险集中在 ${topNodes}。`,
          '',
          '决策需求:',
          decisionNeeds,
          '',
          '本备忘录用于情景推演，不替代正式防汛调度命令。',
        ].join('\n')
      : [
          '## Executive memo',
          '',
          `Situation: The basin risk score is ${state.riskScore} at ${state.alertLevel.toUpperCase()} alert, with peak pressure expected around T+${state.expectedPeakHour}h.`,
          '',
          `Implications: Highest risk is concentrated at ${topNodes}.`,
          '',
          'Decision needs:',
          decisionNeeds,
          '',
          'This memo supports scenario rehearsal and does not replace official flood-control orders.',
        ].join('\n')
  }

  if (language === 'zh-CN') {
    return [
      '# HydroMind 调度研判简报',
      '',
      `风险评分: ${state.riskScore}`,
      `预警等级: ${translateAlertLevel(state.alertLevel)}`,
      `预计洪峰: T+${state.expectedPeakHour}h`,
      `受影响人口估计: ${state.affectedPopulation}`,
      '',
      '## 建议行动',
      actionText,
      '',
      '本系统为情景推演与沟通展示用的决策支持原型，不替代正式防汛调度命令。现场团队必须复核传感器、预报数据和官方指挥流程后再采取实际行动。',
    ].join('\n')
  }

  return [
    '# HydroMind Dispatch Briefing',
    '',
    `Risk score: ${state.riskScore}`,
    `Alert level: ${state.alertLevel.toUpperCase()}`,
    `Expected peak: T+${state.expectedPeakHour}h`,
    `Affected population estimate: ${state.affectedPopulation}`,
    '',
    '## Recommended actions',
    actionText,
    '',
    'This is a decision-support prototype for scenario rehearsal and communication. Field teams must verify sensor data, forecasts, and official command procedures before operational use.',
  ].join('\n')
}

function createTemplateActionLines(state: BasinState, language: Language, prefix: string): string[] {
  return state.actions.map((action) => {
    const translated = translateAction(action, language)
    return `${prefix}${translated.title}: ${translated.impact}`
  })
}

function formatTopNodes(state: BasinState): string {
  return [...state.nodes]
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 3)
    .map((node) => `${node.name} (${node.risk})`)
    .join(', ')
}

export function getAlertLevel(score: number): AlertLevel {
  if (score >= 80) return 'red'
  if (score >= 66) return 'orange'
  if (score >= 46) return 'yellow'
  return 'green'
}

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
      contribution: Math.round(normalized.forecastHours * 0.25),
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

function normalizeScenario(input: Partial<Scenario>): Scenario {
  return {
    stormIntensity: clampNumber(input.stormIntensity, DEFAULT_SCENARIO.stormIntensity),
    reservoirLevel: clampNumber(input.reservoirLevel, DEFAULT_SCENARIO.reservoirLevel),
    soilSaturation: clampNumber(input.soilSaturation, DEFAULT_SCENARIO.soilSaturation),
    gateOpening: clampNumber(input.gateOpening, DEFAULT_SCENARIO.gateOpening),
    forecastHours: Math.max(6, Math.min(48, Math.round(Number(input.forecastHours ?? DEFAULT_SCENARIO.forecastHours)))),
    pumpReadiness: clampNumber(input.pumpReadiness, DEFAULT_SCENARIO.pumpReadiness),
  }
}

function parseCsvRow(content: string): Partial<Scenario> {
  const [headerLine, valueLine] = content.trim().split(/\r?\n/)
  if (!headerLine || !valueLine) {
    throw new Error('CSV scenario must include a header row and one value row.')
  }
  const headers = headerLine.split(',').map((value) => value.trim())
  const values = valueLine.split(',').map((value) => value.trim())

  return headers.reduce<Record<string, number>>((acc, header, index) => {
    acc[header] = Number(values[index])
    return acc
  }, {})
}

function createActions(scenario: Scenario, riskScore: number): DispatchAction[] {
  const actions: DispatchAction[] = []
  if (scenario.stormIntensity >= 70 || scenario.reservoirLevel >= 78) {
    actions.push({
      title: 'Raise upstream discharge readiness',
      impact: 'Prepare staged release windows before the forecast peak to reduce storage pressure.',
      urgency: riskScore >= 80 ? 'red' : 'orange',
    })
  }
  if (scenario.soilSaturation >= 70 || scenario.pumpReadiness < 58) {
    actions.push({
      title: 'Stage mobile pump units near lowland nodes',
      impact: 'Move pump assets toward the delta and low-lying townships before access roads degrade.',
      urgency: riskScore >= 75 ? 'red' : 'orange',
    })
  }
  if (riskScore >= 68) {
    actions.push({
      title: 'Issue township-level early warning',
      impact: 'Send segmented warnings to riverbank communities with peak-hour and shelter guidance.',
      urgency: riskScore >= 80 ? 'red' : 'orange',
    })
  }
  if (actions.length === 0) {
    actions.push({
      title: 'Maintain enhanced watch',
      impact: 'Keep 6-hour sensor review cadence and preserve gate operation flexibility.',
      urgency: 'yellow',
    })
  }
  return actions
}

export function translateAction(action: DispatchAction, language: Language): DispatchAction {
  if (language !== 'zh-CN') return action
  const dictionary: Record<string, DispatchAction> = {
    'Raise upstream discharge readiness': {
      title: '提升上游泄洪准备等级',
      impact: '在预报洪峰到达前准备分阶段泄洪窗口，降低库容压力。',
      urgency: action.urgency,
    },
    'Stage mobile pump units near lowland nodes': {
      title: '前置移动泵车至低洼节点',
      impact: '在交通条件恶化前，将泵排力量前置到下游低洼城镇与圩区。',
      urgency: action.urgency,
    },
    'Issue township-level early warning': {
      title: '发布乡镇级分区预警',
      impact: '向沿河社区发送包含洪峰时间和避险点位的分区预警信息。',
      urgency: action.urgency,
    },
    'Maintain enhanced watch': {
      title: '保持加密监测',
      impact: '维持 6 小时一轮的数据复核节奏，并保留闸门调度弹性。',
      urgency: action.urgency,
    },
  }
  return dictionary[action.title] ?? action
}

function translateAlertLevel(level: AlertLevel): string {
  const labels: Record<AlertLevel, string> = {
    green: '绿色',
    yellow: '黄色',
    orange: '橙色',
    red: '红色',
  }
  return labels[level]
}

function createTimeline(scenario: Scenario, riskScore: number): BasinState['timeline'] {
  const points = 8
  return Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1)
    const wave = Math.sin(progress * Math.PI)
    const hour = Math.round((scenario.forecastHours / (points - 1)) * index)
    const inflow = Math.round(120 + scenario.stormIntensity * 6.5 * wave + scenario.soilSaturation * 1.8)
    const level = Number((2.6 + scenario.reservoirLevel / 42 + wave * 1.7 - scenario.gateOpening / 140).toFixed(1))
    return {
      hour,
      inflow,
      level,
      risk: clamp(Math.round(riskScore * (0.48 + wave * 0.55))),
    }
  })
}

function formatAffectedPopulation(score: number): string {
  if (score >= 85) return '36k-52k'
  if (score >= 70) return '18k-34k'
  if (score >= 50) return '6k-16k'
  return '<5k'
}

function clampNumber(value: unknown, fallback: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return clamp(Math.round(numeric))
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

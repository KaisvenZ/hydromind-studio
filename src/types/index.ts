export type AlertLevel = 'green' | 'yellow' | 'orange' | 'red'
export type Language = 'en' | 'zh-CN' | 'ja' | 'ko'
export type BriefingTemplate = 'command-summary' | 'executive-memo' | 'field-checklist'
export type PlanLabel = 'A' | 'B' | 'C' | 'baseline' | 'extreme' | 'optimized'
export type { BasinId, BasinDefinition } from '../domain/basin-defs'
export type { AuditLogType, AuditEntry } from '../domain/audit-log'
export type { SensorReading, WeatherForecast, BasinTelemetry, DataServiceProvider } from '../services/data-service'

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

export type TimelinePoint = {
  hour: number
  inflow: number
  level: number
  risk: number
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
  timeline: TimelinePoint[]
}

export type ScenarioSnapshot = {
  id: string
  name: string
  description?: string
  planLabel?: PlanLabel
  timestamp: number
  scenario: Scenario
  state: BasinState
}

export type ImportMessage =
  | { type: 'demo' }
  | { type: 'imported'; filename: string }
  | { type: 'error'; message: string }

export type ActionStatus = 'planned' | 'staged' | 'sent' | 'verified'

export type ServerRole = 'commander' | 'hydrologist' | 'engineer' | 'observer'

export type UserSession = {
  username: string
  role: ServerRole
  token: string
} | null

export type RemoteAnnotation = {
  id: number
  snapshotId: string
  userId: number
  role: ServerRole
  content: string
  createdAt: string
}

export type MapLayers = {
  rain: boolean
  population: boolean
}

export type Preset = {
  name: string
  description: string
  scenario: Scenario
}

export type CopyText = {
  languageButton: string
  brandEyebrow: string
  commandCenter: string
  monitorMode: string
  scenarioMode: string
  briefingMode: string
  exportsMode: string
  runStatus: string
  risk: string
  liveScenario: string
  basinRiskTwin: string
  satelliteLayer: string
  aiDispatchStatus: string
  exposedNearPeak: string
  riskScore: string
  peakWindow: string
  storagePressure: string
  actionCount: string
  scenarioBuilder: string
  controlsTitle: string
  importJsonCsv: string
  exportBriefing: string
  demoLoaded: string
  imported: string
  forecastHydrograph: string
  peakPropagation: string
  criticalNodes: string
  riskConcentrates: string
  localFallback: string
  remoteModel: string
  aiBriefing: string
  optionalApiKey: string
  generate: string
  generating: string
  people: string
  floodRisk: string
  river: string
  controlNode: string
  basinMapLabel: string
  riverNetworkLabel: string
  riskSummaryLabel: string
  scenarioControlsLabel: string
  nodeListLabel: string
  waterLevel: string
  missionTime: string
  exportJson: string
  exportPdf: string
  saveSnapshot: string
  loadSnapshot: string
  snapshots: string
  compareMode: string
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
  playSimulation: string
  pauseSimulation: string
  simulationSpeed: string
  resetScenario: string
  noSnapshots: string
  runStatusLive: string
  runStatusReady: string
  basinSelector: string
  switchBasin: string
  auditLog: string
  auditLogEmpty: string
  clearLog: string
  dataSource: string
  demoMode: string
  replay: string
  replayStart: string
  replayStop: string
  replayEmpty: string
  planDescription: string
  planLabel: string
  planNotes: string
  editPlan: string
  about: string
  checkUpdate: string
  updateAvailable: string
  updateCurrent: string
  downloadUpdate: string
  collaborativeAnnotations: string
  notLoggedIn: string
  login: string
  logout: string
  addAnnotation: string
  noAnnotations: string
  driverLabels: Record<string, string>
  alertLevels: Record<string, string>
  nodeTypes: Record<string, string>
  nodeNames: Record<string, string>
  sliders: Record<string, string>
  timeline: Record<string, string>
  presets: Preset[]
}

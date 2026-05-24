import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActionStatus,
  AuditEntry,
  BasinId,
  BriefingTemplate,
  ImportMessage,
  Language,
  MapLayers,
  RemoteAnnotation,
  Scenario,
  ScenarioSnapshot,
  UserSession,
} from '../types'
import { computeBasinState, DEFAULT_SCENARIO } from '../domain/hydro'
import { BASIN_DEFINITIONS, DEFAULT_BASIN_ID } from '../domain/basin-defs'
import { AUDIT_MAX_ENTRIES } from '../domain/audit-log'
import type { AuditLogType } from '../domain/audit-log'

interface AppState {
  language: Language
  basinId: BasinId
  scenario: Scenario
  apiKey: string
  briefing: string
  briefingSource: 'local' | 'remote'
  isGenerating: boolean
  importMessage: ImportMessage
  expandedNode: string | null
  snapshots: ScenarioSnapshot[]
  compareSnapshot: ScenarioSnapshot | null
  isSimulating: boolean
  simulationSpeed: number
  actionStatuses: Record<string, ActionStatus>
  briefingTemplate: BriefingTemplate
  mapLayers: MapLayers
  auditLog: AuditEntry[]
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  userSession: UserSession
  annotations: RemoteAnnotation[]
  serverUrl: string

  // Actions
  setLanguage: (language: Language) => void
  setBasin: (basinId: BasinId) => void
  setScenario: (scenario: Scenario | ((prev: Scenario) => Scenario)) => void
  updateScenarioParam: (key: keyof Scenario, value: number) => void
  setApiKey: (key: string) => void
  setBriefing: (briefing: string, source: 'local' | 'remote') => void
  setIsGenerating: (value: boolean) => void
  setImportMessage: (message: ImportMessage) => void
  setExpandedNode: (id: string | null) => void
  addSnapshot: (name: string, planLabel?: ScenarioSnapshot['planLabel']) => void
  updateSnapshot: (id: string, updates: Partial<ScenarioSnapshot>) => void
  deleteSnapshot: (id: string) => void
  loadSnapshot: (snapshot: ScenarioSnapshot) => void
  setCompareSnapshot: (snapshot: ScenarioSnapshot | null) => void
  setIsSimulating: (value: boolean) => void
  setSimulationSpeed: (speed: number) => void
  setActionStatus: (actionKey: string, status: ActionStatus) => void
  setBriefingTemplate: (template: BriefingTemplate) => void
  setMapLayer: (layer: keyof MapLayers, enabled: boolean) => void
  addAuditEntry: (type: AuditLogType, detail: string) => void
  clearAuditLog: () => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  clearToast: () => void
  resetScenario: () => void
  setUserSession: (session: UserSession) => void
  setAnnotations: (annotations: RemoteAnnotation[]) => void
  addAnnotation: (annotation: RemoteAnnotation) => void
  removeAnnotation: (id: number) => void
  setServerUrl: (url: string) => void
}

function makeEntry(type: AuditLogType, detail: string): AuditEntry {
  return { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now(), type, detail }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'zh-CN',
      basinId: DEFAULT_BASIN_ID,
      scenario: DEFAULT_SCENARIO,
      apiKey: '',
      briefing: '',
      briefingSource: 'local',
      isGenerating: false,
      importMessage: { type: 'demo' },
      expandedNode: null,
      snapshots: [],
      compareSnapshot: null,
      isSimulating: false,
      simulationSpeed: 1,
      actionStatuses: {},
      briefingTemplate: 'command-summary',
      mapLayers: { rain: true, population: true },
      auditLog: [],
      toast: null,
      userSession: null,
      annotations: [],
      serverUrl: 'http://127.0.0.1:8777',

      setLanguage: (language) =>
        set({ language, briefing: '' }),

      setBasin: (basinId) => {
        const def = BASIN_DEFINITIONS[basinId]
        set({
          basinId,
          scenario: def.baseScenario,
          briefing: '',
          importMessage: { type: 'demo' },
          snapshots: [],
          compareSnapshot: null,
          actionStatuses: {},
        })
      },

      setScenario: (scenario) =>
        set((state) => ({
          scenario: typeof scenario === 'function' ? scenario(state.scenario) : scenario,
        })),

      updateScenarioParam: (key, value) =>
        set((state) => ({
          scenario: { ...state.scenario, [key]: value },
        })),

      setApiKey: (apiKey) => set({ apiKey }),
      setBriefing: (briefing, briefingSource) => set({ briefing, briefingSource }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setImportMessage: (importMessage) => set({ importMessage }),
      setExpandedNode: (expandedNode) => set({ expandedNode }),

      addSnapshot: (name, planLabel) => {
        const { scenario, snapshots, basinId } = get()
        const basin = BASIN_DEFINITIONS[basinId]
        const state = computeBasinState(scenario, basin.nodes)
        const newSnapshot: ScenarioSnapshot = {
          id: `snap-${Date.now()}`,
          name,
          description: '',
          planLabel: planLabel ?? 'baseline',
          timestamp: Date.now(),
          scenario: { ...scenario },
          state,
        }
        set({ snapshots: [...snapshots, newSnapshot] })
      },

      updateSnapshot: (id, updates) =>
        set((state) => ({
          snapshots: state.snapshots.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      deleteSnapshot: (id) =>
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== id),
        })),

      loadSnapshot: (snapshot) =>
        set({
          scenario: { ...snapshot.scenario },
          importMessage: { type: 'imported', filename: snapshot.name },
        }),

      setCompareSnapshot: (compareSnapshot) => set({ compareSnapshot }),
      setIsSimulating: (isSimulating) => set({ isSimulating }),
      setSimulationSpeed: (simulationSpeed) => set({ simulationSpeed }),
      setActionStatus: (actionKey, status) =>
        set((state) => ({
          actionStatuses: { ...state.actionStatuses, [actionKey]: status },
        })),
      setBriefingTemplate: (briefingTemplate) => set({ briefingTemplate }),
      setMapLayer: (layer, enabled) =>
        set((state) => ({
          mapLayers: { ...state.mapLayers, [layer]: enabled },
        })),

      addAuditEntry: (type, detail) =>
        set((state) => {
          const entry = makeEntry(type, detail)
          const log = [entry, ...state.auditLog].slice(0, AUDIT_MAX_ENTRIES)
          return { auditLog: log }
        }),

      clearAuditLog: () => set({ auditLog: [] }),

      showToast: (message, type) => set({ toast: { message, type } }),
      clearToast: () => set({ toast: null }),

      resetScenario: () => {
        const { basinId } = get()
        const def = BASIN_DEFINITIONS[basinId]
        set({
          scenario: { ...def.baseScenario },
          briefing: '',
          importMessage: { type: 'demo' },
        })
      },

      setUserSession: (userSession) => set({ userSession }),
      setAnnotations: (annotations) => set({ annotations }),
      addAnnotation: (annotation) => set((state) => ({ annotations: [...state.annotations, annotation] })),
      removeAnnotation: (id) => set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) })),
      setServerUrl: (serverUrl) => set({ serverUrl }),
    }),
    {
      name: 'hydromind-storage',
      version: 2,
      migrate: (persisted) => {
        const raw = persisted as Record<string, unknown>
        return { ...raw, language: 'zh-CN' } as typeof persisted
      },
      partialize: (state) => ({
        language: state.language,
        basinId: state.basinId,
        apiKey: state.apiKey,
        snapshots: state.snapshots.slice(-20),
        briefingTemplate: state.briefingTemplate,
        mapLayers: state.mapLayers,
        auditLog: state.auditLog.slice(0, 50),
        serverUrl: state.serverUrl,
      }),
    },
  ),
)

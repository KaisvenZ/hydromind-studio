import type { BasinState } from './hydro'

export type ScenarioDelta = {
  riskScore: number
  storagePressure: number
  peakHour: number
  maxNodeRisk: number
}

function maxRisk(state: BasinState): number {
  if (state.nodes.length === 0) return 0
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

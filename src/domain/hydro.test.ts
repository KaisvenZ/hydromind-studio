import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCENARIO,
  computeBasinState,
  exportBriefingMarkdown,
  parseScenarioFile,
} from './hydro'
import { computeScenarioDelta, formatDelta } from './compare'

describe('hydrology scenario engine', () => {
  it('raises risk and creates targeted actions when storm intensity increases', () => {
    const baseline = computeBasinState({
      ...DEFAULT_SCENARIO,
      stormIntensity: 42,
      reservoirLevel: 71,
      soilSaturation: 58,
      gateOpening: 38,
    })
    const storm = computeBasinState({
      ...DEFAULT_SCENARIO,
      stormIntensity: 88,
      reservoirLevel: 86,
      soilSaturation: 82,
      gateOpening: 25,
    })

    expect(storm.riskScore).toBeGreaterThan(baseline.riskScore + 22)
    expect(storm.alertLevel).toBe('red')
    expect(storm.actions.map((action) => action.title)).toEqual([
      'Raise upstream discharge readiness',
      'Stage mobile pump units near lowland nodes',
      'Issue township-level early warning',
    ])
  })

  it('parses imported JSON and CSV scenario files into the same domain shape', () => {
    const json = parseScenarioFile(
      'scenario.json',
      JSON.stringify({
        stormIntensity: 76,
        reservoirLevel: 80,
        soilSaturation: 73,
        gateOpening: 44,
        forecastHours: 18,
      }),
    )
    const csv = parseScenarioFile(
      'scenario.csv',
      'stormIntensity,reservoirLevel,soilSaturation,gateOpening,forecastHours\n76,80,73,44,18',
    )

    expect(json).toEqual(csv)
    expect(json.forecastHours).toBe(18)
  })

  it('exports a briefing with numeric evidence and a non-decision disclaimer', () => {
    const state = computeBasinState({
      ...DEFAULT_SCENARIO,
      stormIntensity: 92,
      reservoirLevel: 89,
      soilSaturation: 85,
      gateOpening: 30,
    })
    const briefing = exportBriefingMarkdown(state)

    expect(briefing).toContain(`Risk score: ${state.riskScore}`)
    expect(briefing).toContain('Recommended actions')
    expect(briefing).toContain('decision-support prototype')
  })

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

  it('formats positive, zero, and negative deltas', () => {
    expect(formatDelta(8)).toBe('+8')
    expect(formatDelta(0)).toBe('0')
    expect(formatDelta(-5)).toBe('-5')
  })
})

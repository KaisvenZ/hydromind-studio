import { motion } from 'framer-motion'
import { SlidersHorizontal, FileUp, Download, Save, RotateCcw, Play, Pause } from 'lucide-react'
import type { CopyText, ImportMessage, Scenario, ScenarioSnapshot } from '../../types'
import { Card } from '../ui/Card'
import { Slider } from '../ui/Slider'
import { Button } from '../ui/Button'

interface ControlDeckProps {
  scenario: Scenario
  t: CopyText
  snapshots: ScenarioSnapshot[]
  compareSnapshot: ScenarioSnapshot | null
  importMessage: ImportMessage
  isSimulating: boolean
  simulationSpeed: number
  onUpdateParam: (key: keyof Scenario, value: number) => void
  onPreset: (scenario: Scenario) => void
  onImport: (file: File | undefined) => void
  onExport: () => void
  onExportJson: () => void
  onSaveSnapshot: () => void
  onLoadSnapshot: (snapshot: ScenarioSnapshot) => void
  onDeleteSnapshot: (id: string) => void
  onCompareSnapshot: (snapshot: ScenarioSnapshot | null) => void
  onReset: () => void
  onToggleSimulation: () => void
  onSimulationSpeedChange: (speed: number) => void
}

export function ControlDeck({
  scenario,
  t,
  snapshots,
  compareSnapshot,
  importMessage,
  isSimulating,
  simulationSpeed,
  onUpdateParam,
  onPreset,
  onImport,
  onExport,
  onExportJson,
  onSaveSnapshot,
  onLoadSnapshot,
  onDeleteSnapshot,
  onCompareSnapshot,
  onReset,
  onToggleSimulation,
  onSimulationSpeedChange,
}: ControlDeckProps) {
  const formatImportStatus = (message: ImportMessage) => {
    if (message.type === 'demo') return t.demoLoaded
    if (message.type === 'imported') return `${message.filename} ${t.imported}`
    return message.message
  }

  const presets = t.presets

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card level={2} className="control-deck" aria-label={t.scenarioControlsLabel as string}>
        <div className="section-title">
          <SlidersHorizontal size={18} />
          <div>
            <p className="eyebrow">{t.scenarioBuilder}</p>
            <h2>{t.controlsTitle}</h2>
          </div>
        </div>

        <div className="preset-row">
          {presets.map((preset) => (
            <motion.button
              key={preset.name}
              type="button"
              className="preset-button"
              onClick={() => onPreset(preset.scenario)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <strong>{preset.name}</strong>
              <span>{preset.description}</span>
            </motion.button>
          ))}
        </div>

        <div className="slider-grid">
          <Slider
            label={t.sliders.stormIntensity as string}
            value={scenario.stormIntensity}
            onChange={(value) => onUpdateParam('stormIntensity', value)}
          />
          <Slider
            label={t.sliders.reservoirLevel as string}
            value={scenario.reservoirLevel}
            onChange={(value) => onUpdateParam('reservoirLevel', value)}
          />
          <Slider
            label={t.sliders.soilSaturation as string}
            value={scenario.soilSaturation}
            onChange={(value) => onUpdateParam('soilSaturation', value)}
          />
          <Slider
            label={t.sliders.gateOpening as string}
            value={scenario.gateOpening}
            onChange={(value) => onUpdateParam('gateOpening', value)}
          />
          <Slider
            label={t.sliders.pumpReadiness as string}
            value={scenario.pumpReadiness}
            onChange={(value) => onUpdateParam('pumpReadiness', value)}
          />
          <Slider
            label={t.sliders.forecastHours as string}
            min={6}
            max={48}
            value={scenario.forecastHours}
            onChange={(value) => onUpdateParam('forecastHours', value)}
          />
        </div>

        <div className="control-actions-row">
          <label className="file-button">
            <FileUp size={15} />
            {t.importJsonCsv}
            <input
              type="file"
              accept=".json,.csv"
              onChange={(event) => void onImport(event.currentTarget.files?.[0])}
            />
          </label>
          <Button variant="secondary" icon={<Download size={15} />} onClick={onExport}>
            {t.exportBriefing}
          </Button>
          <Button variant="secondary" icon={<Download size={15} />} onClick={onExportJson}>
            {t.exportJson}
          </Button>
          <Button variant="secondary" icon={<Save size={15} />} onClick={onSaveSnapshot}>
            {t.saveSnapshot}
          </Button>
          <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={onReset}>
            {t.resetScenario}
          </Button>
          <Button
            variant={isSimulating ? 'danger' : 'primary'}
            icon={isSimulating ? <Pause size={15} /> : <Play size={15} />}
            onClick={onToggleSimulation}
          >
            {isSimulating ? t.pauseSimulation : t.playSimulation}
          </Button>
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
          <span className="status-line">{formatImportStatus(importMessage)}</span>
        </div>

        {snapshots.length > 0 && (
          <div className="snapshot-list">
            <p className="eyebrow" style={{ marginBottom: 8 }}>{t.snapshots}</p>
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
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.name}
                  </option>
                ))}
              </select>
              {compareSnapshot && (
                <button type="button" onClick={() => onCompareSnapshot(null)}>
                  {t.clearCompare}
                </button>
              )}
            </div>
            <div className="snapshot-items">
              {snapshots.map((snap) => (
                <motion.div
                  key={snap.id}
                  className="snapshot-item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  layout
                >
                  <button onClick={() => onLoadSnapshot(snap)} className="snapshot-load-btn">
                    <strong>{snap.name}</strong>
                    <span>{new Date(snap.timestamp).toLocaleString()}</span>
                  </button>
                  <button
                    onClick={() => onDeleteSnapshot(snap.id)}
                    className="snapshot-delete-btn"
                    title="Delete"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { GitCompare, TrendingUp, TrendingDown } from 'lucide-react'
import type { BasinState, CopyText, Language, ScenarioSnapshot } from '../../types'
import { Card } from '../ui/Card'
import { computeScenarioDelta, type ScenarioDelta } from '../../domain/compare'

interface ComparisonPanelProps {
  current: BasinState
  baseline: ScenarioSnapshot | null
  language: Language
  t: CopyText
  onClear: () => void
}

function DeltaBadge({ value, unit = '' }: { value: number; unit?: string }) {
  const isUp = value > 0
  const isZero = value === 0
  return (
    <span className={`delta-badge ${isUp ? 'delta-up' : isZero ? 'delta-zero' : 'delta-down'}`}>
      {isUp ? <TrendingUp size={12} /> : !isZero ? <TrendingDown size={12} /> : null}
      {isUp ? '+' : ''}{value}{unit}
    </span>
  )
}

export function ComparisonPanel({ current, baseline, language, t, onClear }: ComparisonPanelProps) {
  if (!baseline) return null

  const delta: ScenarioDelta = computeScenarioDelta(current, baseline.state)
  const isZh = language === 'zh-CN'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card level={2} className="comparison-panel">
        <div className="section-title">
          <GitCompare size={18} />
          <div>
            <p className="eyebrow">{t.compareMode}</p>
            <h2>
              {isZh ? '对比基准' : 'Baseline'}: {baseline.name}
            </h2>
          </div>
          <button type="button" className="compare-clear-btn" onClick={onClear}>
            {t.clearCompare}
          </button>
        </div>

        <div className="comparison-grid">
          <ComparisonRow
            label={t.riskScore}
            current={current.riskScore}
            baseline={baseline.state.riskScore}
            delta={delta.riskScore}
          />
          <ComparisonRow
            label={t.storagePressure}
            current={current.storagePressure}
            baseline={baseline.state.storagePressure}
            delta={delta.storagePressure}
          />
          <ComparisonRow
            label={t.peakWindow}
            current={current.expectedPeakHour}
            baseline={baseline.state.expectedPeakHour}
            delta={delta.peakHour}
            unit="h"
          />
          <ComparisonRow
            label={t.maxNode}
            current={Math.max(...current.nodes.map((n) => n.risk))}
            baseline={Math.max(...baseline.state.nodes.map((n) => n.risk))}
            delta={delta.maxNodeRisk}
          />
        </div>
      </Card>
    </motion.div>
  )
}

function ComparisonRow({
  label,
  current,
  baseline,
  delta,
  unit = '',
}: {
  label: string
  current: number
  baseline: number
  delta: number
  unit?: string
}) {
  return (
    <div className="comparison-row">
      <span className="comparison-label">{label}</span>
      <div className="comparison-values">
        <span className="comparison-current">{current}{unit}</span>
        <span className="comparison-arrow">&rarr;</span>
        <span className="comparison-baseline">{baseline}{unit}</span>
        <DeltaBadge value={delta} unit={unit} />
      </div>
    </div>
  )
}

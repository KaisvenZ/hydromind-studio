import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import type { CopyText, TimelinePoint } from '../../types'
import { Card } from '../ui/Card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface TimelinePanelProps {
  timeline: TimelinePoint[]
  t: CopyText
  compareTimeline?: TimelinePoint[] | null
  compareLabel?: string
}

function CustomTooltip({ active, payload, label, t }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: TimelinePoint }>; label?: string; t: CopyText }) {
  if (!active || !payload) return null
  const data = payload[0]?.payload as TimelinePoint
  if (!data) return null

  return (
    <div className="recharts-tooltip-custom">
      <strong>T+{label}h</strong>
      <div>{t.timeline.inflow}: {data.inflow}m³/s</div>
      <div>{t.timeline.level}: {data.level}m</div>
      <div>{t.timeline.risk}: {data.risk}</div>
    </div>
  )
}

export function TimelinePanel({ timeline, t, compareTimeline, compareLabel }: TimelinePanelProps) {
  const maxRisk = Math.max(...timeline.map((p) => p.risk))
  const mergedData = compareTimeline
    ? timeline.map((pt, i) => ({
        ...pt,
        riskCmp: compareTimeline[i]?.risk ?? null,
        inflowCmp: compareTimeline[i]?.inflow ?? null,
      }))
    : timeline

  const showComparison = Boolean(compareTimeline && compareTimeline.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card level={2} className="timeline-panel" aria-label={t.forecastHydrograph as string}>
        <div className="section-title">
          <BarChart3 size={18} />
          <div>
            <p className="eyebrow">{t.forecastHydrograph}</p>
            <h2>{showComparison ? `${t.peakPropagation} vs ${compareLabel}` : t.peakPropagation}</h2>
          </div>
          {showComparison && (
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot" style={{background:'#ef4444'}} /> {t.timeline.risk} (current)</span>
              <span className="legend-item"><span className="legend-dot" style={{background:'#f97316'}} /> {t.timeline.risk} ({compareLabel})</span>
            </div>
          )}
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="riskCmpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `T+${v}h`}
                axisLine={{ stroke: 'rgba(148,163,184,0.12)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip t={t} />} />
              <ReferenceLine
                y={maxRisk}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: 'Peak',
                  fill: '#ef4444',
                  fontSize: 11,
                  position: 'insideTopRight',
                }}
              />
              {showComparison && (
                <Area
                  type="monotone"
                  dataKey="riskCmp"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  fill="url(#riskCmpGradient)"
                  dot={false}
                  animationDuration={800}
                />
              )}
              <Area
                type="monotone"
                dataKey="risk"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#riskGradient)"
                dot={{ r: 4, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#ef4444' }}
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#inflowGradient)"
                dot={false}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </Card>
    </motion.div>
  )
}

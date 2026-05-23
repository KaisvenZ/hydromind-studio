import { CheckCircle2, Circle, RadioTower, TrendingUp } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { ActionStatus, BasinState, CopyText, Language } from '../../types'
import type { ScenarioDelta } from '../../domain/compare'
import { formatDelta } from '../../domain/compare'
import { translateAction } from '../../domain/hydro'

interface DecisionRailProps {
  state: BasinState
  t: CopyText
  language: Language
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
            <h2>
              {t.riskScore} {state.riskScore}
            </h2>
          </div>
        </div>
        <div className="driver-list">
          {state.riskDrivers.slice(0, 5).map((driver) => (
            <div key={driver.key} className="driver-row">
              <span>{t.driverLabels[driver.key] ?? driver.label}</span>
              <strong>{driver.contribution}</strong>
              <div
                className={`driver-bar ${driver.status}`}
                style={{ '--driver': `${Math.min(100, driver.contribution)}%` } as CSSProperties}
              />
            </div>
          ))}
        </div>
      </section>

      {delta && (
        <section className="decision-card">
          <p className="eyebrow">{t.compareBaseline}</p>
          <div className="delta-grid">
            <span>
              {t.riskScore}
              <strong>{formatDelta(delta.riskScore)}</strong>
            </span>
            <span>
              {t.storagePressure}
              <strong>{formatDelta(delta.storagePressure)}</strong>
            </span>
            <span>
              {t.peakWindow}
              <strong>{formatDelta(delta.peakHour)}h</strong>
            </span>
            <span>
              {t.maxNode}
              <strong>{formatDelta(delta.maxNodeRisk)}</strong>
            </span>
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

import { Waves, Languages, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import type { BasinId, BasinState, CopyText, Language } from '../../types'
import { Clock } from '../ui/Clock'
import { BasinSelector } from '../ui/BasinSelector'

interface TopbarProps {
  language: Language
  basinId: BasinId
  state: BasinState
  t: CopyText
  isSimulating: boolean
  onSwitchLanguage: () => void
  onSwitchBasin: (id: BasinId) => void
}

export function Topbar({ language, basinId, state, t, isSimulating, onSwitchLanguage, onSwitchBasin }: TopbarProps) {
  return (
    <motion.header
      className="topbar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="brand-lockup">
        <motion.span
          className="brand-mark"
          whileHover={{ scale: 1.08, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <Waves size={20} />
        </motion.span>
        <div>
          <p className="eyebrow">{t.brandEyebrow}</p>
          <h1>HydroMind Studio</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <BasinSelector basinId={basinId} t={t} onChange={onSwitchBasin} />
        <Clock language={language} label={t.missionTime as string} />
        <span className={`run-status ${isSimulating ? 'running' : 'paused'}`}>
          {t.runStatus}: {isSimulating ? t.runStatusLive : t.runStatusReady}
        </span>
        <motion.button
          type="button"
          className="language-button"
          onClick={onSwitchLanguage}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          <Languages size={15} />
          {t.languageButton}
        </motion.button>
        <motion.div
          className={`alert-pill ${state.alertLevel}`}
          animate={state.alertLevel === 'red' ? {
            boxShadow: ['0 0 16px rgba(239,68,68,0.12)', '0 0 24px rgba(239,68,68,0.25)', '0 0 16px rgba(239,68,68,0.12)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShieldAlert size={16} />
          {t.alertLevels[state.alertLevel] ?? state.alertLevel.toUpperCase()} / {t.risk} {state.riskScore}
        </motion.div>
      </div>
    </motion.header>
  )
}

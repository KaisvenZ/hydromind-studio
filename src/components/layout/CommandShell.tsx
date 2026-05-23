import type { ReactNode } from 'react'
import type { BasinId, BasinState, CopyText, Language } from '../../types'
import { ModeRail } from './ModeRail'
import { Topbar } from './Topbar'

interface CommandShellProps {
  language: Language
  basinId: BasinId
  state: BasinState
  t: CopyText
  isSimulating: boolean
  onSwitchLanguage: () => void
  onSwitchBasin: (id: BasinId) => void
  onAbout: () => void
  mapPanel: ReactNode
  decisionRail: ReactNode
  analysisPanels: ReactNode
}

export function CommandShell({
  language,
  basinId,
  state,
  t,
  isSimulating,
  onSwitchLanguage,
  onSwitchBasin,
  onAbout,
  mapPanel,
  decisionRail,
  analysisPanels,
}: CommandShellProps) {
  return (
    <main className="command-shell" lang={language === 'zh-CN' ? 'zh-Hans' : 'en'}>
      <Topbar
        language={language}
        basinId={basinId}
        state={state}
        t={t}
        isSimulating={isSimulating}
        onSwitchLanguage={onSwitchLanguage}
        onSwitchBasin={onSwitchBasin}
        onAbout={onAbout}
      />
      <div className="command-body">
        <ModeRail t={t} />
        <section className="command-canvas">{mapPanel}</section>
        <aside className="decision-column">{decisionRail}</aside>
      </div>
      <section className="analysis-grid">{analysisPanels}</section>
    </main>
  )
}

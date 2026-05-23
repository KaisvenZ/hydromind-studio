import { Bot, Download, Map, SlidersHorizontal } from 'lucide-react'
import type { CopyText } from '../../types'

interface ModeRailProps {
  t: CopyText
}

export function ModeRail({ t }: ModeRailProps) {
  const items = [
    { label: t.monitorMode, icon: <Map size={18} />, active: true },
    { label: t.scenarioMode, icon: <SlidersHorizontal size={18} />, active: false },
    { label: t.briefingMode, icon: <Bot size={18} />, active: false },
    { label: t.exportsMode, icon: <Download size={18} />, active: false },
  ]

  return (
    <nav className="mode-rail" aria-label={t.commandCenter}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={item.active ? 'active' : ''}
          aria-current={item.active ? 'page' : undefined}
          aria-label={item.label}
          title={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

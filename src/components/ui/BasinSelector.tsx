import { MapPin } from 'lucide-react'
import type { BasinId, CopyText } from '../../types'
import { BASIN_DEFINITIONS } from '../../domain/basin-defs'

interface BasinSelectorProps {
  basinId: BasinId
  t: CopyText
  onChange: (id: BasinId) => void
}

const BASIN_ENTRIES: Array<{ id: BasinId }> = [
  { id: 'lower-yangtze' },
  { id: 'pearl-delta' },
  { id: 'taihu-plain' },
]

export function BasinSelector({ basinId, t, onChange }: BasinSelectorProps) {
  return (
    <div className="basin-selector" aria-label={t.basinSelector}>
      <MapPin size={14} />
      <select
        value={basinId}
        onChange={(event) => onChange(event.currentTarget.value as BasinId)}
        aria-label={t.switchBasin}
      >
        {BASIN_ENTRIES.map((entry) => {
          const def = BASIN_DEFINITIONS[entry.id]
          return (
            <option key={entry.id} value={entry.id}>
              {def.nameZh}
            </option>
          )
        })}
      </select>
    </div>
  )
}

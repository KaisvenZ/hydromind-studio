import { clsx } from 'clsx'

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export function Slider({ label, value, onChange, min = 0, max = 100, className }: SliderProps) {
  return (
    <label className={clsx('scenario-slider', className)}>
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
    </label>
  )
}

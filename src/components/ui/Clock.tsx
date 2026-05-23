import { useEffect, useState } from 'react'
import type { Language } from '../../types'

interface ClockProps {
  language: Language
  label: string
}

export function Clock({ language, label }: ClockProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeString = time.toLocaleTimeString(
    language === 'zh-CN' ? 'zh-CN' : 'en-US',
    { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false },
  )

  return (
    <span className="live-clock" title={label}>
      {timeString}
    </span>
  )
}

import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useAppStore } from '../../stores/useAppStore'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

export function Toast() {
  const toast = useAppStore((state) => state.toast)
  const clearToast = useAppStore((state) => state.clearToast)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => clearToast(), 4000)
    return () => clearTimeout(timer)
  }, [toast, clearToast])

  if (!toast) return null

  const Icon = icons[toast.type]

  return (
    <div className={clsx('toast-container', `toast-${toast.type}`, 'animate-toast-in')}>
      <Icon size={18} />
      <span>{toast.message}</span>
      <button onClick={clearToast} className="toast-close">
        <X size={14} />
      </button>
    </div>
  )
}

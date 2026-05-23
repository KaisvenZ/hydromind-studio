import { useEffect } from 'react'

interface Shortcuts {
  onGenerate?: () => void
  onExport?: () => void
  onReset?: () => void
  onLanguage?: () => void
  onSaveSnapshot?: () => void
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && key === 'enter' && shortcuts.onGenerate) {
        e.preventDefault()
        shortcuts.onGenerate()
      }
      if (ctrl && key === 's' && shortcuts.onSaveSnapshot) {
        e.preventDefault()
        shortcuts.onSaveSnapshot()
      }
      if (ctrl && key === 'e' && shortcuts.onExport) {
        e.preventDefault()
        shortcuts.onExport()
      }
      if (ctrl && key === 'r' && shortcuts.onReset) {
        e.preventDefault()
        shortcuts.onReset()
      }
      if (ctrl && key === 'l' && shortcuts.onLanguage) {
        e.preventDefault()
        shortcuts.onLanguage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

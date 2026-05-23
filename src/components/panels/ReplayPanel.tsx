import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import type { CopyText, Language, ScenarioSnapshot } from '../../types'
import { Card } from '../ui/Card'

interface ReplayPanelProps {
  snapshots: ScenarioSnapshot[]
  language: Language
  t: CopyText
  onLoadSnapshot: (snapshot: ScenarioSnapshot) => void
  onEditSnapshot: (id: string, description: string) => void
}

export function ReplayPanel({ snapshots, language, t, onLoadSnapshot, onEditSnapshot }: ReplayPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp)

  const stopReplay = useCallback(() => {
    setIsPlaying(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => {
    if (!isPlaying || sorted.length === 0) return
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1
        if (next >= sorted.length) { stopReplay(); return prev }
        onLoadSnapshot(sorted[next])
        return next
      })
    }, 1500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, sorted, onLoadSnapshot, stopReplay])

  const startReplay = () => {
    if (sorted.length === 0) return
    setIsPlaying(true)
    setCurrentIndex(0)
    onLoadSnapshot(sorted[0])
  }

  const stepForward = () => {
    if (sorted.length === 0) return
    const next = Math.min(currentIndex + 1, sorted.length - 1)
    setCurrentIndex(next)
    onLoadSnapshot(sorted[next])
  }

  const stepBack = () => {
    if (sorted.length === 0) return
    const prev = Math.max(currentIndex - 1, 0)
    setCurrentIndex(prev)
    onLoadSnapshot(sorted[prev])
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
      <Card level={2} className="replay-panel" aria-label={t.replay}>
        <div className="section-title">
          <History size={18} />
          <div>
            <p className="eyebrow">{t.replay}</p>
            <h2>
              {sorted.length > 0
                ? `${sorted.length} ${language === 'zh-CN' ? '个快照' : language === 'ja' ? 'スナップ' : language === 'ko' ? '스냅샷' : 'snapshots'}`
                : t.replayEmpty}
            </h2>
          </div>
        </div>

        {sorted.length > 0 && (
          <>
            <div className="replay-controls">
              <button type="button" onClick={stepBack} disabled={currentIndex === 0} title={language === 'zh-CN' ? '上一步' : 'Previous'}>
                <SkipBack size={15} />
              </button>
              <button type="button" onClick={isPlaying ? stopReplay : startReplay} className="replay-play-btn">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? t.replayStop : t.replayStart}
              </button>
              <button type="button" onClick={stepForward} disabled={currentIndex >= sorted.length - 1} title={language === 'zh-CN' ? '下一步' : 'Next'}>
                <SkipForward size={15} />
              </button>
            </div>

            {isPlaying && (
              <div className="replay-progress">
                <div className="replay-progress-bar" style={{ width: `${((currentIndex + 1) / sorted.length) * 100}%` }} />
              </div>
            )}

            <div className="replay-timeline">
              <AnimatePresence mode="popLayout">
                {sorted.map((snap, i) => (
                  <motion.div
                    key={snap.id}
                    className={`replay-step ${i === currentIndex ? 'active' : ''} ${i < currentIndex ? 'past' : ''}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    layout
                  >
                    <button
                      type="button"
                      className="replay-step-btn"
                      onClick={() => { setCurrentIndex(i); onLoadSnapshot(snap) }}
                    >
                      <span className="replay-step-index">{i + 1}</span>
                      <div className="replay-step-info">
                        <strong>{snap.name}</strong>
                        {snap.description && <span>{snap.description}</span>}
                        <time>{new Date(snap.timestamp).toLocaleTimeString(language === 'zh-CN' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="replay-edit-btn"
                      onClick={() => { setEditingId(snap.id); setEditText(snap.description ?? '') }}
                      title={t.editPlan}
                    >
                      {t.editPlan}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {editingId && (
              <motion.div className="replay-edit-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder={t.planDescription as string}
                  aria-label={t.planDescription as string}
                />
                <button type="button" onClick={() => { onEditSnapshot(editingId, editText); setEditingId(null) }}>
                  {language === 'zh-CN' ? '保存' : 'Save'}
                </button>
              </motion.div>
            )}
          </>
        )}
      </Card>
    </motion.div>
  )
}

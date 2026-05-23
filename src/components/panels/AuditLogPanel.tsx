import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Trash2 } from 'lucide-react'
import type { AuditEntry, CopyText, Language } from '../../types'
import { getAuditTypeLabel } from '../../domain/audit-log'
import { Card } from '../ui/Card'

interface AuditLogPanelProps {
  entries: AuditEntry[]
  language: Language
  t: CopyText
  onClear: () => void
}

function formatTime(ts: number, language: Language): string {
  const d = new Date(ts)
  return language === 'zh-CN'
    ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
    : d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function AuditLogPanel({ entries, language, t, onClear }: AuditLogPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <Card level={2} className="audit-log-panel" aria-label={t.auditLog}>
        <div className="section-title">
          <ClipboardList size={18} />
          <div>
            <p className="eyebrow">{t.auditLog}</p>
            <h2>{entries.length > 0 ? `${entries.length} ${language === 'zh-CN' ? '条记录' : 'entries'}` : t.auditLogEmpty}</h2>
          </div>
          {entries.length > 0 && (
            <button type="button" className="audit-clear-btn" onClick={onClear} title={t.clearLog}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <div className="audit-log-list">
          <AnimatePresence mode="popLayout">
            {entries.length === 0 ? (
              <motion.p
                key="empty"
                className="audit-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {t.auditLogEmpty}
              </motion.p>
            ) : (
              entries.slice(0, 30).map((entry) => (
                <motion.div
                  key={entry.id}
                  className="audit-entry"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  layout
                >
                  <span className="audit-time">{formatTime(entry.timestamp, language)}</span>
                  <span className="audit-type">{getAuditTypeLabel(entry.type, language)}</span>
                  <span className="audit-detail">{entry.detail}</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}

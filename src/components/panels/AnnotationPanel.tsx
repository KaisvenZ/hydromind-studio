import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Trash2, UserCircle, LogIn } from 'lucide-react'
import type { CopyText, Language, RemoteAnnotation, ScenarioSnapshot, ServerRole } from '../../types'
import { Card } from '../ui/Card'

const ROLE_LABELS: Record<ServerRole, Record<string, string>> = {
  commander: { 'zh-CN': '指挥长', en: 'Commander', ja: '指揮官', ko: '지휘관' },
  hydrologist: { 'zh-CN': '水文分析师', en: 'Hydrologist', ja: '水文学者', ko: '수문학자' },
  engineer: { 'zh-CN': '工程调度员', en: 'Engineer', ja: 'エンジニア', ko: '엔지니어' },
  observer: { 'zh-CN': '观察员', en: 'Observer', ja: 'オブザーバー', ko: '관찰자' },
}

const ROLE_COLORS: Record<ServerRole, string> = {
  commander: '#ef4444',
  hydrologist: '#3b82f6',
  engineer: '#10b981',
  observer: '#a855f7',
}

interface AnnotationPanelProps {
  language: Language
  t: CopyText
  snapshots: ScenarioSnapshot[]
  compareSnapshot: ScenarioSnapshot | null
  annotations: RemoteAnnotation[]
  userSession: { username: string; role: ServerRole } | null
  onAddAnnotation: (snapshotId: string, content: string) => Promise<void>
  onDeleteAnnotation: (id: number) => Promise<void>
  onLogin: (username: string, password: string) => Promise<void>
  onLogout: () => void
}

export function AnnotationPanel({
  language,
  t,
  snapshots,
  compareSnapshot,
  annotations,
  userSession,
  onAddAnnotation,
  onDeleteAnnotation,
  onLogin,
  onLogout,
}: AnnotationPanelProps) {
  const [text, setText] = useState('')
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    compareSnapshot?.id ?? snapshots[0]?.id ?? '',
  )
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filtered = annotations.filter((a) => a.snapshotId === selectedSnapshotId)

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || !selectedSnapshotId) return
    setIsSubmitting(true)
    try {
      await onAddAnnotation(selectedSnapshotId, text.trim())
      setText('')
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }, [text, selectedSnapshotId, onAddAnnotation])

  const handleLogin = useCallback(async () => {
    if (!loginUser || !loginPass) return
    try {
      await onLogin(loginUser, loginPass)
      setShowLogin(false)
      setLoginUser('')
      setLoginPass('')
    } catch {
      // error handled by parent
    }
  }, [loginUser, loginPass, onLogin])

  const roleLabel = (role: ServerRole) => ROLE_LABELS[role][language] ?? role
  const isZh = language === 'zh-CN'
  const timeLocale = isZh ? 'zh-CN' : 'en-US'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
      <Card level={2} className="annotation-panel">
        <div className="section-title">
          <MessageSquare size={18} />
          <div>
            <p className="eyebrow">{t.collaborativeAnnotations}</p>
            <h2>
              {userSession
                ? `${roleLabel(userSession.role)}: ${userSession.username}`
                : t.notLoggedIn}
            </h2>
          </div>
          {userSession ? (
            <button type="button" className="login-btn" onClick={onLogout}>
              {t.logout}
            </button>
          ) : (
            <button type="button" className="login-btn" onClick={() => setShowLogin(!showLogin)}>
              <LogIn size={14} />
              {t.login}
            </button>
          )}
        </div>

        {showLogin && !userSession && (
          <motion.div className="login-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder={isZh ? '用户名' : 'Username'} />
            <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder={isZh ? '密码' : 'Password'} />
            <button type="button" onClick={handleLogin}>{t.login}</button>
          </motion.div>
        )}

        {snapshots.length > 0 && (
          <div className="annotation-snapshot-select">
            <select value={selectedSnapshotId} onChange={(e) => setSelectedSnapshotId(e.target.value)}>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {userSession && selectedSnapshotId && (
          <div className="annotation-input-row">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.addAnnotation as string}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            />
            <button type="button" onClick={handleSubmit} disabled={isSubmitting || !text.trim()}>
              <Send size={14} />
            </button>
          </div>
        )}

        <div className="annotation-list">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.p key="empty" className="annotation-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {t.noAnnotations}
              </motion.p>
            ) : (
              filtered.map((ann) => {
                const canDelete = userSession && (
                  userSession.role === 'commander' || userSession.role === ann.role
                )
                return (
                  <motion.div
                    key={ann.id}
                    className="annotation-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    layout
                  >
                    <div className="annotation-role-badge" style={{ backgroundColor: ROLE_COLORS[ann.role] }}>
                      <UserCircle size={12} />
                      {roleLabel(ann.role)}
                    </div>
                    <p className="annotation-content">{ann.content}</p>
                    <time className="annotation-time">
                      {new Date(ann.createdAt).toLocaleTimeString(timeLocale, {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                    {canDelete && (
                      <button type="button" className="annotation-delete" onClick={() => onDeleteAnnotation(ann.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}

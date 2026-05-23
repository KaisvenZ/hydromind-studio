import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Waves, X, ExternalLink, GitFork, Download, Cpu } from 'lucide-react'
import type { Language } from '../../types'
import { checkVersion, type VersionInfo } from '../../services/version-check'

interface AboutPanelProps {
  language: Language
  onClose: () => void
}

export function AboutPanel({ language, onClose }: AboutPanelProps) {
  const [checking, setChecking] = useState(false)
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)

  const handleCheckUpdate = async () => {
    setChecking(true)
    const info = await checkVersion()
    setVersionInfo(info)
    setChecking(false)
  }

  const zh = language === 'zh-CN' || language === 'ja' || language === 'ko'

  return (
    <AnimatePresence>
      <motion.div
        className="about-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="about-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="about-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>

          <div className="about-hero">
            <span className="about-logo">
              <Waves size={32} />
            </span>
            <h1>HydroMind Studio</h1>
            <p className="about-version">v1.2.0</p>
          </div>

          <div className="about-body">
            <p className="about-desc">
              {zh
                ? '桌面端防汛数字孪生与 AI 调度研判系统。以流域为单元，融合卫星影像、水文模型、情景推演和 AI 研判能力。'
                : 'A desktop flood-risk digital twin and AI dispatch briefing workbench for scenario rehearsal and decision support.'}
            </p>

            <div className="about-meta">
              <div className="about-meta-row">
                <Cpu size={14} />
                <span>{zh ? '技术栈' : 'Tech'}: React 19 · Electron 42 · TypeScript · Zustand · Recharts</span>
              </div>
              <div className="about-meta-row">
                <GitFork size={14} />
                <a href="https://github.com/KaisvenZ/hydromind-studio" target="_blank" rel="noopener noreferrer">
                  github.com/KaisvenZ/hydromind-studio
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div className="about-update">
              <button type="button" className="about-update-btn" onClick={handleCheckUpdate} disabled={checking}>
                <Download size={14} />
                {checking
                  ? (zh ? '检查中...' : 'Checking...')
                  : (zh ? '检查更新' : 'Check for updates')}
              </button>

              {versionInfo && (
                <motion.div
                  className={`about-update-result ${versionInfo.hasUpdate ? 'has-update' : ''}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {versionInfo.hasUpdate ? (
                    <>
                      <span className="update-badge">
                        {zh ? `新版本 v${versionInfo.latest} 可用` : `v${versionInfo.latest} available`}
                      </span>
                      <a href={versionInfo.url} target="_blank" rel="noopener noreferrer" className="update-link">
                        {zh ? '前往下载' : 'Download'} <ExternalLink size={11} />
                      </a>
                    </>
                  ) : (
                    <span className="update-current">
                      {zh ? `已是最新版本 v${versionInfo.current}` : `Up to date v${versionInfo.current}`}
                    </span>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          <p className="about-footer">
            {zh ? '© 2026 HydroMind Studio Team · MIT License' : '© 2026 HydroMind Studio Team · MIT License'}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

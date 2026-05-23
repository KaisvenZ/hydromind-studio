import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronRight, ClipboardCopy, Download, Eye, EyeOff } from 'lucide-react'
import type { ActionStatus, BasinState, BriefingTemplate, CopyText, Language } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { BriefingRenderer } from '../briefing/BriefingRenderer'

interface AiBriefingPanelProps {
  state: BasinState
  t: CopyText
  language: Language
  apiKey: string
  briefing: string
  briefingSource: 'local' | 'remote'
  briefingTemplate: BriefingTemplate
  actionStatuses: Record<string, ActionStatus>
  isGenerating: boolean
  onApiKeyChange: (value: string) => void
  onBriefingTemplateChange: (template: BriefingTemplate) => void
  onGenerate: () => void
  onCopyBriefing: () => void
  onExport: () => void
}

export function AiBriefingPanel({
  state,
  t,
  language,
  apiKey,
  briefing,
  briefingSource,
  briefingTemplate,
  actionStatuses,
  isGenerating,
  onApiKeyChange,
  onBriefingTemplateChange,
  onGenerate,
  onCopyBriefing,
  onExport,
}: AiBriefingPanelProps) {
  const [showKey, setShowKey] = useState(false)
  const templates: Array<[BriefingTemplate, string]> = [
    ['command-summary', t.commandSummary],
    ['executive-memo', t.executiveMemo],
    ['field-checklist', t.fieldChecklist],
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card level={2} className="ai-panel" aria-label={t.aiBriefing as string}>
        <div className="section-title">
          <Brain size={18} />
          <div>
            <p className="eyebrow">{briefingSource === 'remote' ? t.remoteModel : t.localFallback}</p>
            <h2>{t.aiBriefing}</h2>
          </div>
        </div>
        <div className="briefing-template-row" aria-label={t.briefingTemplate}>
          {templates.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={briefingTemplate === value ? 'active' : ''}
              onClick={() => onBriefingTemplateChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ai-key-row">
          <input
            aria-label="OpenAI API key"
            type={showKey ? 'text' : 'password'}
            placeholder={t.optionalApiKey as string}
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.currentTarget.value)}
          />
          <button
            type="button"
            className="key-toggle-btn"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'Hide' : 'Show'}
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <Button
            variant="primary"
            onClick={onGenerate}
            loading={isGenerating}
            icon={<ChevronRight size={15} />}
          >
            {isGenerating ? t.generating : t.generate}
          </Button>
          <Button variant="secondary" onClick={onCopyBriefing} icon={<ClipboardCopy size={15} />}>
            {t.copyBriefing}
          </Button>
          <Button variant="secondary" onClick={onExport} icon={<Download size={15} />}>
            {t.exportBriefing}
          </Button>
        </div>
        <div className="evidence-chips">
          {state.riskDrivers.slice(0, 3).map((driver) => (
            <span key={driver.key} className={`evidence-chip ${driver.status}`}>
              {driver.label}: {driver.contribution}
            </span>
          ))}
        </div>
        <div className="briefing-output">
          <BriefingRenderer
            markdown={briefing}
            actions={state.actions}
            actionStatuses={actionStatuses}
            language={language}
            fallbackState={state}
            t={t}
          />
        </div>
      </Card>
    </motion.div>
  )
}

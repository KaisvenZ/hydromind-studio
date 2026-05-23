import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { ActionStatus, BasinState, CopyText, DispatchAction, Language } from '../../types'
import { translateAction } from '../../domain/hydro'

interface BriefingRendererProps {
  markdown: string
  actions: DispatchAction[]
  actionStatuses: Record<string, ActionStatus>
  language: Language
  fallbackState: BasinState
  t: CopyText
}

export function BriefingRenderer({
  markdown,
  actions,
  actionStatuses,
  language,
  fallbackState,
  t,
}: BriefingRendererProps) {
  const content = useMemo(() => renderMarkdownToElements(markdown || createFallbackBriefing(fallbackState, language)), [markdown, fallbackState, language])

  return (
    <div className="briefing-content">
      {content}
      <ActionList actions={actions} actionStatuses={actionStatuses} language={language} t={t} />
      <Disclaimer language={language} />
    </div>
  )
}

function createFallbackBriefing(state: BasinState, language: Language): string {
  const topNodes = [...state.nodes]
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 3)
    .map((node) => `${node.name} (${node.risk})`)
    .join(', ')

  if (language === 'zh-CN') {
    return [
      '## 本地 AI 风格研判',
      '',
      `当前流域风险评分为 **${state.riskScore}**，预警等级为 **${state.alertLevel.toUpperCase()}**。`,
      `预计压力峰值出现在 **T+${state.expectedPeakHour}h**，高风险节点集中在 ${topNodes}。`,
      '',
      '### 调度重点',
      ...state.actions.map((action) => {
        const translated = translateAction(action, language)
        return `- **${translated.title}**: ${translated.impact}`
      }),
      '',
      '> 本地模式使用确定性规则生成，即使没有 API Key 也能稳定演示。',
    ].join('\n')
  }

  return [
    '## Local AI-style synthesis',
    '',
    `The basin risk score is **${state.riskScore}**, placing the scenario at **${state.alertLevel.toUpperCase()}** alert.`,
    `Peak pressure is expected around **T+${state.expectedPeakHour}h**, with highest node risk at ${topNodes}.`,
    '',
    '### Dispatch focus',
    ...state.actions.map((action) => `- **${action.title}**: ${action.impact}`),
    '',
    '> This local mode uses deterministic rules so the demo remains available without an API key.',
  ].join('\n')
}

function renderMarkdownToElements(markdown: string): ReactNode[] {
  const lines = markdown.split('\n')
  const elements: ReactNode[] = []
  let listItems: ReactNode[] = []
  let key = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <motion.ul key={`ul-${key++}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          {listItems}
        </motion.ul>
      )
      listItems = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }

    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <motion.h3 key={`h3-${key++}`} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
          {parseInline(line.slice(3))}
        </motion.h3>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <motion.h4 key={`h4-${key++}`} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
          {parseInline(line.slice(4))}
        </motion.h4>
      )
    } else if (line.startsWith('> ')) {
      flushList()
      elements.push(
        <motion.blockquote key={`bq-${key++}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          {parseInline(line.slice(2))}
        </motion.blockquote>
      )
    } else if (line.startsWith('- ')) {
      listItems.push(
        <motion.li key={`li-${key++}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {parseInline(line.slice(2))}
        </motion.li>
      )
    } else {
      flushList()
      elements.push(
        <motion.p key={`p-${key++}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {parseInline(line)}
        </motion.p>
      )
    }
  }

  flushList()
  return elements
}

function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = []
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`span-${key++}`}>{text.slice(lastIndex, match.index)}</span>)
    }
    if (match[2]) {
      parts.push(<strong key={`strong-${key++}`}>{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(<code key={`code-${key++}`}>{match[3]}</code>)
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`span-${key}`}>{text.slice(lastIndex)}</span>)
  }

  return <>{parts}</>
}

function ActionList({
  actions,
  actionStatuses,
  language,
  t,
}: {
  actions: DispatchAction[]
  actionStatuses: Record<string, ActionStatus>
  language: Language
  t: CopyText
}) {
  if (actions.length === 0) return null

  return (
    <motion.div className="action-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      {actions.map((action, index) => {
        const translated = language === 'zh-CN' ? translateAction(action, language) : action
        const current = actionStatuses[action.title] ?? 'planned'

        return (
          <motion.div
            key={action.title}
            className="action-item"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 2 }}
          >
            <div className={`action-urgency ${action.urgency}`} />
            <div className="action-text">
              <div className="action-heading">
                <strong>{translated.title}</strong>
                <span className={`action-status-pill ${current}`}>{t[current]}</span>
              </div>
              <span>{translated.impact}</span>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function Disclaimer({ language }: { language: Language }) {
  const text =
    language === 'zh-CN'
      ? '本系统为情景推演与沟通展示用的决策支持原型，不替代正式防汛调度命令。现场团队必须复核传感器、预报数据和官方指挥流程后再采取实际行动。'
      : 'This is a decision-support prototype for scenario rehearsal and communication. Field teams must verify sensor data, forecasts, and official command procedures before operational use.'

  return (
    <motion.div
      className="briefing-disclaimer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {text}
    </motion.div>
  )
}

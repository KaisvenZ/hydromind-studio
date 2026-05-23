import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { BasinNode, CopyText } from '../../types'
import { translateNodeName } from '../../utils/i18n'
import { Card } from '../ui/Card'

interface NodeListPanelProps {
  nodes: BasinNode[]
  t: CopyText
  expandedNode: string | null
  onToggleNode: (id: string) => void
}

function nodeAlertClass(risk: number) {
  if (risk >= 80) return 'red'
  if (risk >= 66) return 'orange'
  if (risk >= 46) return 'yellow'
  return 'green'
}

function NodeCard({
  node,
  t,
  expanded,
  onToggle,
}: {
  node: BasinNode
  t: CopyText
  expanded: boolean
  onToggle: () => void
}) {
  const alertClass = nodeAlertClass(node.risk)

  return (
    <motion.article
      className={`node-card ${expanded ? 'expanded' : ''}`}
      onClick={onToggle}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div style={{ display: 'grid', gap: '3px', flex: 1, minWidth: 0 }}>
        <strong>{translateNodeName(node.name, t)}</strong>
        <span>
          {t.nodeTypes[node.type]} / {node.population} {t.people}
        </span>
        <AnimatePresence>
          {expanded && (
            <motion.div
              className="node-detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="node-detail-item">
                <span>{t.waterLevel}</span>
                <strong>{node.waterLevel}m</strong>
              </div>
              <div className="node-detail-item">
                <span>Risk</span>
                <strong>{node.risk}/100</strong>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        className={`node-score ${alertClass}`}
        animate={alertClass === 'red' ? {
          boxShadow: [
            '0 0 8px rgba(239,68,68,0.2)',
            '0 0 16px rgba(239,68,68,0.4)',
            '0 0 8px rgba(239,68,68,0.2)',
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {node.risk}
      </motion.div>
    </motion.article>
  )
}

export function NodeListPanel({ nodes, t, expandedNode, onToggleNode }: NodeListPanelProps) {
  const sortedNodes = [...nodes].sort((a, b) => b.risk - a.risk)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card level={2} className="node-list" aria-label={t.nodeListLabel as string}>
        <div className="section-title">
          <AlertTriangle size={18} />
          <div>
            <p className="eyebrow">{t.criticalNodes}</p>
            <h2>{t.riskConcentrates}</h2>
          </div>
        </div>
        <div className="node-cards">
          <AnimatePresence mode="popLayout">
            {sortedNodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                t={t}
                expanded={expandedNode === node.id}
                onToggle={() => onToggleNode(node.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}

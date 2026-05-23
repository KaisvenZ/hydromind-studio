import { useMemo, useState } from 'react'
import type { BasinNode, BasinState, CopyText, MapLayers } from '../../types'
import { translateNodeName } from '../../utils/i18n'

const assetUrl = (filename: string) => `${import.meta.env.BASE_URL}assets/${filename}`

const DEFAULT_RIVER_MAIN = 'M8 23 C22 36, 29 31, 41 45 S62 53, 72 66 S86 75, 96 63'
const DEFAULT_RIVER_BRANCHES = ['M34 13 C43 28, 45 39, 56 51', 'M72 66 C77 50, 84 43, 94 35']
const DEFAULT_RISK_FIELD = 'M18 26 C35 22, 46 34, 52 48 C58 66, 80 59, 87 71 C75 91, 39 85, 28 66 C19 53, 7 42, 18 26 Z'

interface BasinMapProps {
  state: BasinState
  t: CopyText
  layers: MapLayers
  selectedNodeId: string | null
  onSelectNode: (node: BasinNode) => void
  riverMainPath?: string
  riverBranchPaths?: string[]
  riskFieldPath?: string
}

function nodeAlertClass(risk: number) {
  if (risk >= 80) return 'red'
  if (risk >= 66) return 'orange'
  if (risk >= 46) return 'yellow'
  return 'green'
}

const ICON_PATHS: Record<BasinNode['type'], string> = {
  reservoir: 'M-2.2,0.5 L2.2,0.5 L1.6,2 L-1.6,2 Z M-2.2,0.5 Q0,1.5 2.2,0.5',
  town: 'M-1.8,-1 L0,-2.2 L1.8,-1 L1.8,1.8 L-1.8,1.8 Z M-0.5,-0.2 L0.5,-0.2 L0.5,0.8 L-0.5,0.8 Z',
  pump: 'M-1.5,1 L1.5,1 L1.5,-0.5 L0,-1.8 L-1.5,-0.5 Z M0,-1.8 L0,-3 M-0.8,-2.5 L0,-3.5 L0.8,-2.5',
  gate: 'M-2,-2.2 L-2,2.2 M2,-2.2 L2,2.2 M-2,0 L2,0 M-0.8,-2.2 L-0.8,2.2 M0.8,-2.2 L0.8,2.2',
  wetland: 'M0,1.5 Q1.8,-1.5 3.2,0 Q1.6,2 0,1.5 M0,1.5 Q-1.8,-1 -3,0.5 Q-1.4,1.8 0,1.5',
}

function MapNode({
  node,
  isMaxRisk,
  isSelected,
  t,
  onSelect,
}: {
  node: BasinNode
  isMaxRisk: boolean
  isSelected: boolean
  t: CopyText
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const alert = nodeAlertClass(node.risk)
  const iconPath = ICON_PATHS[node.type]

  return (
    <>
      <g className={`map-node ${alert} ${isMaxRisk ? 'node-pulse' : ''} ${isSelected ? 'selected' : ''}`}>
        {/* Ripple rings */}
        <circle
          cx={node.x}
          cy={node.y}
          r="1"
          fill="none"
          className={`node-ripple ${alert}`}
          opacity={isMaxRisk ? 0.6 : 0.3}
        >
          <animate
            attributeName="r"
            values="3;10;3"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values={isMaxRisk ? '0.6;0;0.6' : '0.3;0;0.3'}
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={node.x}
          cy={node.y}
          r="1"
          fill="none"
          className={`node-ripple ${alert}`}
          opacity={isMaxRisk ? 0.4 : 0.2}
        >
          <animate
            attributeName="r"
            values="3;10;3"
            dur="3s"
            begin="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values={isMaxRisk ? '0.4;0;0.4' : '0.2;0;0.2'}
            dur="3s"
            begin="1.5s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Glow halo */}
        <circle
          cx={node.x}
          cy={node.y}
          r={hovered ? 6.5 : 5.2}
          className={`node-halo ${alert}`}
          opacity={hovered ? 0.25 : 0.12}
        />

        {/* Main circle */}
        <circle
          cx={node.x}
          cy={node.y}
          r={hovered ? 4.2 : 3.5}
          className={`node-body ${alert}`}
        />

        {/* Icon */}
        <path
          d={iconPath}
          transform={`translate(${node.x}, ${node.y}) scale(0.65)`}
          className={`node-icon ${alert}`}
        />

        {/* Risk number */}
        <text x={node.x + 4.5} y={node.y + 1.2}>
          {node.risk}
        </text>

        {/* Tooltip */}
        {hovered && (
          <foreignObject
            x={node.x > 70 ? node.x - 32 : node.x + 5}
            y={node.y > 80 ? node.y - 10 : node.y - 12}
            width="34"
            height="10"
          >
            <div className="map-tooltip-svg">
              <strong>{translateNodeName(node.name, t)}</strong>
              <span>{t.risk} {node.risk} · {t.waterLevel} {node.waterLevel}m · {node.population}</span>
            </div>
          </foreignObject>
        )}
      </g>
      <circle
        cx={node.x}
        cy={node.y}
        r="8"
        className="node-hit-target"
        role="button"
        tabIndex={0}
        aria-label={`${translateNodeName(node.name, t)} ${t.risk} ${node.risk}`}
        aria-pressed={isSelected}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect()
          }
        }}
      />
    </>
  )
}

export function BasinMap({ state, t, layers, selectedNodeId, onSelectNode, riverMainPath, riverBranchPaths, riskFieldPath }: BasinMapProps) {
  const mainRiver = riverMainPath ?? DEFAULT_RIVER_MAIN
  const branches = riverBranchPaths ?? DEFAULT_RIVER_BRANCHES
  const riskF = riskFieldPath ?? DEFAULT_RISK_FIELD

  const maxRiskNode = useMemo(() => {
    return state.nodes.reduce((max, node) => (node.risk > max.risk ? node : max), state.nodes[0])
  }, [state.nodes])

  return (
    <div className="map-stage">
      <img src={assetUrl('nasa-flood-satellite.jpg')} alt="" />
      <svg viewBox="0 0 100 100" role="img" aria-label={t.riverNetworkLabel as string}>
        <defs>
          <filter id="particleGlow">
            <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="streamGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#22d3ee" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        {/* River base glow layer */}
        <path
          d={mainRiver}
          fill="none"
          stroke="rgba(34, 211, 238, 0.15)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#streamGlow)"
        />
        {branches.map((d, i) => (
          <path
            key={`glow-${i}`}
            d={d}
            fill="none"
            stroke="rgba(34, 211, 238, 0.1)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#streamGlow)"
          />
        ))}

        {/* Animated stream highlight */}
        <path
          className="river-stream-light"
          d={mainRiver}
          fill="none"
          stroke="url(#riverGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#streamGlow)"
        />
        {branches.map((d, i) => (
          <path
            key={`stream-${i}`}
            className="river-stream-light"
            d={d}
            fill="none"
            stroke="url(#riverGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            filter="url(#streamGlow)"
            style={{ animationDelay: `${-(i + 1)}s` }}
          />
        ))}

        {/* Main river solid line */}
        <path className="river-main" d={mainRiver} />
        {branches.map((d, i) => (
          <path key={`branch-${i}`} className="river-branch" d={d} />
        ))}

        {/* Flow particles */}
        <circle r="1" className="flow-particle" filter="url(#particleGlow)">
          <animateMotion dur="10s" repeatCount="indefinite" path={mainRiver} />
        </circle>
        <circle r="0.7" className="flow-particle" filter="url(#particleGlow)">
          <animateMotion dur="10s" begin="3.3s" repeatCount="indefinite" path={mainRiver} />
        </circle>
        <circle r="0.5" className="flow-particle" filter="url(#particleGlow)">
          <animateMotion dur="10s" begin="6.7s" repeatCount="indefinite" path={mainRiver} />
        </circle>
        {branches.map((d, i) => (
          <circle key={`fp-${i}`} r="0.5" className="flow-particle" filter="url(#particleGlow)">
            <animateMotion dur={`${7 + i}s`} begin={`${i * 2}s`} repeatCount="indefinite" path={d} />
          </circle>
        ))}

        {layers.rain && (
          <g className="rain-cells" aria-hidden="true">
            <ellipse cx="26" cy="31" rx="16" ry="9" />
            <ellipse cx="66" cy="58" rx="18" ry="10" />
            <ellipse cx="78" cy="38" rx="12" ry="7" />
          </g>
        )}

        {layers.population && (
          <g className="population-exposure" aria-hidden="true">
            <circle cx="39" cy="42" r="8" />
            <circle cx="72" cy="64" r="7" />
            <circle cx="82" cy="36" r="5" />
          </g>
        )}

        {/* Risk field */}
        <path
          className={`risk-field ${state.alertLevel}`}
          d={riskF}
        />

        {/* Nodes */}
        {state.nodes.map((node) => (
          <MapNode
            key={node.id}
            node={node}
            isMaxRisk={node.id === maxRiskNode?.id}
            isSelected={node.id === selectedNodeId}
            t={t}
            onSelect={() => onSelectNode(node)}
          />
        ))}
      </svg>
      <div className="map-legend">
        <span className="legend-red" /> {t.floodRisk}
        <span className="legend-blue" /> {t.river}
        <span className="legend-gold" /> {t.controlNode}
      </div>
    </div>
  )
}

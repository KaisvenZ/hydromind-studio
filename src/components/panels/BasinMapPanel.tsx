import { motion } from 'framer-motion'
import { Satellite } from 'lucide-react'
import type { BasinDefinition, BasinNode, BasinState, CopyText, MapLayers } from '../../types'
import { Card } from '../ui/Card'
import { BasinMap } from '../map/BasinMap'
import { translateNodeName } from '../../utils/i18n'

interface BasinMapPanelProps {
  state: BasinState
  t: CopyText
  layers: MapLayers
  selectedNode: BasinNode | null
  onLayerChange: (layer: keyof MapLayers, enabled: boolean) => void
  onSelectNode: (node: BasinNode) => void
  basinDef: BasinDefinition
}

export function BasinMapPanel({
  state,
  t,
  layers,
  selectedNode,
  onLayerChange,
  onSelectNode,
  basinDef,
}: BasinMapPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <Card level={1} className="basin-panel" aria-label={t.basinMapLabel as string}>
        <div className="panel-toolbar">
          <div>
            <p className="eyebrow">{t.liveScenario}</p>
            <h2>{t.basinRiskTwin}</h2>
          </div>
          <div className="tool-chip">
            <Satellite size={14} />
            {t.satelliteLayer}
          </div>
        </div>
        <div className="map-layer-controls" aria-label="Map layers">
          <button
            type="button"
            aria-label="Rain cells"
            aria-pressed={layers.rain}
            onClick={() => onLayerChange('rain', !layers.rain)}
          >
            {t.rainCells}
          </button>
          <button
            type="button"
            aria-label="Population exposure"
            aria-pressed={layers.population}
            onClick={() => onLayerChange('population', !layers.population)}
          >
            {t.populationExposure}
          </button>
        </div>
        <BasinMap
          state={state}
          t={t}
          layers={layers}
          selectedNodeId={selectedNode?.id ?? null}
          onSelectNode={onSelectNode}
          riverMainPath={basinDef.riverMainPath}
          riverBranchPaths={basinDef.riverBranchPaths}
          riskFieldPath={basinDef.riskFieldPath}
        />
        {selectedNode && (
          <aside aria-label={t.nodeInspector} className="node-inspector">
            <p className="eyebrow">{t.nodeInspector}</p>
            <h3>{translateNodeName(selectedNode.name, t)}</h3>
            <div className="node-inspector-grid">
              <span>{t.risk}</span>
              <strong>{selectedNode.risk}</strong>
              <span>{t.waterLevel}</span>
              <strong>{selectedNode.waterLevel}m</strong>
              <span>{t.exposure}</span>
              <strong>
                {selectedNode.population} {t.people}
              </strong>
            </div>
          </aside>
        )}
      </Card>
    </motion.div>
  )
}

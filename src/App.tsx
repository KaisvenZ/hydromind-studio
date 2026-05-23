import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useAppStore } from './stores/useAppStore'
import { computeBasinState, parseScenarioFile, exportBriefingMarkdown } from './domain/hydro'
import { computeScenarioDelta } from './domain/compare'
import { createAiBriefing } from './services/ai'
import { BASIN_DEFINITIONS } from './domain/basin-defs'
import { COPY } from './utils/i18n'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { BasinId, BasinNode, Scenario, ScenarioSnapshot } from './types'

import { CommandShell } from './components/layout/CommandShell'
import { BasinMapPanel } from './components/panels/BasinMapPanel'
import { ControlDeck } from './components/panels/ControlDeck'
import { TimelinePanel } from './components/panels/TimelinePanel'
import { NodeListPanel } from './components/panels/NodeListPanel'
import { AiBriefingPanel } from './components/panels/AiBriefingPanel'
import { DecisionRail } from './components/panels/DecisionRail'
import { AuditLogPanel } from './components/panels/AuditLogPanel'
import { Toast } from './components/ui/Toast'

function App() {
  const store = useAppStore()
  const {
    language,
    basinId,
    scenario,
    apiKey,
    briefing,
    briefingSource,
    isGenerating,
    importMessage,
    expandedNode,
    snapshots,
    compareSnapshot,
    isSimulating,
    simulationSpeed,
    actionStatuses,
    briefingTemplate,
    mapLayers,
    auditLog,
    toast,
    setLanguage,
    setBasin,
    setScenario,
    updateScenarioParam,
    setApiKey,
    setBriefing,
    setIsGenerating,
    setImportMessage,
    setExpandedNode,
    addSnapshot,
    deleteSnapshot,
    loadSnapshot,
    setCompareSnapshot,
    setIsSimulating,
    setSimulationSpeed,
    setActionStatus,
    setBriefingTemplate,
    setMapLayer,
    addAuditEntry,
    clearAuditLog,
    showToast,
    resetScenario,
  } = store

  const basinDef = BASIN_DEFINITIONS[basinId]
  const state = useMemo(() => computeBasinState(scenario, basinDef.nodes), [scenario, basinDef.nodes])
  const t = COPY[language]
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const selectedNode = useMemo(
    () => state.nodes.find((node) => node.id === selectedNodeId) ?? state.nodes[0] ?? null,
    [state.nodes, selectedNodeId],
  )
  const scenarioDelta = useMemo(
    () => (compareSnapshot ? computeScenarioDelta(state, compareSnapshot.state) : null),
    [state, compareSnapshot],
  )

  const switchLanguage = useCallback(() => {
    const next = language === 'en' ? 'zh-CN' : 'en'
    setLanguage(next)
    setBriefing('', 'local')
    addAuditEntry('language_switch', next === 'zh-CN' ? '切换到中文' : 'Switch to English')
  }, [language, setLanguage, setBriefing, addAuditEntry])

  const switchBasin = useCallback((id: BasinId) => {
    const def = BASIN_DEFINITIONS[id]
    setBasin(id)
    addAuditEntry('basin_switch', def.nameZh)
    showToast(
      language === 'zh-CN' ? `已切换至 ${def.nameZh}` : `Switched to ${def.nameEn}`,
      'info',
    )
  }, [language, setBasin, addAuditEntry, showToast])

  const generateBriefing = useCallback(async () => {
    setIsGenerating(true)
    const result = await createAiBriefing({
      mode: apiKey.trim() ? 'remote' : 'local',
      apiKey: apiKey.trim() || undefined,
      state,
      language,
      template: briefingTemplate,
    })
    setBriefing(result.markdown, result.source)
    setIsGenerating(false)
    addAuditEntry('ai_generate', result.source === 'remote' ? 'Remote model' : 'Local mode')
    showToast(
      language === 'zh-CN'
        ? `简报已生成 (${result.source === 'remote' ? '远程模型' : '本地模式'})`
        : `Briefing generated (${result.source === 'remote' ? 'Remote' : 'Local'})`,
      'success',
    )
  }, [apiKey, state, language, briefingTemplate, setIsGenerating, setBriefing, addAuditEntry, showToast])

  const handleImport = useCallback(async (file: File | undefined) => {
    if (!file) return
    try {
      const content = await file.text()
      const imported = parseScenarioFile(file.name, content)
      setScenario(imported)
      setImportMessage({ type: 'imported', filename: file.name })
      addAuditEntry('import_file', file.name)
      showToast(
        language === 'zh-CN' ? `已导入 ${file.name}` : `Imported ${file.name}`,
        'success',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed'
      setImportMessage({ type: 'error', message })
      showToast(message, 'error')
    }
  }, [language, setScenario, setImportMessage, addAuditEntry, showToast])

  const downloadReport = useCallback(() => {
    const blob = new Blob([exportBriefingMarkdown(state, language, briefingTemplate)], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = language === 'zh-CN' ? 'hydromind-调度研判简报.md' : 'hydromind-dispatch-briefing.md'
    link.click()
    URL.revokeObjectURL(url)
    addAuditEntry('export_briefing', briefingTemplate)
    showToast(
      language === 'zh-CN' ? '简报已导出' : 'Briefing exported',
      'success',
    )
  }, [state, language, briefingTemplate, addAuditEntry, showToast])

  const copyBriefing = useCallback(async () => {
    const text = briefing || exportBriefingMarkdown(state, language, briefingTemplate)
    try {
      await navigator.clipboard.writeText(text)
      showToast(language === 'zh-CN' ? '简报已复制' : 'Briefing copied', 'success')
    } catch {
      showToast(language === 'zh-CN' ? '复制失败' : 'Copy failed', 'error')
    }
  }, [briefing, state, language, briefingTemplate, showToast])

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ scenario, state, basinId, timestamp: Date.now() }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = language === 'zh-CN' ? 'hydromind-场景数据.json' : 'hydromind-scenario.json'
    link.click()
    URL.revokeObjectURL(url)
    addAuditEntry('export_json', basinId)
    showToast(
      language === 'zh-CN' ? 'JSON 已导出' : 'JSON exported',
      'success',
    )
  }, [scenario, state, basinId, language, addAuditEntry, showToast])

  const handleSaveSnapshot = useCallback(() => {
    const name = language === 'zh-CN'
      ? `快照 ${new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      : `Snapshot ${new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    addSnapshot(name)
    addAuditEntry('snapshot_saved', name)
    showToast(
      language === 'zh-CN' ? '快照已保存' : 'Snapshot saved',
      'success',
    )
  }, [language, addSnapshot, addAuditEntry, showToast])

  const handleLoadSnapshot = useCallback((snapshot: ScenarioSnapshot) => {
    loadSnapshot(snapshot)
    addAuditEntry('snapshot_loaded', snapshot.name)
  }, [loadSnapshot, addAuditEntry])

  const handleDeleteSnapshot = useCallback((id: string) => {
    const snap = snapshots.find((s) => s.id === id)
    deleteSnapshot(id)
    if (snap) addAuditEntry('snapshot_deleted', snap.name)
  }, [snapshots, deleteSnapshot, addAuditEntry])

  const handleCompareSnapshot = useCallback((snapshot: ScenarioSnapshot | null) => {
    setCompareSnapshot(snapshot)
    if (snapshot) {
      addAuditEntry('comparison_started', snapshot.name)
    } else {
      addAuditEntry('comparison_cleared', '')
    }
  }, [setCompareSnapshot, addAuditEntry])

  const handleToggleSimulation = useCallback(() => {
    if (isSimulating) {
      setIsSimulating(false)
      if (simRef.current) {
        clearInterval(simRef.current)
        simRef.current = null
      }
      addAuditEntry('simulation_stop', '')
      showToast(
        language === 'zh-CN' ? '模拟已停止' : 'Simulation stopped',
        'info',
      )
    } else {
      setIsSimulating(true)
      addAuditEntry('simulation_start', '')
      showToast(
        language === 'zh-CN' ? '模拟开始' : 'Simulation started',
        'info',
      )
    }
  }, [isSimulating, setIsSimulating, language, addAuditEntry, showToast])

  const handlePreset = useCallback((preset: Scenario) => {
    setScenario(preset)
    addAuditEntry('preset_applied', language === 'zh-CN' ? '应用预设情景' : 'Preset applied')
  }, [language, setScenario, addAuditEntry])

  const handleReset = useCallback(() => {
    resetScenario()
    addAuditEntry('scenario_reset', '')
    showToast(
      language === 'zh-CN' ? '情景已重置' : 'Scenario reset',
      'info',
    )
  }, [resetScenario, addAuditEntry, showToast, language])

  // Simulation loop
  useEffect(() => {
    if (!isSimulating) return
    simRef.current = setInterval(() => {
      setScenario((current) => {
        const newStorm = Math.min(100, current.stormIntensity + (Math.random() - 0.3) * 8)
        const newReservoir = Math.min(100, current.reservoirLevel + (Math.random() - 0.4) * 5)
        return {
          ...current,
          stormIntensity: Math.round(newStorm),
          reservoirLevel: Math.round(newReservoir),
        }
      })
    }, Math.max(300, Math.round(1500 / simulationSpeed)))
    return () => {
      if (simRef.current) clearInterval(simRef.current)
    }
  }, [isSimulating, simulationSpeed, setScenario])

  useKeyboardShortcuts({
    onGenerate: generateBriefing,
    onExport: downloadReport,
    onReset: handleReset,
    onLanguage: switchLanguage,
    onSaveSnapshot: handleSaveSnapshot,
  })

  return (
    <>
      <CommandShell
        language={language}
        basinId={basinId}
        state={state}
        t={t}
        isSimulating={isSimulating}
        onSwitchLanguage={switchLanguage}
        onSwitchBasin={switchBasin}
        mapPanel={
          <BasinMapPanel
            state={state}
            t={t}
            layers={mapLayers}
            selectedNode={selectedNode}
            onLayerChange={setMapLayer}
            onSelectNode={(node: BasinNode) => setSelectedNodeId(node.id)}
            basinDef={basinDef}
          />
        }
        decisionRail={
          <DecisionRail
            state={state}
            t={t}
            language={language}
            delta={scenarioDelta}
            actionStatuses={actionStatuses}
            onActionStatusChange={setActionStatus}
          />
        }
        analysisPanels={
          <>
            <ControlDeck
              scenario={scenario}
              t={t}
              snapshots={snapshots}
              compareSnapshot={compareSnapshot}
              importMessage={importMessage}
              isSimulating={isSimulating}
              simulationSpeed={simulationSpeed}
              onUpdateParam={updateScenarioParam}
              onPreset={handlePreset}
              onImport={handleImport}
              onExport={downloadReport}
              onExportJson={downloadJson}
              onSaveSnapshot={handleSaveSnapshot}
              onLoadSnapshot={handleLoadSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              onCompareSnapshot={handleCompareSnapshot}
              onReset={handleReset}
              onToggleSimulation={handleToggleSimulation}
              onSimulationSpeedChange={setSimulationSpeed}
            />
            <TimelinePanel timeline={state.timeline} t={t} />
            <NodeListPanel
              nodes={state.nodes}
              t={t}
              expandedNode={expandedNode}
              onToggleNode={(id) => setExpandedNode(expandedNode === id ? null : id)}
            />
            <AiBriefingPanel
              state={state}
              t={t}
              language={language}
              apiKey={apiKey}
              briefing={briefing}
              briefingSource={briefingSource}
              briefingTemplate={briefingTemplate}
              actionStatuses={actionStatuses}
              isGenerating={isGenerating}
              onApiKeyChange={setApiKey}
              onBriefingTemplateChange={setBriefingTemplate}
              onGenerate={generateBriefing}
              onCopyBriefing={copyBriefing}
              onExport={downloadReport}
            />
            <AuditLogPanel
              entries={auditLog}
              language={language}
              t={t}
              onClear={clearAuditLog}
            />
          </>
        }
      />
      {toast && <Toast />}
    </>
  )
}

export default App

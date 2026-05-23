export type AuditLogType =
  | 'language_switch'
  | 'basin_switch'
  | 'scenario_change'
  | 'preset_applied'
  | 'snapshot_saved'
  | 'snapshot_loaded'
  | 'snapshot_deleted'
  | 'comparison_started'
  | 'comparison_cleared'
  | 'import_file'
  | 'export_briefing'
  | 'export_json'
  | 'ai_generate'
  | 'simulation_start'
  | 'simulation_stop'
  | 'scenario_reset'
  | 'panel_opened'

export type AuditEntry = {
  id: string
  timestamp: number
  type: AuditLogType
  detail: string
  metadata?: Record<string, string>
}

const typeLabelsZh: Record<AuditLogType, string> = {
  language_switch: '语言切换',
  basin_switch: '流域切换',
  scenario_change: '参数调整',
  preset_applied: '预设情景',
  snapshot_saved: '保存快照',
  snapshot_loaded: '加载快照',
  snapshot_deleted: '删除快照',
  comparison_started: '开始对比',
  comparison_cleared: '清除对比',
  import_file: '导入文件',
  export_briefing: '导出简报',
  export_json: '导出 JSON',
  ai_generate: 'AI 研判',
  simulation_start: '模拟开始',
  simulation_stop: '模拟停止',
  scenario_reset: '重置情景',
  panel_opened: '打开面板',
}

const typeLabelsEn: Record<AuditLogType, string> = {
  language_switch: 'Language',
  basin_switch: 'Basin',
  scenario_change: 'Params',
  preset_applied: 'Preset',
  snapshot_saved: 'Snapshot saved',
  snapshot_loaded: 'Snapshot loaded',
  snapshot_deleted: 'Snapshot deleted',
  comparison_started: 'Compare start',
  comparison_cleared: 'Compare clear',
  import_file: 'Import',
  export_briefing: 'Export briefing',
  export_json: 'Export JSON',
  ai_generate: 'AI briefing',
  simulation_start: 'Sim start',
  simulation_stop: 'Sim stop',
  scenario_reset: 'Reset',
  panel_opened: 'Panel',
}

export function getAuditTypeLabel(type: AuditLogType, language: string): string {
  return language === 'zh-CN' ? typeLabelsZh[type] : typeLabelsEn[type]
}

export const AUDIT_MAX_ENTRIES = 100

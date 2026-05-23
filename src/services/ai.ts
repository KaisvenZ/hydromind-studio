import { exportBriefingMarkdown, translateAction, type BasinState, type BriefingTemplate, type Language } from '../domain/hydro'

export type AiBriefing = {
  source: 'local' | 'remote'
  markdown: string
}

export type AiBriefingRequest = {
  mode: 'local' | 'remote'
  state: BasinState
  apiKey?: string
  model?: string
  fetcher?: typeof fetch
  language?: Language
  template?: BriefingTemplate
}

export async function createAiBriefing(request: AiBriefingRequest): Promise<AiBriefing> {
  const language = request.language ?? 'en'
  const template = request.template ?? 'command-summary'

  if (request.mode !== 'remote' || !request.apiKey) {
    return {
      source: 'local',
      markdown: createLocalBriefing(request.state, language, template),
    }
  }

  const fetcher = request.fetcher ?? fetch
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model ?? 'gpt-5.1',
      instructions: createInstructions(template),
      input: exportBriefingMarkdown(request.state, language, template),
      max_output_tokens: 650,
    }),
  })

  if (!response.ok) {
    return {
      source: 'local',
      markdown: `${createLocalBriefing(request.state, language, template)}\n\n${createRemoteFallbackNote(language)}`,
    }
  }

  const data = (await response.json()) as {
    output_text?: string
    output?: Array<{
      content?: Array<{
        text?: string
      }>
    }>
  }
  const markdown = data.output_text?.trim()
    ? data.output_text
    : data.output
        ?.flatMap((item) => item.content ?? [])
        .map((item) => item.text)
        .find((text): text is string => Boolean(text?.trim()))

  if (!markdown) {
    return {
      source: 'local',
      markdown: createLocalBriefing(request.state, language, template),
    }
  }

  return {
    source: 'remote',
    markdown,
  }
}

function createInstructions(template: BriefingTemplate): string {
  const templateFocus: Record<BriefingTemplate, string> = {
    'command-summary': 'Produce a concise command summary with risk, evidence, and recommended dispatch actions.',
    'executive-memo': 'Produce a polished executive memo with situation, implications, decision needs, and caveats.',
    'field-checklist': 'Produce a field checklist with checkbox actions, timing, and verification notes.',
  }

  return `You are a flood-control decision-support analyst. ${templateFocus[template]} Include a disclaimer that this is not an official operational command.`
}

function createLocalBriefing(state: BasinState, language: Language, template: BriefingTemplate): string {
  if (template === 'field-checklist') {
    if (language === 'zh-CN') {
      return ['## 现场核查清单', '', ...createActionLines(state, language, '- [ ] '), '', '本清单用于情景推演，不替代正式防汛调度命令。'].join('\n')
    }

    return ['## Field checklist', '', ...createActionLines(state, language, '- [ ] '), '', 'This checklist supports scenario rehearsal and does not replace official flood-control orders.'].join('\n')
  }

  const topNodes = formatTopNodes(state)

  if (template === 'executive-memo') {
    if (language === 'zh-CN') {
      return [
        '## 管理备忘录',
        '',
        `态势: 当前流域风险评分为 ${state.riskScore}，预警等级为 ${translateAlertForMemo(state.alertLevel, language)}，预计压力峰值出现在 T+${state.expectedPeakHour}h。`,
        '',
        `影响: 最高风险集中在 ${topNodes}。`,
        '',
        '决策需求:',
        ...createActionLines(state, language, '- '),
        '',
        '本备忘录用于情景推演，不替代正式防汛调度命令。',
      ].join('\n')
    }

    return [
      '## Executive memo',
      '',
      `Situation: The basin risk score is ${state.riskScore} at ${state.alertLevel.toUpperCase()} alert, with peak pressure expected around T+${state.expectedPeakHour}h.`,
      '',
      `Implications: Highest risk is concentrated at ${topNodes}.`,
      '',
      'Decision needs:',
      ...createActionLines(state, language, '- '),
      '',
      'This memo supports scenario rehearsal and does not replace official flood-control orders.',
    ].join('\n')
  }

  if (language === 'zh-CN') {
    return [
      '## 本地 AI 风格研判',
      '',
      `当前流域风险评分为 ${state.riskScore}，预警等级为 ${state.alertLevel.toUpperCase()}。`,
      `预计压力峰值出现在 T+${state.expectedPeakHour}h，高风险节点集中在 ${topNodes}。`,
      '',
      '### 调度重点',
      ...createActionLines(state, language, '- '),
      '',
      '本地模式使用确定性规则生成，即使没有 API Key 也能稳定演示。',
    ].join('\n')
  }

  return [
    '## Local AI-style synthesis',
    '',
    `The basin risk score is ${state.riskScore}, placing the scenario at ${state.alertLevel.toUpperCase()} alert.`,
    `Peak pressure is expected around T+${state.expectedPeakHour}h, with highest node risk at ${topNodes}.`,
    '',
    '### Dispatch focus',
    ...createActionLines(state, language, '- '),
    '',
    'This local mode uses deterministic rules so the demo remains available without an API key.',
  ].join('\n')
}

function createActionLines(state: BasinState, language: Language, prefix: string): string[] {
  return state.actions.map((action) => {
    const translated = translateAction(action, language)
    return `${prefix}${translated.title}: ${translated.impact}`
  })
}

function formatTopNodes(state: BasinState): string {
  return [...state.nodes]
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 3)
    .map((node) => `${node.name} (${node.risk})`)
    .join(', ')
}

function createRemoteFallbackNote(language: Language): string {
  return language === 'zh-CN'
    ? '远程模型不可用；已显示本地综合研判。'
    : 'Remote model unavailable; local synthesis shown instead.'
}

function translateAlertForMemo(alertLevel: BasinState['alertLevel'], language: Language): string {
  if (language !== 'zh-CN') return alertLevel.toUpperCase()

  const labels: Record<BasinState['alertLevel'], string> = {
    green: '绿色',
    yellow: '黄色',
    orange: '橙色',
    red: '红色',
  }

  return labels[alertLevel]
}

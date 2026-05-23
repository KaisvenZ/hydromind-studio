import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SCENARIO, computeBasinState } from '../domain/hydro'
import { createAiBriefing } from './ai'

describe('AI briefing service', () => {
  it('returns a deterministic local briefing when no API key is configured', async () => {
    const state = computeBasinState({
      ...DEFAULT_SCENARIO,
      stormIntensity: 84,
      reservoirLevel: 81,
      soilSaturation: 78,
    })

    const briefing = await createAiBriefing({
      mode: 'local',
      state,
    })

    expect(briefing.source).toBe('local')
    expect(briefing.markdown).toContain('Local AI-style synthesis')
    expect(briefing.markdown).toContain(`risk score is ${state.riskScore}`)
  })

  it('generates a field checklist local briefing when requested', async () => {
    const state = computeBasinState(DEFAULT_SCENARIO)

    const briefing = await createAiBriefing({
      mode: 'local',
      state,
      template: 'field-checklist',
    })

    expect(briefing.source).toBe('local')
    expect(briefing.markdown).toContain('Field checklist')
    expect(briefing.markdown).toContain('[ ]')
    expect(briefing.markdown).toContain(state.actions[0].title)
    expect(briefing.markdown).toContain('does not replace official flood-control orders')
  })

  it('generates a local executive memo when requested', async () => {
    const state = computeBasinState(DEFAULT_SCENARIO)

    const briefing = await createAiBriefing({
      mode: 'local',
      state,
      template: 'executive-memo',
    })

    expect(briefing.source).toBe('local')
    expect(briefing.markdown).toContain('Executive memo')
    expect(briefing.markdown).toContain('Decision needs')
    expect(briefing.markdown).not.toContain('Local AI-style synthesis')
  })

  it('uses the OpenAI Responses API shape when an API key is supplied', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: 'Remote model generated dispatch plan.',
      }),
    })
    const state = computeBasinState(DEFAULT_SCENARIO)

    const briefing = await createAiBriefing({
      mode: 'remote',
      apiKey: 'sk-test',
      model: 'gpt-5.1',
      state,
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(briefing).toEqual({
      source: 'remote',
      markdown: 'Remote model generated dispatch plan.',
    })
  })

  it('sends template-specific instructions and input to the remote model', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: 'Remote memo.',
      }),
    })
    const state = computeBasinState(DEFAULT_SCENARIO)

    await createAiBriefing({
      mode: 'remote',
      apiKey: 'sk-test',
      state,
      fetcher,
      template: 'executive-memo',
    })

    const [, init] = fetcher.mock.calls[0]
    const body = JSON.parse(String(init?.body)) as {
      instructions: string
      input: string
    }

    expect(body.instructions).toContain('executive memo')
    expect(body.input).toContain('Executive memo')
    expect(body.input).toContain('Decision needs:')
    expect(body.input).not.toContain('HydroMind Dispatch Briefing')
  })

  it('falls back to local when a successful remote response is empty', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: '   ',
        output: [
          {
            content: [{ text: '' }],
          },
        ],
      }),
    })
    const state = computeBasinState(DEFAULT_SCENARIO)

    const briefing = await createAiBriefing({
      mode: 'remote',
      apiKey: 'sk-test',
      state,
      fetcher,
    })

    expect(briefing.source).toBe('local')
    expect(briefing.markdown).toContain('Local AI-style synthesis')
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { DEFAULT_SCENARIO } from './domain/hydro'
import { useAppStore } from './stores/useAppStore'

describe('HydroMind Studio shell', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({
      language: 'en',
      scenario: DEFAULT_SCENARIO,
      briefing: '',
      briefingSource: 'local',
      isGenerating: false,
      importMessage: { type: 'demo' },
      expandedNode: null,
      snapshots: [],
      compareSnapshot: null,
      isSimulating: false,
      simulationSpeed: 1,
      actionStatuses: {},
      briefingTemplate: 'command-summary',
      mapLayers: { rain: true, population: true },
      toast: null,
    })
  })

  it('renders the command-deck identity and core scenario controls', () => {
    render(<App />)

    expect(screen.getByText('HydroMind Studio')).toBeInTheDocument()
    expect(screen.getByText('Flow Basin Digital Twin')).toBeInTheDocument()
    expect(screen.getByLabelText('Command center')).toBeInTheDocument()
    expect(screen.getByLabelText('Storm intensity')).toBeInTheDocument()
    expect(screen.getByText('AI Dispatch Briefing')).toBeInTheDocument()
  })

  it('switches between English Japanese Korean and Simplified Chinese labels', () => {
    render(<App />)

    // en → ja
    fireEvent.click(screen.getByRole('button', { name: '简体中文' }))
    expect(screen.getByText('流域デジタルツイン')).toBeInTheDocument()

    // ja → ko
    fireEvent.click(screen.getByRole('button', { name: '中文' }))
    expect(screen.getByText('유역 디지털 트윈')).toBeInTheDocument()

    // ko → zh-CN
    fireEvent.click(screen.getByRole('button', { name: '中文' }))
    expect(screen.getByText('流域数字孪生')).toBeInTheDocument()
    expect(screen.getByLabelText('暴雨强度')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
  })

  it('lets operators toggle professional basin map layers', () => {
    render(<App />)

    const rainLayer = screen.getByRole('button', { name: 'Rain cells' })
    const populationLayer = screen.getByRole('button', { name: 'Population exposure' })

    expect(rainLayer).toHaveAttribute('aria-pressed', 'true')
    expect(populationLayer).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(rainLayer)

    expect(rainLayer).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens a map node inspector from a basin node click', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Delta Pump Station risk 80/i }))

    const inspector = screen.getByLabelText('Node Inspector')

    expect(within(inspector).getByText('Node Inspector')).toBeInTheDocument()
    expect(within(inspector).getByText('Delta Pump Station')).toBeInTheDocument()
    expect(within(inspector).getByText('Exposure')).toBeInTheDocument()
  })
})

import type { BasinId } from '../domain/basin-defs'
import { fetchTelemetry, type ServerSensorReading, type ServerWeatherForecast } from './api-client'

export type SensorReading = {
  nodeId: string
  waterLevel: number
  flowRate: number
  timestamp: number
  unit: string
}

export type WeatherForecast = {
  location: string
  precipitationMm: number
  windSpeed: number
  pressure: number
  validFrom: number
  validTo: number
}

export type BasinTelemetry = {
  basinId: BasinId
  fetchedAt: number
  source: 'demo' | 'live'
  sensors: SensorReading[]
  forecast: WeatherForecast[]
}

export interface DataServiceProvider {
  fetchBasinTelemetry(basinId: BasinId): Promise<BasinTelemetry>
  getStatus(): 'demo' | 'live'
}

function generateDemoTelemetry(basinId: BasinId): BasinTelemetry {
  const now = Date.now()
  const nodeIds: Record<BasinId, string[]> = {
    'lower-yangtze': ['upstream-reservoir', 'north-town', 'main-gate', 'delta-pump', 'wetland-buffer'],
    'pearl-delta': ['prd-reservoir', 'prd-city', 'prd-gate', 'prd-pump', 'prd-wetland'],
    'taihu-plain': ['taihu-lake', 'taihu-town', 'taihu-gate', 'taihu-pump', 'taihu-wetland'],
  }

  const ids = nodeIds[basinId]
  const sensors: SensorReading[] = ids.map((id) => ({
    nodeId: id,
    waterLevel: Number((2.0 + Math.random() * 3.5).toFixed(1)),
    flowRate: Number((80 + Math.random() * 320).toFixed(0)),
    timestamp: now - Math.floor(Math.random() * 600_000),
    unit: 'm',
  }))

  const forecast: WeatherForecast[] = Array.from({ length: 6 }, (_, i) => ({
    location: basinId,
    precipitationMm: Number((Math.random() * 28).toFixed(1)),
    windSpeed: Number((4 + Math.random() * 18).toFixed(1)),
    pressure: Number((998 + Math.random() * 22).toFixed(0)),
    validFrom: now + i * 3_600_000,
    validTo: now + (i + 1) * 3_600_000,
  }))

  return {
    basinId,
    fetchedAt: now,
    source: 'demo',
    sensors,
    forecast,
  }
}

function mapSensorReading(r: ServerSensorReading): SensorReading {
  return {
    nodeId: r.node_id,
    waterLevel: r.water_level,
    flowRate: r.flow_rate,
    timestamp: r.timestamp,
    unit: r.unit,
  }
}

function mapWeatherForecast(f: ServerWeatherForecast): WeatherForecast {
  return {
    location: f.location,
    precipitationMm: f.precipitation_mm,
    windSpeed: f.wind_speed,
    pressure: f.pressure,
    validFrom: f.valid_from,
    validTo: f.valid_to,
  }
}

export class LiveDataService implements DataServiceProvider {
  private fallback = new DemoDataService()

  async fetchBasinTelemetry(basinId: BasinId): Promise<BasinTelemetry> {
    try {
      const data = await fetchTelemetry(basinId)
      if (data.source === 'live') {
        return {
          basinId: data.basin_id as BasinId,
          fetchedAt: data.fetched_at,
          source: 'live',
          sensors: data.sensors.map(mapSensorReading),
          forecast: data.forecast.map(mapWeatherForecast),
        }
      }
    } catch {
      // fallback to demo
    }
    return this.fallback.fetchBasinTelemetry(basinId)
  }

  getStatus() {
    return 'live' as const
  }
}

export class DemoDataService implements DataServiceProvider {
  async fetchBasinTelemetry(basinId: BasinId): Promise<BasinTelemetry> {
    await new Promise((resolve) => setTimeout(resolve, 120))
    return generateDemoTelemetry(basinId)
  }

  getStatus() {
    return 'demo' as const
  }
}

let instance: DataServiceProvider = new DemoDataService()

export function getDataService(): DataServiceProvider {
  return instance
}

export function setDataService(service: DataServiceProvider): void {
  instance = service
}

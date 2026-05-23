import type { Scenario, BasinNode } from '../types'

export type BasinId = 'lower-yangtze' | 'pearl-delta' | 'taihu-plain'

export type BasinDefinition = {
  id: BasinId
  nameZh: string
  nameEn: string
  baseScenario: Scenario
  nodes: Array<Omit<BasinNode, 'risk' | 'waterLevel'>>
  riverMainPath: string
  riverBranchPaths: string[]
  riskFieldPath: string
  mapImage: string
}

export const BASIN_DEFINITIONS: Record<BasinId, BasinDefinition> = {
  'lower-yangtze': {
    id: 'lower-yangtze',
    nameZh: '长江下游示范流域',
    nameEn: 'Lower Yangtze Demo',
    baseScenario: {
      stormIntensity: 64,
      reservoirLevel: 74,
      soilSaturation: 66,
      gateOpening: 42,
      forecastHours: 24,
      pumpReadiness: 68,
    },
    nodes: [
      { id: 'upstream-reservoir', name: 'Upstream Reservoir', type: 'reservoir', x: 18, y: 27, population: '0' },
      { id: 'north-town', name: 'North Bank Town', type: 'town', x: 39, y: 42, population: '18k' },
      { id: 'main-gate', name: 'Main Sluice Gate', type: 'gate', x: 56, y: 51, population: '0' },
      { id: 'delta-pump', name: 'Delta Pump Station', type: 'pump', x: 72, y: 64, population: '8k' },
      { id: 'wetland-buffer', name: 'Wetland Buffer', type: 'wetland', x: 82, y: 36, population: '2k' },
    ],
    riverMainPath: 'M8 23 C22 36, 29 31, 41 45 S62 53, 72 66 S86 75, 96 63',
    riverBranchPaths: [
      'M34 13 C43 28, 45 39, 56 51',
      'M72 66 C77 50, 84 43, 94 35',
    ],
    riskFieldPath: 'M18 26 C35 22, 46 34, 52 48 C58 66, 80 59, 87 71 C75 91, 39 85, 28 66 C19 53, 7 42, 18 26 Z',
    mapImage: 'nasa-flood-satellite.jpg',
  },
  'pearl-delta': {
    id: 'pearl-delta',
    nameZh: '珠江三角洲流域',
    nameEn: 'Pearl River Delta',
    baseScenario: {
      stormIntensity: 72,
      reservoirLevel: 68,
      soilSaturation: 78,
      gateOpening: 35,
      forecastHours: 36,
      pumpReadiness: 55,
    },
    nodes: [
      { id: 'prd-reservoir', name: 'West River Reservoir', type: 'reservoir', x: 14, y: 20, population: '0' },
      { id: 'prd-city', name: 'Foshan Urban Node', type: 'town', x: 44, y: 48, population: '35k' },
      { id: 'prd-gate', name: 'Shunde Gate', type: 'gate', x: 62, y: 42, population: '0' },
      { id: 'prd-pump', name: 'Zhongshan Pump Array', type: 'pump', x: 78, y: 68, population: '14k' },
      { id: 'prd-wetland', name: 'Nansha Wetland', type: 'wetland', x: 88, y: 78, population: '4k' },
    ],
    riverMainPath: 'M8 18 C28 34, 38 28, 48 46 S66 48, 82 72 S92 82, 98 72',
    riverBranchPaths: [
      'M28 22 C38 36, 46 42, 56 46',
      'M62 42 C68 56, 74 62, 78 68',
    ],
    riskFieldPath: 'M12 16 C32 18, 46 36, 56 52 C66 72, 88 64, 94 76 C78 94, 34 88, 22 68 C14 52, 4 36, 12 16 Z',
    mapImage: 'nasa-flood-satellite.jpg',
  },
  'taihu-plain': {
    id: 'taihu-plain',
    nameZh: '太湖平原河网',
    nameEn: 'Taihu Plain Network',
    baseScenario: {
      stormIntensity: 56,
      reservoirLevel: 82,
      soilSaturation: 88,
      gateOpening: 48,
      forecastHours: 18,
      pumpReadiness: 72,
    },
    nodes: [
      { id: 'taihu-lake', name: 'Taihu Lake Node', type: 'reservoir', x: 36, y: 22, population: '0' },
      { id: 'taihu-town', name: 'Suzhou Riverside', type: 'town', x: 58, y: 44, population: '26k' },
      { id: 'taihu-gate', name: 'Wusong Gate', type: 'gate', x: 82, y: 52, population: '0' },
      { id: 'taihu-pump', name: 'Kunshan Pump Station', type: 'pump', x: 48, y: 70, population: '10k' },
      { id: 'taihu-wetland', name: 'Yangcheng Wetland', type: 'wetland', x: 22, y: 54, population: '3k' },
    ],
    riverMainPath: 'M34 18 C48 28, 62 36, 74 50 S86 59, 96 56',
    riverBranchPaths: [
      'M34 18 C26 34, 22 48, 26 56',
      'M48 70 C56 56, 62 48, 74 50',
    ],
    riskFieldPath: 'M32 16 C52 18, 66 32, 76 48 C86 62, 90 64, 94 58 C82 80, 52 82, 28 68 C16 56, 20 28, 32 16 Z',
    mapImage: 'nasa-flood-satellite.jpg',
  },
}

export const DEFAULT_BASIN_ID: BasinId = 'lower-yangtze'

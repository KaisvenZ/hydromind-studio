import { describe, expect, it } from 'vitest'
import viteConfig from '../vite.config'

describe('Electron packaging configuration', () => {
  it('uses a relative Vite base so file:// packaged builds can load JS and CSS', () => {
    expect(viteConfig.base).toBe('./')
  })
})

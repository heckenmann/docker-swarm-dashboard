/**
 * @jest-environment jsdom
 */

import {
  showApiVersionAtom,
  dashboardSettingsAtom,
  serviceListAtom,
  serviceStatsAtom,
  selectedServiceIdAtom,
  showNavLabelsAtom,
  statsEnabledAtom,
  intervalAtom,
  settingsVisibleAtom,
} from '../../../../src/common/store/atoms'

describe('atoms.js exports', () => {
  it('exports showApiVersionAtom', () => {
    expect(showApiVersionAtom).toBeDefined()
    expect(showApiVersionAtom.init).toBe(false)
  })

  it('exports dashboardSettingsAtom', () => {
    expect(dashboardSettingsAtom).toBeDefined()
    expect(dashboardSettingsAtom.init).toEqual({
      showNavLabels: true,
      showStats: false,
      showSystemMetrics: false,
    })
  })

  it('exports serviceListAtom', () => {
    expect(serviceListAtom).toBeDefined()
    expect(serviceListAtom.init).toBeNull()
  })

  it('exports serviceStatsAtom', () => {
    expect(serviceStatsAtom).toBeDefined()
    expect(serviceStatsAtom.init).toEqual({})
  })

  it('exports selectedServiceIdAtom', () => {
    expect(selectedServiceIdAtom).toBeDefined()
    expect(selectedServiceIdAtom.init).toBeNull()
  })

  it('exports showNavLabelsAtom', () => {
    expect(showNavLabelsAtom).toBeDefined()
    expect(showNavLabelsAtom.init).toBe(true)
  })

  it('exports statsEnabledAtom', () => {
    expect(statsEnabledAtom).toBeDefined()
    expect(statsEnabledAtom.init).toBe(true)
  })

  it('exports intervalAtom', () => {
    expect(intervalAtom).toBeDefined()
    expect(intervalAtom.init).toBe(5000)
  })

  it('exports settingsVisibleAtom', () => {
    expect(settingsVisibleAtom).toBeDefined()
    expect(settingsVisibleAtom.init).toBe(false)
  })
})

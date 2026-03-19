/**
 * @jest-environment jsdom
 */

import {
  baseUrlAtom,
  refreshIntervalAtom,
  viewAtom,
  messagesAtom,
  tableSizeAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  filterTypeAtom,
  logsLinesAtom,
  logsShowLogsAtom,
  logsNumberOfLinesAtom,
  isDarkModeAtom,
  networkRequestsAtom,
  showNamesButtonsAtom,
  showNavLabelsAtom,
  maxContentWidthAtom,
  defaultLayoutAtom,
  hiddenServiceStatesAtom,
  timeZoneAtom,
  localeAtom,
  showWelcomeMessageAtom,
} from '../../../src/common/store/atoms'

describe('atoms.js exports', () => {
  it('exports baseUrlAtom', () => {
    expect(baseUrlAtom).toBeDefined()
  })

  it('exports refreshIntervalAtom', () => {
    expect(refreshIntervalAtom).toBeDefined()
  })

  it('exports viewAtom', () => {
    expect(viewAtom).toBeDefined()
  })

  it('exports messagesAtom', () => {
    expect(messagesAtom).toBeDefined()
  })

  it('exports tableSizeAtom', () => {
    expect(tableSizeAtom).toBeDefined()
  })

  it('exports serviceNameFilterAtom', () => {
    expect(serviceNameFilterAtom).toBeDefined()
  })

  it('exports stackNameFilterAtom', () => {
    expect(stackNameFilterAtom).toBeDefined()
  })

  it('exports filterTypeAtom', () => {
    expect(filterTypeAtom).toBeDefined()
  })

  it('exports logsLinesAtom', () => {
    expect(logsLinesAtom).toBeDefined()
  })

  it('exports logsShowLogsAtom', () => {
    expect(logsShowLogsAtom).toBeDefined()
  })

  it('exports logsNumberOfLinesAtom', () => {
    expect(logsNumberOfLinesAtom).toBeDefined()
  })

  it('exports isDarkModeAtom', () => {
    expect(isDarkModeAtom).toBeDefined()
  })

  it('exports networkRequestsAtom', () => {
    expect(networkRequestsAtom).toBeDefined()
  })

  it('exports showNamesButtonsAtom', () => {
    expect(showNamesButtonsAtom).toBeDefined()
  })

  it('exports showNavLabelsAtom', () => {
    expect(showNavLabelsAtom).toBeDefined()
  })

  it('exports maxContentWidthAtom', () => {
    expect(maxContentWidthAtom).toBeDefined()
  })

  it('exports defaultLayoutAtom', () => {
    expect(defaultLayoutAtom).toBeDefined()
  })

  it('exports hiddenServiceStatesAtom', () => {
    expect(hiddenServiceStatesAtom).toBeDefined()
  })

  it('exports timeZoneAtom', () => {
    expect(timeZoneAtom).toBeDefined()
  })

  it('exports localeAtom', () => {
    expect(localeAtom).toBeDefined()
  })

  it('exports showWelcomeMessageAtom', () => {
    expect(showWelcomeMessageAtom).toBeDefined()
  })
})

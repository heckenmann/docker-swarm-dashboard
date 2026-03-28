/**
 * @jest-environment jsdom
 */
// Tests that each defaultAtom correctly extracts its property from dashboardSettingsAtom.

const mockDashboardSettings = {
  refreshInterval: 30000,
  tableSize: 'lg',
  serviceNameFilter: 'my-service',
  stackNameFilter: 'my-stack',
  filterType: 'stack',
  logsNumberOfLines: 100,
  logsMessageMaxLen: 500,
  logsFormTail: false,
  logsFormSince: 'all',
  logsFormSinceAmount: 2,
  logsFormSinceUnit: 'hours',
  logsFormFollow: true,
  logsFormTimestamps: false,
  logsFormStdout: true,
  logsFormStderr: true,
  logsFormDetails: false,
  logsSearchKeyword: 'error',
  isDarkMode: true,
  showNamesButtons: false,
  showNavLabels: true,
  maxContentWidth: 1200,
  defaultLayout: 'row',
  hiddenServiceStates: ['running'],
  timeZone: 'America/New_York',
  locale: 'de-DE',
}

jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

const propertyMapping = [
  { atomName: 'refreshIntervalDefaultAtom', property: 'refreshInterval' },
  { atomName: 'tableSizeDefaultAtom', property: 'tableSize' },
  { atomName: 'serviceNameFilterDefaultAtom', property: 'serviceNameFilter' },
  { atomName: 'stackNameFilterDefaultAtom', property: 'stackNameFilter' },
  { atomName: 'filterTypeDefaultAtom', property: 'filterType' },
  { atomName: 'logsNumberOfLinesDefaultAtom', property: 'logsNumberOfLines' },
  { atomName: 'logsMessageMaxLenDefaultAtom', property: 'logsMessageMaxLen' },
  { atomName: 'logsFormTailDefaultAtom', property: 'logsFormTail' },
  { atomName: 'logsFormSinceDefaultAtom', property: 'logsFormSince' },
  { atomName: 'logsFormSinceAmountDefaultAtom', property: 'logsFormSinceAmount' },
  { atomName: 'logsFormSinceUnitDefaultAtom', property: 'logsFormSinceUnit' },
  { atomName: 'logsFormFollowDefaultAtom', property: 'logsFormFollow' },
  { atomName: 'logsFormTimestampsDefaultAtom', property: 'logsFormTimestamps' },
  { atomName: 'logsFormStdoutDefaultAtom', property: 'logsFormStdout' },
  { atomName: 'logsFormStderrDefaultAtom', property: 'logsFormStderr' },
  { atomName: 'logsFormDetailsDefaultAtom', property: 'logsFormDetails' },
  { atomName: 'logsSearchKeywordDefaultAtom', property: 'logsSearchKeyword' },
  { atomName: 'isDarkModeDefaultAtom', property: 'isDarkMode' },
  { atomName: 'showNamesButtonsDefaultAtom', property: 'showNamesButtons' },
  { atomName: 'showNavLabelsDefaultAtom', property: 'showNavLabels' },
  { atomName: 'maxContentWidthDefaultAtom', property: 'maxContentWidth' },
  { atomName: 'defaultLayoutDefaultAtom', property: 'defaultLayout' },
  { atomName: 'hiddenServiceStatesDefaultAtom', property: 'hiddenServiceStates' },
  { atomName: 'timeZoneDefaultAtom', property: 'timeZone' },
  { atomName: 'localeDefaultAtom', property: 'locale' },
]

describe('defaultAtoms extract correct property values from dashboardSettingsAtom', () => {
  afterEach(() => jest.resetModules())

  test.each(propertyMapping)('$atomName returns correct value', async ({ atomName, property }) => {
    const atoms = require('../../../src/common/store/atoms')
    const defaultAtom = atoms[atomName]

    const mockSettingsPromise = Promise.resolve(mockDashboardSettings)
    const get = (requestedAtom) => {
      if (requestedAtom === atoms.dashboardSettingsAtom) {
        return mockSettingsPromise
      }
      return null
    }

    const result = await defaultAtom(get)
    expect(result).toBe(mockDashboardSettings[property])
  })

  test('dashboardSettingsAtom fetches from correct endpoint', async () => {
    jest.resetModules()
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockDashboardSettings),
    })
    global.fetch = mockFetch

    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')
    const mockBaseUrl = '/app/'
    const get = (requestedAtom) => {
      if (requestedAtom === atoms.baseUrlAtom) return mockBaseUrl
      return null
    }

    const result = await atoms.dashboardSettingsAtom(get)
    expect(mockFetch).toHaveBeenCalledWith('/app/ui/dashboard-settings')
    expect(result).toEqual(mockDashboardSettings)
  })
})

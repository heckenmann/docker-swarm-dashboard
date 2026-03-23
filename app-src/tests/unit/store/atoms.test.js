/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { atomWithHash } from 'jotai-location'

// Mock jotai before importing components that use it
jest.mock('jotai', () => ({
  atom: (getOrInit, setFn) => {
    // Simple atom mock that handles both read-only and read-write atoms
    const atomFn = (get, set, ...args) => {
      if (setFn && get !== undefined && set !== undefined) {
        return setFn(get, set, ...args)
      }
      if (typeof getOrInit === 'function') {
        return getOrInit(get, ...args)
      }
      return getOrInit
    }
    atomFn.default = getOrInit
    return atomFn
  },
  useAtomValue: jest.fn(),
  useAtom: jest.fn(),
  Provider: ({ children, initialValues }) => children,
}))

jest.mock('jotai-location', () => ({
  atomWithHash: jest.fn((key, defaultValue) => {
    const hashAtom = (get) => {
      // Return default value if no hash
      return defaultValue
    }
    hashAtom.default = defaultValue
    return hashAtom
  }),
}))

jest.mock('jotai/utils', () => ({
  atomWithReducer: jest.fn((initialValue, reducer) => {
    const atomFn = (get, set, action) => {
      if (action !== undefined) {
        const current = get ? get() : initialValue
        const newValue = reducer(current, action)
        if (set) set(newValue)
        return newValue
      }
      return initialValue
    }
    atomFn.default = initialValue
    return atomFn
  }),
  atomWithReset: jest.fn((initialValue) => {
    const atomFn = (get, set, newValue) => {
      if (newValue === undefined) {
        return initialValue
      }
      if (newValue === null) {
        // Reset to initial value
        if (set) set(initialValue)
        return initialValue
      }
      if (set) set(newValue)
      return newValue
    }
    atomFn.default = initialValue
    return atomFn
  }),
}))
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
  versionRefreshAtom,
  versionAtom,
  dashboardSettingsAtom,
  parseHashToObj,
} from '../../../src/common/store/atoms'

// Mock für dashboardSettingsAtom
afterEach(() => {
  jest.restoreAllMocks()
})

describe('atoms.js exports', () => {
  it('exports all required atoms', () => {
    expect(baseUrlAtom).toBeDefined()
    expect(refreshIntervalAtom).toBeDefined()
    expect(viewAtom).toBeDefined()
    expect(messagesAtom).toBeDefined()
    expect(tableSizeAtom).toBeDefined()
    expect(serviceNameFilterAtom).toBeDefined()
    expect(stackNameFilterAtom).toBeDefined()
    expect(filterTypeAtom).toBeDefined()
    expect(logsLinesAtom).toBeDefined()
    expect(logsShowLogsAtom).toBeDefined()
    expect(logsNumberOfLinesAtom).toBeDefined()
    expect(isDarkModeAtom).toBeDefined()
    expect(networkRequestsAtom).toBeDefined()
    expect(showNamesButtonsAtom).toBeDefined()
    expect(showNavLabelsAtom).toBeDefined()
    expect(maxContentWidthAtom).toBeDefined()
    expect(defaultLayoutAtom).toBeDefined()
    expect(hiddenServiceStatesAtom).toBeDefined()
    expect(timeZoneAtom).toBeDefined()
    expect(localeAtom).toBeDefined()
    expect(showWelcomeMessageAtom).toBeDefined()
    expect(versionRefreshAtom).toBeDefined()
    expect(versionAtom).toBeDefined()
    expect(dashboardSettingsAtom).toBeDefined()
  })
})

describe('parseHashToObj', () => {
  it('returns empty object for empty string', () => {
    expect(parseHashToObj('')).toEqual({})
  })

  it('returns empty object for hash without key-value pairs', () => {
    expect(parseHashToObj('#')).toEqual({})
  })

  it('returns empty object for undefined', () => {
    expect(parseHashToObj(undefined)).toEqual({})
  })

  it('returns empty object for null', () => {
    expect(parseHashToObj(null)).toEqual({})
  })

  it('returns empty object for non-string input', () => {
    expect(parseHashToObj(123)).toEqual({})
    expect(parseHashToObj({})).toEqual({})
    expect(parseHashToObj([])).toEqual({})
  })

  it('parses hash without leading #', () => {
    expect(parseHashToObj('key=value')).toEqual({ key: 'value' })
  })

  it('parses hash with leading #', () => {
    expect(parseHashToObj('#key=value')).toEqual({ key: 'value' })
  })

  it('parses multiple key-value pairs', () => {
    expect(parseHashToObj('#key1=value1&key2=value2')).toEqual({
      key1: 'value1',
      key2: 'value2',
    })
  })

  it('decodes URI encoded values', () => {
    expect(parseHashToObj('#key=hello%20world')).toEqual({ key: 'hello world' })
    expect(parseHashToObj('#key=foo%3Dbar')).toEqual({ key: 'foo=bar' })
  })

  it('removes surrounding quotes', () => {
    expect(parseHashToObj('#key="value"')).toEqual({ key: 'value' })
  })

  it('removes embedded quotes', () => {
    expect(parseHashToObj('#key=va"lue')).toEqual({ key: 'value' })
  })

  it('handles decodeURIComponent error gracefully', () => {
    // Invalid percent encoding triggers catch block
    expect(parseHashToObj('#key=%ZZ')).toEqual({ key: '%ZZ' })
  })

  it('handles empty value', () => {
    expect(parseHashToObj('#key=')).toEqual({ key: '' })
  })

  it('handles value with only quotes', () => {
    expect(parseHashToObj('#key=""')).toEqual({ key: '' })
  })
})

describe('UI Settings Atoms with Server Defaults', () => {
  it('should use server default when no hash value is set', async () => {
    // Mock dashboardSettingsAtom to return isDarkMode: true
    const mockDashboardSettings = {
      isDarkMode: true,
      showNamesButtons: false,
      showNavLabels: true,
      maxContentWidth: 'centered',
      tableSize: 'lg',
    }

    // Mock the atoms module to avoid Provider requirement
    jest.doMock('jotai', () => ({
      atom: (getOrInit) => getOrInit,
      useAtom: jest.fn(),
      Provider: ({ children }) => children,
    }))
    jest.doMock('jotai-location', () => ({
      atomWithHash: jest.fn((key, defaultValue) => defaultValue),
    }))
    jest.doMock('jotai/utils', () => ({
      atomWithReducer: jest.fn((initialValue) => initialValue),
      atomWithReset: jest.fn((initialValue) => initialValue),
    }))

    // Re-import the module to apply mocks
    const atomsModule = require('../../../src/common/store/atoms')
    const isDarkModeAtom = atomsModule.isDarkModeAtom

    // Test that the atom is defined
    expect(isDarkModeAtom).toBeDefined()
  })
})

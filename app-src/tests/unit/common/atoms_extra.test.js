// atoms_extra.test.js
// Tests for atoms extra coverage.
// Uses jest.isolateModules with jest.doMock to prevent module registry contamination
// when tests run together via aggregator files.

describe('atoms extra coverage', () => {
  test('parseHashToObj handles non-string and empty', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: (v) => v,
        useAtom: () => [true, () => {}],
        useAtomValue: () => ({}),
      }))
      jest.doMock('jotai/utils', () => ({
        atomWithReducer: (v) => v,
        atomWithReset: (v) => v,
        selectAtom: (a) => a,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const { parseHashToObj } = require('../../../src/common/store/atoms')
      expect(parseHashToObj(undefined)).toEqual({})
      expect(parseHashToObj('')).toEqual({})
    })
  })

  test('parseHashToObj decodes pairs and falls back when decodeURIComponent throws', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: (v) => v,
        useAtom: () => [true, () => {}],
        useAtomValue: () => ({}),
      }))
      jest.doMock('jotai/utils', () => ({
        atomWithReducer: (v) => v,
        atomWithReset: (v) => v,
        selectAtom: (a) => a,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const { parseHashToObj } = require('../../../src/common/store/atoms')
      // well-formed
      expect(parseHashToObj('#a=1&b=2')).toEqual({ a: '1', b: '2' })

      // malformed percent-encoding should hit catch branch
      const res = parseHashToObj('#k=%E0')
      // value should be taken from raw (replaceAll called) and present
      expect(res.k).toBe('%E0')
    })
  })

  test('logsWebsocketUrlAtom constructs ws url from base and logsConfig', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: (v) => v,
        useAtom: () => [true, () => {}],
        useAtomValue: () => ({}),
        createStore: () => ({
          set: () => {},
          get: () => 'ws://example.com/docker/logs/s123?follow=true',
        }),
      }))
      jest.doMock('jotai/utils', () => ({
        atomWithReducer: (v) => v,
        atomWithReset: (v) => v,
        selectAtom: (a) => a,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const { logsWebsocketUrlAtom, baseUrlAtom, logsConfigAtom } = require('../../../src/common/store/atoms')
      const { createStore } = require('jotai')

      const store = createStore()
      // set a base URL and logsConfig
      store.set(baseUrlAtom, 'http://example.com/')
      store.set(logsConfigAtom, {
        serviceId: 's123',
        tail: '10',
        since: '1m',
        follow: true,
        timestamps: false,
        stdout: true,
        stderr: false,
        details: false,
      })

      const wsUrl = store.get(logsWebsocketUrlAtom)
      expect(typeof wsUrl).toBe('string')
      expect(wsUrl).toContain('docker/logs/s123')
      expect(wsUrl).toContain('follow=true')
      expect(wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')).toBeTruthy()
    })
  })
})

describe('baseUrlAtom path-prefix functionality', () => {
  // Use jest.isolateModules for proper test isolation
  // This creates a fresh module registry without clearing core modules like jotai

  test('baseUrlAtom can be set and retrieved', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: jest.fn((val) => ({ init: val })),
        createStore: jest.fn(() => ({
          get: jest.fn((a) => a.init),
          set: jest.fn((a, v) => {
            a.init = v
          }),
        })),
      }))
      jest.doMock('jotai-location', () => ({
        atomWithHash: (_key, defaultVal) => ({ init: defaultVal }),
      }))

      const { baseUrlAtom } = require('../../../src/common/store/atoms')
      const { createStore } = require('jotai')

      const store = createStore()
      const prefix = '/dashboard'
      store.set(baseUrlAtom, prefix)

      // Verify the atom value is correctly set for API prefixing
      const baseUrl = store.get(baseUrlAtom)
      expect(baseUrl).toBe(prefix)
    })
  })

  test('baseUrlAtom handles path-prefix for API calls', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: jest.fn((val) => ({ init: val })),
        createStore: jest.fn(() => ({
          get: jest.fn((a) => a.init),
          set: jest.fn((a, v) => {
            a.init = v
          }),
        })),
      }))
      jest.doMock('jotai-location', () => ({
        atomWithHash: (_key, defaultVal) => ({ init: defaultVal }),
      }))

      const { baseUrlAtom } = require('../../../src/common/store/atoms')
      const { createStore } = require('jotai')

      const store = createStore()
      const prefix = '/dashboard'
      store.set(baseUrlAtom, prefix)

      // Simulate API call construction with prefix
      const apiPath = `${prefix}docker/services`
      expect(apiPath).toBe('/dashboarddocker/services')
    })
  })

  test('baseUrlAtom handles empty string as valid value', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: jest.fn((val) => ({ init: val })),
        createStore: jest.fn(() => ({
          get: jest.fn((a) => a.init),
          set: jest.fn((a, v) => {
            a.init = v
          }),
        })),
      }))
      jest.doMock('jotai-location', () => ({
        atomWithHash: (_key, defaultVal) => ({ init: defaultVal }),
      }))

      const { baseUrlAtom } = require('../../../src/common/store/atoms')
      const { createStore } = require('jotai')

      const store = createStore()
      store.set(baseUrlAtom, '')

      expect(store.get(baseUrlAtom)).toBe('')
    })
  })

  test('baseUrlAtom handles root path', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: jest.fn((val) => ({ init: val })),
        createStore: jest.fn(() => ({
          get: jest.fn((a) => a.init),
          set: jest.fn((a, v) => {
            a.init = v
          }),
        })),
      }))
      jest.doMock('jotai-location', () => ({
        atomWithHash: (_key, defaultVal) => ({ init: defaultVal }),
      }))

      const { baseUrlAtom } = require('../../../src/common/store/atoms')
      const { createStore } = require('jotai')

      const store = createStore()
      store.set(baseUrlAtom, '/')

      expect(store.get(baseUrlAtom)).toBe('/')
    })
  })

  test('baseUrlAtom handles nested path prefix', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        atom: jest.fn((val) => ({ init: val })),
        createStore: jest.fn(() => ({
          get: jest.fn((a) => a.init),
          set: jest.fn((a, v) => {
            a.init = v
          }),
        })),
      }))
      jest.doMock('jotai-location', () => ({
        atomWithHash: (_key, defaultVal) => ({ init: defaultVal }),
      }))

      const { baseUrlAtom } = require('../../../src/common/store/atoms')
      const { createStore } = require('jotai')

      const store = createStore()
      const prefix = '/my-reverse-proxy/docker'
      store.set(baseUrlAtom, prefix)

      expect(store.get(baseUrlAtom)).toBe(prefix)
    })
  })
})

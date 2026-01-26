import { parseHashToObj } from '../../../src/common/store/atoms'
import { createStore } from 'jotai'
import * as atoms from '../../../src/common/store/atoms'

describe('atoms extra coverage', () => {
  test('parseHashToObj handles non-string and empty', () => {
    expect(parseHashToObj(undefined)).toEqual({})
    expect(parseHashToObj('')).toEqual({})
  })

  test('parseHashToObj decodes pairs and falls back when decodeURIComponent throws', () => {
    // well-formed
    expect(parseHashToObj('#a=1&b=2')).toEqual({ a: '1', b: '2' })

    // malformed percent-encoding should hit catch branch
    const res = parseHashToObj('#k=%E0')
    // value should be taken from raw (replaceAll called) and present
    expect(res.k).toBe('%E0')
  })

  test('logsWebsocketUrlAtom constructs ws url from base and logsConfig', () => {
    const store = createStore()
    // set a base URL and logsConfig
    store.set(atoms.baseUrlAtom, 'http://example.com/')
    store.set(atoms.logsConfigAtom, {
      serviceId: 's123',
      tail: '10',
      since: '1m',
      follow: true,
      timestamps: false,
      stdout: true,
      stderr: false,
      details: false,
    })

    const wsUrl = store.get(atoms.logsWebsocketUrlAtom)
    expect(typeof wsUrl).toBe('string')
    expect(wsUrl).toContain('docker/logs/s123')
    expect(wsUrl).toContain('follow=true')
    expect(wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')).toBeTruthy()
  })
})

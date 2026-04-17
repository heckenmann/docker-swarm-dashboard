// atoms_parseHash.coverage.test.js
// Tests parseHashToObj function.
// Uses jest.isolateModules with jest.doMock to prevent module registry contamination
// when tests run together via aggregator files.

describe('parseHashToObj', () => {
  test('parses empty hash', () => {
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
        atomFamily: (v) => v,
        loadable: (v) => v,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const { parseHashToObj } = require('../../../src/common/store/atoms')
      expect(parseHashToObj('')).toEqual({})
    })
  })

  test('parses key value pairs and decodes', () => {
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
        atomFamily: (v) => v,
        loadable: (v) => v,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const { parseHashToObj } = require('../../../src/common/store/atoms')
      const res = parseHashToObj('#base=/app&view=foo')
      expect(res.base).toBe('/app')
      expect(res.view).toBe('foo')
    })
  })

  test('handles decodeURIComponent failure gracefully', () => {
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
        atomFamily: (v) => v,
        loadable: (v) => v,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const { parseHashToObj } = require('../../../src/common/store/atoms')
      // % is a malformed sequence for decodeURIComponent and causes a throw
      const res = parseHashToObj('#bad=%')
      expect(res.bad).toBe('%')
    })
  })
})

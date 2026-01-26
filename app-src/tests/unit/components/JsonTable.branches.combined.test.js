import React from 'react'
import { render, screen } from '@testing-library/react'

describe('JsonTable branch coverage via mocked flatten (combined)', () => {
  afterEach(() => jest.resetModules())

  test('handles null, object (stringify), and object (stringify throws) branches', () => {
    jest.isolateModules(() => {
      jest.doMock('../../../src/common/utils', () => ({
        flatten: () => ({
          'k.null': null,
          'k.obj': { a: 1 },
          'k.bad': { b: 2 },
        }),
      }))

      jest.doMock('react-bootstrap', () => ({
        Table: (props) => React.createElement('table', null, props.children),
      }))

      jest.doMock('jotai', () => ({ atom: (v) => v, useAtomValue: () => 'sm' }))
      jest.doMock('jotai/utils', () => ({
        atomWithReducer: (v) => v,
        atomWithReset: (v) => v,
        selectAtom: (a) => a,
        atomWithHash: (k, def) => def,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const origStringify = JSON.stringify
      let callCount = 0
      JSON.stringify = () => {
        callCount += 1
        if (callCount === 2) throw new Error('boom')
        return '{"ok":1}'
      }

      const { JsonTable } = require('../../../src/components/JsonTable')
      render(React.createElement(JsonTable, { json: {} }))

      expect(screen.getByText('k.null')).toBeInTheDocument()
      expect(screen.getByText('k.obj')).toBeInTheDocument()
      expect(screen.getByText('k.bad')).toBeInTheDocument()

      const emptyCells = screen.getAllByText('', { exact: true })
      expect(emptyCells.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('{"ok":1}')).toBeInTheDocument()
      expect(screen.getByText('[object Object]')).toBeInTheDocument()

      JSON.stringify = origStringify
    })
  })
})

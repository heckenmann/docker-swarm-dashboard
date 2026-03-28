import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Jotai atoms
jest.mock('jotai', () => ({
  useAtomValue: jest.fn((atom) => {
    if (atom === 'tableSizeAtom') return 'sm'
    return null
  }),
  atom: (initialValue) => initialValue,
  Provider: ({ children }) => children
}))

// Mock tableSizeAtom
jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'tableSizeAtom'
}))

describe('JsonTable combined', () => {
  test('renders with empty data', () => {
    const JsonTable = require('../../../src/components/shared/JsonTable').default
    const { container } = render(React.createElement(JsonTable, { json: {} }))
    expect(container).toBeTruthy()
  })

  test('renders table from json', () => {
    const JsonTable = require('../../../src/components/shared/JsonTable').default
    const data = { x: { y: 'z' }, n: 1 }
    render(React.createElement(JsonTable, { json: data }))
    expect(screen.getByText('Key')).toBeInTheDocument()
    // since flattening creates key 'x.y' and 'n'
    expect(screen.getByText('x.y')).toBeInTheDocument()
    expect(screen.getByText('z')).toBeInTheDocument()
  })

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

      const origStringify = JSON.stringify
      let callCount = 0
      JSON.stringify = (obj) => {
        callCount++
        if (callCount === 2) throw new Error('mock stringify error')
        return origStringify(obj)
      }

      const JsonTable = require('../../../src/components/shared/JsonTable').default
      const data = { k: { null: null, obj: { a: 1 }, bad: { b: 2 } } }
      render(React.createElement(JsonTable, { json: data }))
      
      // Check that the null value cell is empty
      const nullCell = screen.getAllByRole('cell')[1]
      expect(nullCell).toBeEmptyDOMElement()
      
      expect(screen.getByText('{"a":1}')).toBeInTheDocument()
      // Check that the error case shows [object Object]
      expect(screen.getByText('[object Object]')).toBeInTheDocument()
      JSON.stringify = origStringify
    })
  })
})
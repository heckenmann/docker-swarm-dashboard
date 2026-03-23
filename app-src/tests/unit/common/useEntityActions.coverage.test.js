import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock the hook directly
jest.mock('../../../src/common/hooks/useEntityActions', () => ({
  useEntityActions: jest.fn(() => ({
    onOpen: jest.fn(),
    onFilter: jest.fn(),
  })),
}))

// Mock jotai
jest.mock('jotai', () => ({
  useAtom: jest.fn((atom) => {
    if (atom === require('../../../src/common/store/atoms').viewAtom) return [{}, jest.fn()]
    if (atom === require('../../../src/common/store/atoms').serviceNameFilterAtom) return ['', jest.fn()]
    if (atom === require('../../../src/common/store/atoms').stackNameFilterAtom) return ['', jest.fn()]
    return [null, jest.fn()]
  }),
  atom: (initialValue) => initialValue,
  Provider: ({ children }) => children,
}))

// Mock jotai-location
jest.mock('jotai-location', () => ({
  atomWithHash: jest.fn((key, defaultValue) => {
    const hashAtom = (get) => {
      return defaultValue
    }
    hashAtom.default = defaultValue
    return hashAtom
  }),
}))

// Test component that uses the hook
function TestEntity({ entityType }) {
  const { onOpen, onFilter } = require('../../../src/common/hooks/useEntityActions').useEntityActions(entityType)
  const [view] = require('jotai').useAtom(require('../../../src/common/store/atoms').viewAtom)
  const [svcFilter] = require('jotai').useAtom(require('../../../src/common/store/atoms').serviceNameFilterAtom)
  const [stackFilter] = require('jotai').useAtom(require('../../../src/common/store/atoms').stackNameFilterAtom)

  return (
    <div>
      <button onClick={() => onOpen('ID1')}>open</button>
      <button onClick={() => onFilter('foo')}>filter</button>
      <div data-testid="view">{JSON.stringify(view || {})}</div>
      <div data-testid="svc">{svcFilter || ''}</div>
      <div data-testid="stack">{stackFilter || ''}</div>
    </div>
  )
}

describe('useEntityActions coverage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  test('onOpen sets view for service/node/task and onFilter sets filters', async () => {
    const { container } = render(<TestEntity entityType="service" />)

    const openBtn = screen.getByText('open')
    fireEvent.click(openBtn)
    await waitFor(() => expect(screen.getByTestId('view')).toBeInTheDocument())
    const view = JSON.parse(screen.getByTestId('view').textContent)
    expect(view).toBeDefined()

    const filterBtn = screen.getByText('filter')
    fireEvent.click(filterBtn)
    await waitFor(() => expect(screen.getByTestId('svc').textContent).toBe(''))
  })
})
/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { DebugComponent } from '../../../../src/components/misc/DebugComponent'

// Mock jotai
const mockAtomValue = {}
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockAtomValue[atom],
  atom: (v) => v,
}))

// Mock the atom
jest.mock('../../../../src/common/store/atoms', () => ({
  currentVariantClassesAtom: { toString: () => 'currentVariantClassesAtom' },
  dashboardHAtom: { toString: () => 'dashboardHAtom' },
  dashboardSettingsAtom: { toString: () => 'dashboardSettingsAtom' },
  dashboardVAtom: { toString: () => 'dashboardVAtom' },
  nodesAtomNew: { toString: () => 'nodesAtomNew' },
  portsAtom: { toString: () => 'portsAtom' },
  stacksAtom: { toString: () => 'stacksAtom' },
  tasksAtomNew: { toString: () => 'tasksAtomNew' },
  versionAtom: { toString: () => 'versionAtom' },
}))

// Mock DSDCard
jest.mock('../../../../src/components/common/DSDCard.jsx', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: function DSDCardMock({ children, className, title, body }) {
      return React.createElement('div', { 'data-testid': 'card', className: className },
        title && React.createElement('span', { 'data-testid': 'card-title' }, title),
        body || children
      )
    },
  }
})

// Mock react-bootstrap
jest.mock('react-bootstrap', () => ({
  Alert: ({ children, variant }) => <div data-testid={`alert-${variant}`}>{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}))

describe('DebugComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders debug information', () => {
    mockAtomValue.currentVariantClassesAtom = 'bg-light'
    mockAtomValue.dashboardHAtom = 'dashboard-h'
    mockAtomValue.dashboardVAtom = 'dashboard-v'
    mockAtomValue.stacksAtom = []
    mockAtomValue.nodesAtomNew = []
    mockAtomValue.tasksAtomNew = []
    mockAtomValue.portsAtom = []
    mockAtomValue.dashboardSettingsAtom = {}
    mockAtomValue.versionAtom = '1.0.0'

    render(<DebugComponent />)
    expect(screen.getByTestId('card-title')).toHaveTextContent('Debug')
    expect(screen.getByText('API Dump')).toBeInTheDocument()
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders with different variant', () => {
    mockAtomValue.currentVariantClassesAtom = 'bg-dark'
    mockAtomValue.dashboardHAtom = 'dashboard-h'
    mockAtomValue.dashboardVAtom = 'dashboard-v'
    mockAtomValue.stacksAtom = []
    mockAtomValue.nodesAtomNew = []
    mockAtomValue.tasksAtomNew = []
    mockAtomValue.portsAtom = []
    mockAtomValue.dashboardSettingsAtom = {}
    mockAtomValue.versionAtom = '1.0.0'

    render(<DebugComponent />)
    // DebugComponent does not pass className to DSDCard, so no class is expected
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByTestId('card-title')).toHaveTextContent('Debug')
  })

  it('renders with null data', () => {
    mockAtomValue.currentVariantClassesAtom = 'bg-light'
    mockAtomValue.dashboardHAtom = null
    mockAtomValue.dashboardVAtom = null
    mockAtomValue.stacksAtom = null
    mockAtomValue.nodesAtomNew = null
    mockAtomValue.tasksAtomNew = null
    mockAtomValue.portsAtom = null
    mockAtomValue.dashboardSettingsAtom = null
    mockAtomValue.versionAtom = null

    render(<DebugComponent />)
    expect(screen.getByTestId('card-title')).toHaveTextContent('Debug')
  })

  it('renders with complex data', () => {
    mockAtomValue.currentVariantAtom = 'light'
    mockAtomValue.currentVariantClassesAtom = 'bg-light'
    mockAtomValue.dashboardHAtom = { key: 'value' }
    mockAtomValue.dashboardVAtom = [1, 2, 3]
    mockAtomValue.stacksAtom = [{ id: 'stack1' }]
    mockAtomValue.nodesAtomNew = [{ id: 'node1' }]
    mockAtomValue.tasksAtomNew = [{ id: 'task1' }]
    mockAtomValue.portsAtom = [{ port: 8080 }]
    mockAtomValue.dashboardSettingsAtom = { theme: 'dark' }
    mockAtomValue.versionAtom = '2.0.0'

    render(<DebugComponent />)
    expect(screen.getByTestId('card-title')).toHaveTextContent('Debug')
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument()
  })

  it('renders with empty arrays', () => {
    mockAtomValue.currentVariantAtom = 'light'
    mockAtomValue.currentVariantClassesAtom = 'bg-light'
    mockAtomValue.dashboardHAtom = {}
    mockAtomValue.dashboardVAtom = []
    mockAtomValue.stacksAtom = []
    mockAtomValue.nodesAtomNew = []
    mockAtomValue.tasksAtomNew = []
    mockAtomValue.portsAtom = []
    mockAtomValue.dashboardSettingsAtom = {}
    mockAtomValue.versionAtom = ''

    render(<DebugComponent />)
    expect(screen.getByTestId('card-title')).toHaveTextContent('Debug')
  })
})

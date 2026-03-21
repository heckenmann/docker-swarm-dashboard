/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { DebugComponent } from '../../../../src/components/misc/DebugComponent'
import { Card } from 'react-bootstrap'

// Mock jotai
const mockAtomValue = {}
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockAtomValue[atom],
  atom: (v) => v,
}))

// Mock the atom
jest.mock('../../../../src/common/store/atoms', () => ({
  currentVariantAtom: { toString: () => 'currentVariantAtom' },
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

// Mock JsonTable - not used in DebugComponent
// jest.mock('../../../../src/components/shared/JsonTable', () => ({
//   JsonTable: ({ data }) => <div data-testid="json-table">{JSON.stringify(data)}</div>,
// }))

// Mock react-bootstrap
jest.mock('react-bootstrap', () => ({
  Card: Object.assign(
    ({ children, bg, className }) => <div data-testid="card" data-bg={bg} className={className}>{children}</div>,
    {
      Body: ({ children }) => <div data-testid="card-body">{children}</div>,
    }
  ),
  Alert: ({ children, variant }) => <div data-testid={`alert-${variant}`}>{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}))

describe('DebugComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders debug information', () => {
    mockAtomValue.currentVariantAtom = 'light'
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
    expect(screen.getByText('Debug')).toBeInTheDocument()
    expect(screen.getByText('API Dump')).toBeInTheDocument()
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders with different variant', () => {
    mockAtomValue.currentVariantAtom = 'dark'
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
    expect(screen.getByTestId('card')).toHaveAttribute('data-bg', 'dark')
  })

  it('renders with null data', () => {
    mockAtomValue.currentVariantAtom = 'light'
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
    expect(screen.getByText('Debug')).toBeInTheDocument()
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
    expect(screen.getByText('Debug')).toBeInTheDocument()
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
    expect(screen.getByText('Debug')).toBeInTheDocument()
  })
})

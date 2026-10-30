import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ClusterHealthSummary from '../../../src/components/nodes/ClusterHealthSummary'

let mockResult
jest.mock('jotai', () => ({
  useAtomValue: () => mockResult,
}))
jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  clusterHealthAtom: {},
}))
jest.mock('../../../src/common/store/loadable', () => ({
  loadable: (value) => value,
}))
const mockOpen = jest.fn()
jest.mock('../../../src/common/hooks/useEntityActions', () => ({
  useEntityActions: () => ({ onOpen: mockOpen }),
}))

const observation = (overrides = {}) => ({
  available: true,
  observedAt: new Date().toISOString(),
  state: 'observed',
  managers: 3,
  reachable: 3,
  unreachable: 0,
  unknown: 0,
  majority: 2,
  remainingFailures: 1,
  leaderIds: ['m1'],
  nodes: [{ id: 'm1', hostname: 'manager-one' }],
  warnings: [],
  ...overrides,
})

beforeEach(() => {
  mockResult = { state: 'hasData', data: observation() }
})

test('shows manager topology, reserve, and named leader', () => {
  render(<ClusterHealthSummary />)
  expect(screen.getByLabelText('Configured managers')).toHaveTextContent('3')
  expect(screen.getByLabelText('Manager quorum')).toHaveTextContent('3 / 2')
  expect(screen.getByLabelText('Manager failure reserve')).toHaveTextContent(
    '1',
  )
  fireEvent.click(screen.getByRole('button', { name: 'manager-one' }))
  expect(mockOpen).toHaveBeenCalledWith('m1')
})

test('shows reduced safety margin and links from warnings to affected nodes', () => {
  mockResult.data = observation({
    state: 'warning',
    reachable: 2,
    unreachable: 1,
    remainingFailures: 0,
    warnings: [
      {
        code: 'unreachable_managers',
        message: 'A manager is unreachable.',
        nodeIds: ['m2'],
      },
    ],
  })
  render(<ClusterHealthSummary />)
  expect(screen.getByText('Warnings observed')).toBeVisible()
  expect(screen.getByLabelText('Manager failure reserve')).toHaveTextContent(
    '0',
  )
  expect(screen.getByText('A manager is unreachable.')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'm2' }))
  expect(mockOpen).toHaveBeenCalledWith('m2')
})

test.each([
  ['loading', { state: 'loading' }, /Loading control-plane observation/],
  [
    'network error',
    { state: 'hasError', error: new Error('offline') },
    /Control-plane information is unavailable/,
  ],
  [
    'API failure',
    { state: 'hasData', data: { available: false } },
    /Control-plane information is unavailable/,
  ],
])('renders explicit %s state', (_, value, text) => {
  mockResult = value
  render(<ClusterHealthSummary />)
  expect(screen.getByText(text)).toBeVisible()
  expect(
    screen.queryByText('Majority observed reachable'),
  ).not.toBeInTheDocument()
})

test('handles missing leader and unknown reserve', () => {
  mockResult.data = observation({ leaderIds: [], remainingFailures: null })
  render(<ClusterHealthSummary />)
  expect(screen.getByLabelText('Reported leader')).toHaveTextContent('Unknown')
  expect(screen.getByLabelText('Manager failure reserve')).toHaveTextContent(
    'Unknown',
  )
})

test('a failed refresh removes the previously successful observation', () => {
  const { rerender } = render(<ClusterHealthSummary />)
  mockResult = { state: 'hasData', data: { available: false } }
  rerender(<ClusterHealthSummary />)
  expect(
    screen.getByText(/Control-plane information is unavailable/),
  ).toBeVisible()
  expect(screen.queryByLabelText('Configured managers')).not.toBeInTheDocument()
})

test.each([
  [1, 'single_manager', 'No manager redundancy'],
  [2, 'even_managers', 'Even manager count'],
  [0, 'no_managers', 'No managers reported'],
])('shows the manager count warning inline for %i managers', (managers, code, title) => {
  mockResult.data = observation({
    managers,
    warnings: [{ code, message: 'Topology warning.', nodeIds: [] }],
  })
  render(<ClusterHealthSummary />)
  const button = screen.getByRole('button', { name: `${title}: Topology warning.` })
  expect(screen.getByLabelText('Configured managers')).toContainElement(button)
  expect(button).toHaveAttribute('title', `${title}: Topology warning.`)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

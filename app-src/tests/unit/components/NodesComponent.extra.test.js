import React from 'react'
import { render, screen } from '@testing-library/react'

// export named atom identifiers so tests can compare the atom argument passed to useAtom/useAtomValue
jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  tableSizeAtom: 'tableSizeAtom',
  nodesAtomNew: 'nodesAtomNew',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { NodesComponent } from '../../../src/components/NodesComponent'

describe('NodesComponent extra', () => {
  test('renders non-leader node with Down state and non-active availability', () => {
    const nodes = [ { ID: 'n2', Hostname: 'node2', Leader: false, State: 'down', Availability: 'pause', StatusAddr: '2.2.2.2' } ]

  // useAtomValue calls: currentVariant, currentVariantClasses, tableSize, nodes
  const values = ['light', 'classes', 'sm', nodes]
  mockUseAtomValue.mockImplementation(() => values.shift())

  const mockUpdateView = jest.fn()
  mockUseAtom.mockImplementation((atom) => [null, mockUpdateView])

    render(<NodesComponent />)
    expect(screen.getByText('node2')).toBeInTheDocument()
    // Badge for Down should be present
    expect(screen.getByText('Down')).toBeInTheDocument()
    // Availability badge should show the availability text
    expect(screen.getByText('pause')).toBeInTheDocument()
  })

  test('renders Ready state badge and Leader star when Leader true', () => {
    const nodes = [ { ID: 'n3', Hostname: 'node3', Leader: true, State: 'ready', Availability: 'active', StatusAddr: '3.3.3.3' } ]
  // useAtomValue calls: currentVariant, currentVariantClasses, tableSize, nodes
  const values = ['light', 'classes', 'sm', nodes]
    mockUseAtomValue.mockImplementation(() => values.shift())

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation(() => [null, mockUpdateView])

    render(<NodesComponent />)
    expect(screen.getByText('node3')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  // leader icon renders inside a span with class 'ms-1'; ensure that span exists next to the node name
  const nodeCell = screen.getByText('node3')
  const leaderSpan = nodeCell.parentElement.querySelector('.ms-1')
  expect(leaderSpan).toBeTruthy()
  })
})

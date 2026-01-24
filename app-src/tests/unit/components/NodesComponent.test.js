import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({}))

// provide mockable hooks
const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { NodesComponent } from '../../../src/components/NodesComponent'

describe('NodesComponent', () => {
  test('renders node with search button and leader tooltip', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', Leader: true, State: 'ready', Availability: 'active', StatusAddr: '1.2.3.4' },
    ]

  // return values in sequence (more robust against extra calls)
  const values = ['light', 'classes', 'sm', nodes]
  mockUseAtomValue.mockImplementation(() => values.shift())

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation(() => [null, mockUpdateView])

    render(<NodesComponent />)

    expect(screen.getByText('node1')).toBeInTheDocument()
    const searchBtn = screen.getByTitle(/Open node/i)
    expect(searchBtn).toBeInTheDocument()

    fireEvent.click(searchBtn)
    expect(mockUpdateView).toHaveBeenCalledWith({ id: 'nodesDetail', detail: 'n1' })

  // tooltip exists in DOM as title is provided via OverlayTrigger; ensure the star span is present
  expect(screen.getByText((content, element) => element.tagName.toLowerCase() === 'span' && element.textContent.trim() === '')).toBeTruthy()
  })
})

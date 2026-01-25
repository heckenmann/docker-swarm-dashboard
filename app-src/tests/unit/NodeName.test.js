import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeName } from '../../src/components/names/NodeName'
import * as entityActions from '../../src/common/actions/entityActions'

describe('NodeName', () => {
  test('renders name and open button and calls handler', () => {
    const onOpen = jest.fn()
    jest.spyOn(entityActions, 'useEntityActions').mockReturnValue({ onOpen, onFilter: jest.fn() })
    render(<NodeName name="node1" id="nid" />)
    expect(screen.getByText('node1')).toBeInTheDocument()
    const openBtn = screen.getByTitle('Open node: node1')
    fireEvent.click(openBtn)
    expect(onOpen).toHaveBeenCalledWith('nid')
    entityActions.useEntityActions.mockRestore()
  })
  test('does not render when name missing', () => {
    const { container } = render(<NodeName name={''} />)
    expect(container.firstChild).toBeNull()
  })
})

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EntityName } from '../../src/components/names/EntityName'

describe('EntityName', () => {
  test('renders name and actions and calls handlers', () => {
    const onOpen = jest.fn()
    const onFilter = jest.fn()
    render(
      <EntityName name="e1" id="eid" onOpen={onOpen} onFilter={onFilter} />,
    )
    expect(screen.getByText('e1')).toBeInTheDocument()
  const openBtn = screen.getByTitle('Open service: e1')
  const filterBtn = screen.getByTitle('Filter service: e1')
    fireEvent.click(openBtn)
    expect(onOpen).toHaveBeenCalledWith('eid')
    fireEvent.click(filterBtn)
    expect(onFilter).toHaveBeenCalledWith('e1')
  })
})

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StackName } from '../../src/components/names/StackName'
import * as entityActions from '../../src/common/actions/entityActions'

describe('StackName', () => {
  test('renders name and filter and calls handler', () => {
    const onFilter = jest.fn()
    jest.spyOn(entityActions, 'useEntityActions').mockReturnValue({ onOpen: jest.fn(), onFilter })
    render(<StackName name="stackA" />)
    expect(screen.getByText('stackA')).toBeInTheDocument()
    const filterBtn = screen.getByTitle('Filter stack: stackA')
    fireEvent.click(filterBtn)
    expect(onFilter).toHaveBeenCalledWith('stackA')
    entityActions.useEntityActions.mockRestore()
  })
  test('handles empty name gracefully', () => {
    const { container } = render(<StackName name={''} onFilter={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})

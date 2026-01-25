import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NameActions } from '../../src/components/names/NameActions'

describe('NameActions', () => {
  test('renders open and filter buttons and calls handlers', () => {
    const onOpen = jest.fn()
    const onFilter = jest.fn()
    render(<NameActions name="n1" id="i1" onOpen={onOpen} onFilter={onFilter} />)
    const openBtn = screen.getByTitle('Open service: n1')
    const filterBtn = screen.getByTitle('Filter service: n1')
    fireEvent.click(openBtn)
    expect(onOpen).toHaveBeenCalledWith('i1')
    fireEvent.click(filterBtn)
    expect(onFilter).toHaveBeenCalledWith('n1')
  })

  test('hides buttons when toggled off and supports entityType', () => {
    const { queryByTitle, rerender } = render(<NameActions name="n2" id="i2" showOpen={false} showFilter={false} />)
    expect(queryByTitle('Open service: n2')).toBeNull()
    expect(queryByTitle('Filter service: n2')).toBeNull()

    // entityType in title
    rerender(<NameActions name="n3" id="i3" entityType="node" />)
    expect(screen.getByTitle('Open node: n3')).toBeInTheDocument()
    expect(screen.getByTitle('Filter node: n3')).toBeInTheDocument()
  })
})

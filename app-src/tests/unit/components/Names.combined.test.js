import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

describe('Name-related components combined', () => {
  test('StackName renders and calls onFilter', () => {
  const entityActions = require('../../../src/common/actions/entityActions')
    const onFilter = jest.fn()
    jest.spyOn(entityActions, 'useEntityActions').mockReturnValue({ onOpen: jest.fn(), onFilter })
  const StackName = require('../../../src/components/names/StackName').StackName
    render(React.createElement(StackName, { name: 'stackA' }))
    expect(screen.getByText('stackA')).toBeInTheDocument()
    const filterBtn = screen.getByTitle('Filter stack: stackA')
    fireEvent.click(filterBtn)
    expect(onFilter).toHaveBeenCalledWith('stackA')
    entityActions.useEntityActions.mockRestore()
  })

  test('ServiceName renders and supports overlay/hide behavior', () => {
  const ServiceName = require('../../../src/components/names/ServiceName').ServiceName
    const { queryByTitle, rerender } = render(React.createElement(ServiceName, { name: 'svc1', id: 'id1' }))
    expect(screen.getByText('svc1')).toBeInTheDocument()
    rerender(React.createElement(ServiceName, { name: 'svc1', id: 'id1', useOverlay: true, tooltipText: 'svc1' }))
    expect(queryByTitle('Open service: svc1')).toBeNull()
    expect(queryByTitle('Filter service: svc1')).toBeNull()
    const { container } = render(React.createElement(ServiceName, { name: '' }))
    expect(container.firstChild).toBeNull()
  })

  test('NodeName renders and calls onOpen', () => {
  const entityActions = require('../../../src/common/actions/entityActions')
    const onOpen = jest.fn()
    jest.spyOn(entityActions, 'useEntityActions').mockReturnValue({ onOpen, onFilter: jest.fn() })
  const NodeName = require('../../../src/components/names/NodeName').NodeName
    render(React.createElement(NodeName, { name: 'node1', id: 'nid' }))
    expect(screen.getByText('node1')).toBeInTheDocument()
    const openBtn = screen.getByTitle('Open node: node1')
    fireEvent.click(openBtn)
    expect(onOpen).toHaveBeenCalledWith('nid')
    entityActions.useEntityActions.mockRestore()
  })

  test('NodeName returns null when name is empty', () => {
    const NodeName = require('../../../src/components/names/NodeName').NodeName
    const { container } = render(React.createElement(NodeName, { name: '' }))
    expect(container.firstChild).toBeNull()
  })

  test('NameActions renders buttons and supports entityType', () => {
  const NameActions = require('../../../src/components/names/NameActions').NameActions
    const onOpen = jest.fn()
    const onFilter = jest.fn()
    render(React.createElement(NameActions, { name: 'n1', id: 'i1', onOpen, onFilter }))
    const openBtn = screen.getByTitle('Open service: n1')
    const filterBtn = screen.getByTitle('Filter service: n1')
    fireEvent.click(openBtn)
    expect(onOpen).toHaveBeenCalledWith('i1')
    fireEvent.click(filterBtn)
    expect(onFilter).toHaveBeenCalledWith('n1')

    const { queryByTitle, rerender } = render(React.createElement(NameActions, { name: 'n2', id: 'i2', showOpen: false, showFilter: false }))
    expect(queryByTitle('Open service: n2')).toBeNull()
    expect(queryByTitle('Filter service: n2')).toBeNull()
    rerender(React.createElement(NameActions, { name: 'n3', id: 'i3', entityType: 'node' }))
    expect(screen.getByTitle('Open node: n3')).toBeInTheDocument()
    expect(screen.getByTitle('Filter node: n3')).toBeInTheDocument()
  })

  test('EntityName composes name and actions and calls handlers', () => {
  const EntityName = require('../../../src/components/names/EntityName').EntityName
    const onOpen = jest.fn()
    const onFilter = jest.fn()
    render(React.createElement(EntityName, { name: 'e1', id: 'eid', onOpen, onFilter }))
    expect(screen.getByText('e1')).toBeInTheDocument()
    const openBtn = screen.getByTitle('Open service: e1')
    const filterBtn = screen.getByTitle('Filter service: e1')
    fireEvent.click(openBtn)
    expect(onOpen).toHaveBeenCalledWith('eid')
    fireEvent.click(filterBtn)
    expect(onFilter).toHaveBeenCalledWith('e1')
  })
})

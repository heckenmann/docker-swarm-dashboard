import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

describe('ServiceName component combined', () => {
  test('ServiceName renders and supports overlay/hide behavior', () => {
    const ServiceName =
      require('../../../src/components/shared/names/ServiceName').ServiceName
    const { queryByTitle, rerender } = render(
      React.createElement(ServiceName, { name: 'svc1', id: 'id1' }),
    )
    expect(screen.getByText('svc1')).toBeInTheDocument()
    rerender(
      React.createElement(ServiceName, {
        name: 'svc1',
        id: 'id1',
        useOverlay: true,
        tooltipText: 'svc1',
      }),
    )
    expect(queryByTitle('Open service: svc1')).toBeNull()
    expect(queryByTitle('Filter service: svc1')).toBeNull()
    const { container } = render(React.createElement(ServiceName, { name: '' }))
    expect(container.firstChild).toBeNull()
  })

  test('ServiceName renders with default props', () => {
    const ServiceName =
      require('../../../src/components/shared/names/ServiceName').ServiceName
    render(React.createElement(ServiceName, { name: 'my-service', id: 'svc-123' }))
    expect(screen.getByText('my-service')).toBeInTheDocument()
    expect(screen.getByTitle('Open service: my-service')).toBeInTheDocument()
    expect(screen.getByTitle('Filter service: my-service')).toBeInTheDocument()
    // ServiceName always shows logs button (showLogs is hardcoded to true)
    expect(screen.getByTitle('Show logs for service: my-service')).toBeInTheDocument()
  })

  test('ServiceName renders service name correctly', () => {
    const ServiceName =
      require('../../../src/components/shared/names/ServiceName').ServiceName
    const { container } = render(
      React.createElement(ServiceName, {
        name: 'this-is-a-very-long-service-name',
        id: 'long-svc',
      }),
    )
    expect(screen.getByText('this-is-a-very-long-service-name')).toBeInTheDocument()
    // Name truncation is not implemented in ServiceName - the full name is shown
    expect(container.querySelector('span').textContent).toBe('this-is-a-very-long-service-name')
  })

  test('ServiceName calls onFilter when filter button clicked', () => {
    const entityActions = require('../../../src/common/hooks/useEntityActions')
    const onFilter = jest.fn()
    jest
      .spyOn(entityActions, 'useEntityActions')
      .mockReturnValue({ onOpen: jest.fn(), onFilter })
    const ServiceName =
      require('../../../src/components/shared/names/ServiceName').ServiceName
    render(React.createElement(ServiceName, { name: 'filterable-svc', id: 'filter-1' }))
    fireEvent.click(screen.getByTitle('Filter service: filterable-svc'))
    expect(onFilter).toHaveBeenCalledWith('filterable-svc')
    entityActions.useEntityActions.mockRestore()
  })

  // ---- showNamesButtonsAtom effect ----
  test('ServiceName hides action buttons when showNamesButtonsAtom is false', () => {
    jest.isolateModules(() => {
      jest.doMock('jotai', () => ({
        useAtomValue: () => false,
        useAtom: () => [null, jest.fn()],
      }))
      jest.doMock('../../../src/common/store/atoms', () => ({
        logsFormServiceIdAtom: 'logsFormServiceIdAtom',
        logsFormServiceNameAtom: 'logsFormServiceNameAtom',
        logsConfigAtom: 'logsConfigAtom',
        logsShowLogsAtom: 'logsShowLogsAtom',
        viewAtom: 'viewAtom',
        showNamesButtonsAtom: 'showNamesButtonsAtom',
      }))
      jest.doMock('../../../src/common/hooks/useEntityActions', () => ({
        useEntityActions: () => ({ onOpen: jest.fn(), onFilter: jest.fn() }),
      }))
      jest.doMock('react-bootstrap', () => ({
        OverlayTrigger: ({ children }) => children,
        Tooltip: ({ children }) => React.createElement('div', {}, children),
        Button: (props) => React.createElement('button', { title: props.title, onClick: props.onClick }, props.children),
      }))
      const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
      render(React.createElement(ServiceName, { name: 'hidden-svc', id: 'hid-1' }))
      expect(screen.getByText('hidden-svc')).toBeInTheDocument()
      expect(screen.queryByTitle(/Open service/i)).toBeNull()
      expect(screen.queryByTitle(/Filter service/i)).toBeNull()
      expect(screen.queryByTitle(/Show logs for service/i)).toBeNull()
    })
  })

  test('ServiceName shows action buttons when showNamesButtonsAtom is true', () => {
    // Real jotai: showNamesButtonsAtom defaults to true — buttons are shown without any mocking
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(React.createElement(ServiceName, { name: 'visible-svc', id: 'vid-1' }))
    expect(screen.getByText('visible-svc')).toBeInTheDocument()
    expect(screen.queryByTitle(/Open service: visible-svc/i)).not.toBeNull()
    expect(screen.queryByTitle(/Filter service: visible-svc/i)).not.toBeNull()
    expect(screen.queryByTitle(/Show logs for service: visible-svc/i)).not.toBeNull()
  })

  // ---- Logs button tests ----
  // Note: ServiceName always shows logs button (showLogs is hardcoded to true in ServiceName)
  // The showLogs prop is not exposed in ServiceName - it's always true
  test('ServiceName always shows logs button (showLogs is hardcoded to true)', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(React.createElement(ServiceName, { name: 'log-svc', id: 'log-1' }))
    expect(screen.getByTitle('Show logs for service: log-svc')).toBeInTheDocument()
  })

  // ---- Edge cases ----
  test('ServiceName with overlay hides open/filter but shows logs', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      React.createElement(ServiceName, {
        name: 'overlay-svc',
        id: 'ov-1',
        useOverlay: true,
        tooltipText: 'overlay tooltip',
      }),
    )
    expect(screen.getByText('overlay-svc')).toBeInTheDocument()
    // With overlay, open and filter are hidden but logs should still be shown
    expect(screen.queryByTitle(/Open service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter service/i)).toBeNull()
    expect(screen.queryByTitle(/Show logs for service/i)).not.toBeNull()
  })
})
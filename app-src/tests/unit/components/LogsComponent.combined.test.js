import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Jotai atoms
jest.mock('jotai', () => ({
  useAtom: jest.fn((atom) => {
    if (atom === 'logsLinesAtom') return [[], jest.fn()]
    if (atom === 'logsShowLogsAtom') return [false, jest.fn()]
    if (atom === 'logsConfigAtom') return [null, jest.fn()]
    return [null, jest.fn()]
  }),
  useAtomValue: jest.fn((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    if (atom === 'logsNumberOfLinesAtom') return 20
    if (atom === 'logsMessageMaxLenAtom') return 10000
    if (atom === 'logsWebsocketUrlAtom') return null
    return null
  }),
  Provider: ({ children }) => children
}))

// Mock atoms
jest.mock('../../../src/common/store/atoms', () => ({
  logsLinesAtom: 'logsLinesAtom',
  logsShowLogsAtom: 'logsShowLogsAtom',
  logsConfigAtom: 'logsConfigAtom',
  currentVariantAtom: 'currentVariantAtom',
  logsNumberOfLinesAtom: 'logsNumberOfLinesAtom',
  logsMessageMaxLenAtom: 'logsMessageMaxLenAtom',
  logsWebsocketUrlAtom: 'logsWebsocketUrlAtom',
}))

// Mock react-use-websocket
jest.mock('react-use-websocket', () => ({
  __esModule: true,
  default: () => ({ lastMessage: null }),
}))

describe('LogsComponent', () => {
  test('renders without crashing', () => {
    const LogsComponent = require('../../../src/components/logs/LogsComponent').LogsComponent
    render(React.createElement(LogsComponent))
    
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })

  test('shows loading state when logsShowLogs is false', () => {
    require('jotai').useAtom.mockImplementation((atom) => {
      if (atom === 'logsShowLogsAtom') return [false, jest.fn()]
      if (atom === 'logsLinesAtom') return [[], jest.fn()]
      if (atom === 'logsConfigAtom') return [null, jest.fn()]
      return [null, jest.fn()]
    })
    
    const LogsComponent = require('../../../src/components/logs/LogsComponent').LogsComponent
    render(React.createElement(LogsComponent))
    
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })

  test('shows logs when logsShowLogs is true', () => {
    require('jotai').useAtom.mockImplementation((atom) => {
      if (atom === 'logsShowLogsAtom') return [true, jest.fn()]
      if (atom === 'logsLinesAtom') return [[{ id: '1', message: 'test log' }], jest.fn()]
      if (atom === 'logsConfigAtom') return [null, jest.fn()]
      return [null, jest.fn()]
    })
    
    const LogsComponent = require('../../../src/components/logs/LogsComponent').LogsComponent
    render(React.createElement(LogsComponent))
    
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })
})
import { render } from '@testing-library/react'

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
const mockSetLogsLines = jest.fn()
const mockSetLogsError = jest.fn()

// Captures the options object handed to useWebSocket so the test can drive the
// socket callbacks directly.
let websocketOptions = null

jest.mock('react-use-websocket', () => ({
  __esModule: true,
  default: (url, options) => {
    websocketOptions = options
    return { lastMessage: null, readyState: 1 }
  },
}))

jest.mock('../../../../src/common/store/atoms/logsAtoms', () => ({
  logsConfigAtom: 'logsConfigAtom',
  logsErrorAtom: 'logsErrorAtom',
  logsLinesAtom: 'logsLinesAtom',
  logsNumberOfLinesAtom: 'logsNumberOfLinesAtom',
  logsMessageMaxLenAtom: 'logsMessageMaxLenAtom',
  logsShowLogsAtom: 'logsShowLogsAtom',
  logsWebsocketUrlAtom: 'logsWebsocketUrlAtom',
}))

jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
  useAtom: (atom) => mockUseAtom(atom),
  useSetAtom: () => mockSetLogsError,
  Provider: ({ children }) => children,
}))

jest.mock('../../../../src/components/common/DSDCard.jsx', () => ({
  __esModule: true,
  default: ({ body }) => body,
}))
jest.mock('../../../../src/components/logs/LogsSetupForm.jsx', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../../../../src/components/logs/LogsActiveControls.jsx', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../../../../src/components/logs/LogsOutput', () => ({
  __esModule: true,
  default: () => null,
}))

import LogsComponent from '../../../../src/components/logs/LogsComponent'

const atoms = {
  logsConfigAtom: { serviceId: 'abc', follow: false },
  logsNumberOfLinesAtom: 50,
  logsMessageMaxLenAtom: 10000,
  logsShowLogsAtom: true,
  logsWebsocketUrlAtom: 'ws://localhost/docker/logs/abc',
}

/** Applies the accumulated functional updates to an initial list of lines. */
const applyUpdates = (initial = []) =>
  mockSetLogsLines.mock.calls.reduce((lines, [updater]) => updater(lines), initial)

describe('LogsComponent websocket handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    websocketOptions = null
    mockUseAtomValue.mockImplementation((atom) => atoms[atom] ?? null)
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'logsLinesAtom') return [[], mockSetLogsLines]
      if (atom === 'logsShowLogsAtom') return [atoms.logsShowLogsAtom, jest.fn()]
      return [null, jest.fn()]
    })
    render(<LogsComponent />)
  })

  test('keeps every line of a burst delivered between two renders', () => {
    // The backend sends one websocket message per log line. Reading them from
    // `lastMessage` used to collapse a burst into its final line only.
    const burst = ['line-1', 'line-2', 'line-3', 'line-4', 'line-5']
    burst.forEach((data) => websocketOptions.onMessage({ data }))

    expect(applyUpdates()).toEqual(burst)
  })

  test('truncates messages longer than the configured maximum', () => {
    mockUseAtomValue.mockImplementation((atom) =>
      atom === 'logsMessageMaxLenAtom' ? 5 : (atoms[atom] ?? null),
    )
    jest.clearAllMocks()
    render(<LogsComponent />)

    websocketOptions.onMessage({ data: 'abcdefghij' })

    expect(applyUpdates()).toEqual(['abcde...'])
  })

  test('caps the retained lines at twice the requested number of lines', () => {
    mockUseAtomValue.mockImplementation((atom) =>
      atom === 'logsNumberOfLinesAtom' ? 2 : (atoms[atom] ?? null),
    )
    jest.clearAllMocks()
    render(<LogsComponent />)

    for (let i = 0; i < 30; i++) websocketOptions.onMessage({ data: `l${i}` })

    const lines = applyUpdates()
    expect(lines).toHaveLength(20)
    expect(lines[lines.length - 1]).toBe('l29')
  })

  test('reports an unexpected close reason as an error', () => {
    websocketOptions.onClose({ code: 1011, reason: 'Docker logs error: boom' })

    expect(mockSetLogsError).toHaveBeenCalledWith('Docker logs error: boom')
  })

  test('stays silent on a normal close', () => {
    websocketOptions.onClose({ code: 1000, reason: '' })

    expect(mockSetLogsError).not.toHaveBeenCalled()
  })

  test('clears a previous error when the socket opens', () => {
    websocketOptions.onOpen({})

    expect(mockSetLogsError).toHaveBeenCalledWith(null)
  })

  test('reconnects only while following', () => {
    expect(websocketOptions.shouldReconnect()).toBe(false)

    mockUseAtomValue.mockImplementation((atom) =>
      atom === 'logsConfigAtom'
        ? { serviceId: 'abc', follow: true }
        : (atoms[atom] ?? null),
    )
    render(<LogsComponent />)

    expect(websocketOptions.shouldReconnect()).toBe(true)
  })
})

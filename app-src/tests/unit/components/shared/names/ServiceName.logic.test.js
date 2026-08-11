// ServiceName.logic.test.js
// Tests for the extracted handleShowLogsInternal function

import { handleShowLogsInternal } from '../../../../../src/components/shared/names/ServiceName'
import { logsId } from '../../../../../src/common/navigationConstants'

describe('ServiceName handleShowLogsInternal', () => {
  const mockSetLogsShowLogs = jest.fn()
  const mockSetLogsConfig = jest.fn()
  const mockResetLogsLines = jest.fn()
  const mockSetFormId = jest.fn()
  const mockSetFormName = jest.fn()
  const mockUpdateView = jest.fn()

  const callHandler = (logsShowLogs) =>
    handleShowLogsInternal({
      serviceId: 'test-id',
      serviceName: 'test-service',
      logsShowLogs,
      setLogsShowLogs: mockSetLogsShowLogs,
      setLogsConfig: mockSetLogsConfig,
      resetLogsLines: mockResetLogsLines,
      setFormId: mockSetFormId,
      setFormName: mockSetFormName,
      updateView: mockUpdateView,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('handles logs button click when logs are not showing', () => {
    callHandler(false)

    expect(mockSetLogsShowLogs).not.toHaveBeenCalled()
    expect(mockSetLogsConfig).not.toHaveBeenCalled()
    expect(mockResetLogsLines).not.toHaveBeenCalled()
    expect(mockSetFormId).toHaveBeenCalledWith('test-id')
    expect(mockSetFormName).toHaveBeenCalledWith('test-service')
    expect(mockUpdateView).toHaveBeenCalled()

    // Check that the updateView function was called with a function
    const updateViewArg = mockUpdateView.mock.calls[0][0]
    expect(updateViewArg).toBeInstanceOf(Function)

    // Test the function that was passed to updateView
    const result = updateViewArg({})
    expect(result.id).toBe(logsId)
  })

  test('closes the current session when logs are showing', () => {
    callHandler(true)

    expect(mockSetLogsShowLogs).toHaveBeenCalledWith(false)
    expect(mockSetLogsConfig).toHaveBeenCalledWith(null)
    expect(mockResetLogsLines).toHaveBeenCalled()
    expect(mockSetFormId).toHaveBeenCalledWith('test-id')
    expect(mockSetFormName).toHaveBeenCalledWith('test-service')
    expect(mockUpdateView).toHaveBeenCalled()

    // Check that the updateView function was called with a function
    const updateViewArg = mockUpdateView.mock.calls[0][0]
    expect(updateViewArg).toBeInstanceOf(Function)

    // Test the function that was passed to updateView
    const result = updateViewArg({})
    expect(result.id).toBe(logsId)
  })

  test('discards the lines of the previous service', () => {
    callHandler(true)

    // The output panel must not mix the previous service's lines with the
    // ones fetched for the newly selected service.
    expect(mockResetLogsLines).toHaveBeenCalledTimes(1)
  })
})

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

    expect(mockUpdateView).toHaveBeenCalledWith({ id: logsId })
  })

  test('closes the current session when logs are showing', () => {
    callHandler(true)

    expect(mockSetLogsShowLogs).toHaveBeenCalledWith(false)
    expect(mockSetLogsConfig).toHaveBeenCalledWith(null)
    expect(mockResetLogsLines).toHaveBeenCalled()
    expect(mockSetFormId).toHaveBeenCalledWith('test-id')
    expect(mockSetFormName).toHaveBeenCalledWith('test-service')
    expect(mockUpdateView).toHaveBeenCalled()

    expect(mockUpdateView).toHaveBeenCalledWith({ id: logsId })
  })

  test('discards the lines of the previous service', () => {
    callHandler(true)

    // The output panel must not mix the previous service's lines with the
    // ones fetched for the newly selected service.
    expect(mockResetLogsLines).toHaveBeenCalledTimes(1)
  })
})

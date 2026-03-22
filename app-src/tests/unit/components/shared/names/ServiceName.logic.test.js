// ServiceName.logic.test.js
// Tests for the extracted handleShowLogsInternal function

import { handleShowLogsInternal } from '../../../../../src/components/shared/names/ServiceName'
import { logsId } from '../../../../../src/common/navigationConstants'

describe('ServiceName handleShowLogsInternal', () => {
  const mockSetLogsShowLogs = jest.fn()
  const mockSetLogsConfig = jest.fn()
  const mockSetFormId = jest.fn()
  const mockSetFormName = jest.fn()
  const mockUpdateView = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('handles logs button click when logs are not showing', () => {
    handleShowLogsInternal(
      'test-id',
      'test-service',
      false,  // logsShowLogsVal
      null,   // logsConfigVal
      mockSetLogsShowLogs,
      mockSetLogsConfig,
      mockSetFormId,
      mockSetFormName,
      mockUpdateView
    )
    
    expect(mockSetLogsShowLogs).not.toHaveBeenCalled()
    expect(mockSetLogsConfig).not.toHaveBeenCalled()
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

  test('handles logs button click when logs are showing with follow', () => {
    handleShowLogsInternal(
      'test-id',
      'test-service',
      true,   // logsShowLogsVal
      { follow: true },  // logsConfigVal
      mockSetLogsShowLogs,
      mockSetLogsConfig,
      mockSetFormId,
      mockSetFormName,
      mockUpdateView
    )
    
    expect(mockSetLogsShowLogs).toHaveBeenCalledWith(false)
    expect(mockSetLogsConfig).toHaveBeenCalledWith(null)
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

  test('handles logs button click when logs are showing without follow', () => {
    handleShowLogsInternal(
      'test-id',
      'test-service',
      true,   // logsShowLogsVal
      { follow: false },  // logsConfigVal
      mockSetLogsShowLogs,
      mockSetLogsConfig,
      mockSetFormId,
      mockSetFormName,
      mockUpdateView
    )
    
    expect(mockSetLogsShowLogs).not.toHaveBeenCalled()
    expect(mockSetLogsConfig).not.toHaveBeenCalled()
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
})

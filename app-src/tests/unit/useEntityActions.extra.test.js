import { renderHook, act } from '@testing-library/react'
import * as entityActions from '../../src/common/actions/entityActions'
import * as atoms from '../../src/common/store/atoms'
import * as nav from '../../src/common/navigationConstants'

// Mock only the `useAtom` export from jotai while preserving other exports
jest.mock('jotai', () => {
  const actual = jest.requireActual('jotai')
  return { ...actual, useAtom: jest.fn() }
})

describe('useEntityActions extra', () => {
  let useAtomMock
  beforeEach(() => {
    useAtomMock = require('jotai').useAtom
    useAtomMock.mockReset()
  })

  test('onOpen navigates to nodes detail when entityType=node', () => {
    const updateView = jest.fn()
    // order: viewAtom, serviceNameFilterAtom, stackNameFilterAtom, filterTypeAtom
    useAtomMock
      .mockReturnValueOnce([null, updateView])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])

    const { result } = renderHook(() => entityActions.useEntityActions('node'))

    act(() => result.current.onOpen('nid'))
  expect(updateView).toHaveBeenCalledWith({ id: nav.nodesDetailId, detail: 'nid' })
  })

  test('onOpen does nothing when no id provided', () => {
    const updateView = jest.fn()
    useAtomMock
      .mockReturnValueOnce([null, updateView])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])

    const { result } = renderHook(() => entityActions.useEntityActions('service'))

    act(() => result.current.onOpen(null))
    expect(updateView).not.toHaveBeenCalled()
  })

  test('onFilter sets service filter and clears stack filter', () => {
    const setServiceFilterName = jest.fn()
    const setStackFilterName = jest.fn()
    const setFilterType = jest.fn()

    useAtomMock
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, setServiceFilterName])
      .mockReturnValueOnce([null, setStackFilterName])
      .mockReturnValueOnce([null, setFilterType])

    const { result } = renderHook(() => entityActions.useEntityActions('service'))

    act(() => result.current.onFilter('svcA'))
    expect(setFilterType).toHaveBeenCalledWith('service')
    expect(setServiceFilterName).toHaveBeenCalledWith('svcA')
    expect(setStackFilterName).toHaveBeenCalledWith('')
  })

  test('onFilter sets stack filter and clears service filter', () => {
    const setServiceFilterName = jest.fn()
    const setStackFilterName = jest.fn()
    const setFilterType = jest.fn()

    useAtomMock
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, setServiceFilterName])
      .mockReturnValueOnce([null, setStackFilterName])
      .mockReturnValueOnce([null, setFilterType])

    const { result } = renderHook(() => entityActions.useEntityActions('stack'))

    act(() => result.current.onFilter('stackA'))
    expect(setFilterType).toHaveBeenCalledWith('stack')
    expect(setStackFilterName).toHaveBeenCalledWith('stackA')
    expect(setServiceFilterName).toHaveBeenCalledWith('')
  })
})

import { renderHook, act } from '@testing-library/react'

describe('coverage boost for parseHashToObj and entityActions', () => {
  test('parseHashToObj exercises multiple branches', () => {
    const { parseHashToObj } = require('../../../src/common/store/atoms')
    expect(parseHashToObj('')).toEqual({})
    expect(parseHashToObj('#')).toEqual({})
    expect(parseHashToObj('#k=v')).toEqual({ k: 'v' })
    expect(parseHashToObj('#k="v"').k).toBe('v')
    // malformed pair
    expect(typeof parseHashToObj('#badpair')).toBe('object')
    // malformed percent encoding should fallback
    const out = parseHashToObj('#a=%ZZ')
    expect(out.a).toBe('%ZZ')
  })

  test('useEntityActions early returns and updaters', () => {
    jest.resetModules()
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))

    const atoms = require('../../../src/common/store/atoms')
    const jotai = require('jotai')

    const mockUpdateView = jest.fn()
    jotai.useAtom.mockImplementation((atom) => {
      if (atom === atoms.viewAtom) return [null, mockUpdateView]
      if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.stackNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.filterTypeAtom) return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    const { useEntityActions } = require('../../../src/common/actions/entityActions')
    const nav = require('../../../src/common/navigationConstants')

    // early return when detailId falsy
    const { result } = renderHook(() => useEntityActions('service'))
    act(() => result.current.onOpen(undefined))
    expect(mockUpdateView).not.toHaveBeenCalled()

    // service open produces updater
    act(() => result.current.onOpen('s1'))
    expect(mockUpdateView).toHaveBeenCalled()
    let updater = mockUpdateView.mock.calls.pop()[0]
    expect(updater({})).toEqual({ id: nav.servicesDetailId, detail: 's1' })

    // node open
    const { result: nodeRes } = renderHook(() => useEntityActions('node'))
    act(() => nodeRes.current.onOpen('n1'))
    updater = mockUpdateView.mock.calls.pop()[0]
    expect(updater({})).toEqual({ id: nav.nodesDetailId, detail: 'n1' })

    // task open
    const { result: taskRes } = renderHook(() => useEntityActions('task'))
    act(() => taskRes.current.onOpen('t1'))
    updater = mockUpdateView.mock.calls.pop()[0]
    expect(updater({})).toEqual({ id: nav.tasksId, detail: 't1' })
  })

  test('additional entityActions branches exercise service and stack filter paths', () => {
    jest.resetModules()
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))

    const atoms = require('../../../src/common/store/atoms')
    const jotai = require('jotai')
    const mockUpdateView = jest.fn()
    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetFilterType = jest.fn()

    jotai.useAtom.mockImplementation((atom) => {
      if (atom === atoms.viewAtom) return [null, mockUpdateView]
      if (atom === atoms.serviceNameFilterAtom) return ['', mockSetService]
      if (atom === atoms.stackNameFilterAtom) return ['', mockSetStack]
      if (atom === atoms.filterTypeAtom) return ['service', mockSetFilterType]
      return [null, jest.fn()]
    })

  const { useEntityActions } = require('../../../src/common/actions/entityActions')
  const { result } = renderHook(() => useEntityActions('service'))
  // service open should call updateView
  act(() => result.current.onOpen('svc2'))
  expect(mockUpdateView).toHaveBeenCalled()
  // switching to stack should clear service
  const { result: stackRes } = renderHook(() => useEntityActions('stack'))
  act(() => stackRes.current.onFilter('stacky'))
  expect(mockSetStack).toHaveBeenCalledWith('stacky')
  })
})

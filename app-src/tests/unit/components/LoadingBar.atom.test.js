import React from 'react'
import { render } from '@testing-library/react'

// mock jotai's atom and useAtomValue to simulate networkRequestsAtom
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  // simple atom stub (atoms.js only needs atom to be a function)
  atom: (v) => v,
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

import LoadingBar from '../../../src/components/LoadingBar'

describe('LoadingBar atom-driven', () => {
  test('shows when atomCount > 0', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      return 2 // simulate two active requests
    })
    const { container } = render(<LoadingBar />)
    const bar = container.querySelector('.loading-bar')
    expect(bar).toBeTruthy()
    // visible class should be present when requests > 0
    expect(bar.classList.contains('visible')).toBe(true)
  })
})

import React from 'react'
import { render } from '@testing-library/react'

// Mock Jotai atoms
jest.mock('jotai', () => ({
  atom: (v) => v,
  useAtomValue: jest.fn((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    return null
  }),
  Provider: ({ children }) => children
}))

// Mock atoms
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom'
}))

test('LoadingComponent mounts and shows loading bar', () => {
  const LoadingComponent = require('../../../src/components/layout/LoadingComponent').default
  const { container } = render(React.createElement(LoadingComponent))
  expect(container).toBeTruthy()
  const bar = container.querySelector('.loading-bar')
  expect(bar).toBeTruthy()
})

test('LoadingComponent shows text-light when dark mode active', () => {
  // Mock dark mode
  require('jotai').useAtomValue.mockReturnValue('dark')
  
  const LoadingComponent = require('../../../src/components/layout/LoadingComponent').default
  const { container } = render(React.createElement(LoadingComponent))
  expect(container).toBeTruthy()
  const card = container.querySelector('.loading-card')
  expect(card).toBeTruthy()
})
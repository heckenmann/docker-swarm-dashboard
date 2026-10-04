import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import App from '../../src/App'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
} from '../../src/common/store/atoms/themeAtoms'
import { maxContentWidthAtom } from '../../src/common/store/atoms/uiAtoms'

jest.mock('../../src/common/store/atoms/themeAtoms', () => {
  const { atom } = jest.requireActual('jotai')
  return {
    currentVariantAtom: atom('light'),
    currentVariantClassesAtom: atom('bg-light text-dark'),
  }
})
jest.mock('../../src/common/store/atoms/uiAtoms', () => {
  const { atom } = jest.requireActual('jotai')
  return { maxContentWidthAtom: atom('fluid') }
})
jest.mock('../../src/components/layout/DashboardNavbar.jsx', () => () => (
  <nav aria-label="Main navigation" />
))
jest.mock('../../src/components/layout/LoadingBar.jsx', () => () => null)
jest.mock(
  '../../src/components/shared/WelcomeMessageComponent.jsx',
  () => () => null,
)
jest.mock('../../src/components/layout/ContentRouter.jsx', () => () => (
  <div>Dashboard content</div>
))

describe('App shell with Jotai v3', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-bs-theme')
    document.documentElement.classList.remove('theme-dark')
  })

  test('updates theme and container width from real atoms', () => {
    const store = createStore()
    const { container } = render(
      <Provider store={store}>
        <App />
      </Provider>,
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light')
    expect(
      container.querySelector('main > .container-fluid'),
    ).toBeInTheDocument()
    act(() => {
      store.set(currentVariantAtom, 'dark')
      store.set(currentVariantClassesAtom, 'bg-dark text-light')
      store.set(maxContentWidthAtom, 'fixed')
    })
    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark')
    expect(document.documentElement).toHaveClass('theme-dark')
    expect(container.querySelector('.app')).toHaveClass('bg-dark', 'text-light')
    expect(container.querySelector('main > .container')).toBeInTheDocument()
    act(() => store.set(currentVariantAtom, 'light'))
    expect(document.documentElement).not.toHaveClass('theme-dark')
  })

  test('keeps the shell visible while settings are pending', () => {
    const store = createStore()
    store.set(currentVariantAtom, new Promise(() => {}))
    store.set(currentVariantClassesAtom, new Promise(() => {}))
    store.set(maxContentWidthAtom, new Promise(() => {}))
    const { container } = render(
      <Provider store={store}>
        <App />
      </Provider>,
    )
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
    expect(container.querySelector('.app')).toHaveClass('bg-light', 'text-dark')
    expect(
      container.querySelector('main > .container-fluid'),
    ).toBeInTheDocument()
  })

  test.each([
    currentVariantAtom,
    currentVariantClassesAtom,
    maxContentWidthAtom,
  ])('sends rejected settings to the error boundary', async (source) => {
    const store = createStore()
    let reject
    store.set(
      source,
      new Promise((_resolve, fail) => {
        reject = fail
      }),
    )
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      render(
        <Provider store={store}>
          <App />
        </Provider>,
      )
      await act(async () => reject(new Error('Settings failed')))
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Settings failed',
      )
    } finally {
      errorLog.mockRestore()
    }
  })
})

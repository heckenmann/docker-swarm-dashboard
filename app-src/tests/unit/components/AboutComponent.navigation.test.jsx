import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AboutComponent from '../../../src/components/misc/AboutComponent'

const mockUpdateView = jest.fn()
jest.mock('jotai', () => ({
  useAtom: () => [null, mockUpdateView],
  useAtomValue: (atom) => atom === 'version' ? { version: 'test' } : 'light',
}))
jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({ versionAtom: 'version' }))
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({ currentVariantAtom: 'theme' }))
jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({ viewAtom: 'view' }))

test('opening Debug sets only the destination view', () => {
  render(<AboutComponent />)
  fireEvent.click(screen.getByRole('button', { name: /Debug/ }))
  expect(mockUpdateView).toHaveBeenCalledWith({ id: 'debug' })
})

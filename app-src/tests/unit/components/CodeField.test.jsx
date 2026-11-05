import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
let mockTheme = 'light'
jest.mock('jotai', () => ({ useAtomValue: () => mockTheme }))
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'theme',
}))
const CodeField = require('../../../src/components/shared/CodeField').default
beforeEach(() => {
  mockTheme = 'light'
})
it.each([
  '<script>example</script>\nsecond line\n',
  '{"key": "value"}\r\n\r\n',
  '',
  'one\n\nthree',
])('preserves original source text safely', (value) => {
  const { container } = render(<CodeField value={value} />)
  expect(container.querySelector('pre code').textContent).toBe(value)
  expect(container.querySelector('script')).toBeNull()
})
it('switches syntax and follows the current theme', () => {
  const { rerender } = render(<CodeField value={'{"key": true}'} />)
  const pre = screen.getByLabelText('Config payload')
  const background = pre.style.backgroundColor
  fireEvent.change(screen.getByLabelText('Code language'), {
    target: { value: 'yaml' },
  })
  expect(pre.textContent).toBe('{"key": true}')
  mockTheme = 'dark'
  rerender(<CodeField value={'{"key": true}'} />)
  expect(pre.style.backgroundColor).not.toBe(background)
})
it('copies the exact original text and reports clipboard failures', async () => {
  const value = 'unmodified\r\ncontent\n'
  const writeText = jest.fn().mockResolvedValue()
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  render(<CodeField value={value} />)
  fireEvent.click(screen.getByRole('button', { name: 'Copy config content' }))
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Copied'),
  )
  expect(writeText).toHaveBeenCalledWith(value)
  writeText.mockRejectedValue(new Error('denied'))
  fireEvent.click(screen.getByRole('button', { name: 'Copy config content' }))
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Copy failed'),
  )
})
it('renders binary Base64 without syntax guessing', () => {
  render(<CodeField value="/wA=" binary />)
  expect(screen.getByLabelText('Code language')).toBeDisabled()
  expect(screen.getByLabelText('Config payload')).toHaveTextContent('/wA=')
})

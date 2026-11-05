import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
let mockTheme = 'light'
jest.mock('jotai', () => ({ useAtomValue: () => mockTheme }))
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'theme',
}))
const {
  default: CodeField,
  detectCodeLanguage,
} = require('../../../src/components/shared/CodeField')
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

it.each([
  ['{"key": "<html>"}', '.token.property'],
  ['<?xml version="1.0"?><config><key>value</key></config>', '.token.tag'],
  ['<!DOCTYPE html><html><body><br></body></html>', '.token.tag'],
  ['<!-- settings -->\n<config enabled="true" />', '.token.tag'],
  ['key: value\n', '.token.key'],
  ["template: '<html>'", '.token.key'],
  ['message: ordinary text', '.token.key'],
])('automatically highlights the content format: %s', (value, selector) => {
  const { container } = render(<CodeField value={value} />)
  expect(container.querySelector(selector)).not.toBeNull()
  expect(container.querySelector('pre code').textContent).toBe(value)
})
it('uses YAML as fallback and allows plain text override', () => {
  const { container } = render(<CodeField value="enabled: true" />)
  expect(container.querySelector('.token.key')).not.toBeNull()
  fireEvent.change(screen.getByLabelText('Code language'), {
    target: { value: 'plain' },
  })
  expect(container.querySelector('.token.key')).toBeNull()
  expect(screen.getByLabelText('Config payload')).toHaveTextContent(
    'enabled: true',
  )
})

it.each([
  '<!DOCTYPE configuration SYSTEM "config.dtd"><configuration/>',
  '<!DOCTYPE configuration [<!ELEMENT configuration EMPTY>]><configuration/>',
  '<!-- settings -->\n<!DOCTYPE log4j:configuration SYSTEM "log4j.dtd"><log4j:configuration/>',
])('highlights XML with a custom DOCTYPE: %s', (value) => {
  expect(detectCodeLanguage(value)).toBe('markup')
  const { container } = render(<CodeField value={value} />)
  expect(container.querySelector('.token.doctype')).not.toBeNull()
  expect(container.querySelector('pre code').textContent).toBe(value)
})
it.each([
  ['<!-- comment -->\n'.repeat(128) + '<config/>', 'markup'],
  ['<!-- comment -->\n'.repeat(128) + 'key: value', 'yaml'],
  ['<!-- comment -->\n'.repeat(128), 'yaml'],
  ['<!-- unfinished <config/>', 'yaml'],
])(
  'handles leading comments without losing the fallback',
  (value, expected) => {
    expect(detectCodeLanguage(value)).toBe(expected)
  },
)
it('finishes many comments followed by non-markup without exponential backtracking', () => {
  // Isolate the regression so a future blocking regex is terminated by the timeout.
  const { spawnSync } = require('node:child_process')
  const value = '<!-- comment -->\n'.repeat(32) + 'plain text'
  // Coverage adds counters to function.toString(); use the original source instead.
  const source = require('node:fs').readFileSync(
    require.resolve('../../../src/components/shared/CodeField'),
    'utf8',
  )
  const start = source.indexOf('export function detectCodeLanguage')
  const detector = source
    .slice(start, source.indexOf('\n}\n', start) + 2)
    .replace('export ', '')
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `${detector}; process.stdout.write(detectCodeLanguage(${JSON.stringify(value)}))`,
    ],
    { timeout: 2000, encoding: 'utf8' },
  )
  expect(result.error).toBeUndefined()
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
  expect(result.stdout).toBe('yaml')
})

it.each([
  '[]',
  '[1, true, null]',
  'true',
  'false',
  'null',
  '42',
  '-1.5e2',
  '"text"',
  ' \n {"enabled": true}\t',
])('recognizes every JSON top-level value: %s', (value) => {
  expect(detectCodeLanguage(value)).toBe('json')
})
it.each(['{"key":}', '{"key": true,}', '[1,]', 'undefined', 'NaN'])(
  'falls back to YAML for invalid JSON: %s',
  (value) => {
    expect(detectCodeLanguage(value)).toBe('yaml')
  },
)
it.each([
  '<?xml-stylesheet type="text/xsl" href="style.xsl"?><config/>',
  '<?config mode="production"?><config/>',
  '<!-- settings -->\n<?config?><config/>',
  '<配置><名称>example</名称></配置>',
  '<étiquette valeur="exemple"/>',
  '<!DOCTYPE 配置><配置/>',
])('recognizes additional XML beginnings: %s', (value) => {
  expect(detectCodeLanguage(value)).toBe('markup')
})
it('updates automatic highlighting when the content format changes', () => {
  const { container, rerender } = render(<CodeField value={'{"key": true}'} />)
  expect(container.querySelector('.token.property')).not.toBeNull()
  rerender(<CodeField value="key: true" />)
  expect(container.querySelector('.token.key')).not.toBeNull()
  expect(container.querySelector('.token.property')).toBeNull()
  rerender(<CodeField value="<config/>" />)
  expect(container.querySelector('.token.tag')).not.toBeNull()
  expect(container.querySelector('pre code').textContent).toBe('<config/>')
  expect(screen.getByLabelText('Code language')).toHaveValue('auto')
})
it('keeps a manual language across content updates and can resume automatic detection', () => {
  const { container, rerender } = render(<CodeField value={'{"key": true}'} />)
  fireEvent.change(screen.getByLabelText('Code language'), {
    target: { value: 'plain' },
  })
  rerender(<CodeField value="<config/>" />)
  expect(screen.getByLabelText('Code language')).toHaveValue('plain')
  expect(container.querySelector('.token.tag')).toBeNull()
  expect(container.querySelector('pre code').textContent).toBe('<config/>')
  fireEvent.change(screen.getByLabelText('Code language'), {
    target: { value: 'auto' },
  })
  expect(container.querySelector('.token.tag')).not.toBeNull()
})

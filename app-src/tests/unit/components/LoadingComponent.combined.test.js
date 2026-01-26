import { render } from '@testing-library/react'

test('LoadingComponent mounts and shows loading bar', () => {
  const { container } = render(<LoadingComponent />)
  expect(container).toBeTruthy()
  const bar = container.querySelector('.loading-bar')
  expect(bar).toBeTruthy()
  expect(bar.classList.contains('visible')).toBe(true)
})

test('LoadingComponent shows text-light when dark mode active', () => {
  document.body.classList.add('theme-dark')
  const { container } = render(<LoadingComponent />)
  const card = container.querySelector('.loading-card')
  expect(card).toBeTruthy()
  const style = getComputedStyle(card)
  expect(style.color).toBeTruthy()
  document.body.classList.remove('theme-dark')
})

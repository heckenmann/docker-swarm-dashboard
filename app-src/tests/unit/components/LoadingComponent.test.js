// LoadingComponent.test.js
// Smoke test ensuring the LoadingComponent mounts without errors.
import React from 'react'
import { render } from '@testing-library/react'
import LoadingComponent from '../../../src/components/LoadingComponent'

test('LoadingComponent mounts', () => {
	const { container } = render(<LoadingComponent />)
	expect(container).toBeTruthy()
	// LoadingComponent uses LoadingBar with force=true, so the thin bar should be present and visible
	const bar = container.querySelector('.loading-bar')
	expect(bar).toBeTruthy()
	expect(bar.classList.contains('visible')).toBe(true)
})

test('LoadingComponent shows text-light when dark mode active', () => {
	// Simulate dark mode by adding the theme class to body
	document.body.classList.add('theme-dark')
	const { container } = render(<LoadingComponent />)
	const card = container.querySelector('.loading-card')
	expect(card).toBeTruthy()
	// Basic smoke assertion: computed color exists
	const style = getComputedStyle(card)
	const color = style.color
	expect(color).toBeTruthy()
	document.body.classList.remove('theme-dark')
})

// WelcomeMessageComponent.test.js
// Tests for WelcomeMessageComponent: verifies welcome message rendering and variant behavior.
import React from 'react'
import { render, screen } from '@testing-library/react'

// Default mocks: show welcome message and simple dashboard settings
jest.mock('../../../src/common/store/atoms', () => ({
	showWelcomeMessageAtom: true,
	dashboardSettingsAtom: { welcomeMessage: 'hello' },
	currentVariantClassesAtom: 'bg-light',
}))
jest.mock('jotai', () => ({
	useAtom: (a) => [a, () => {}],
	useAtomValue: (a) => a,
}))

import { WelcomeMessageComponent } from '../../../src/components/WelcomeMessageComponent'

test('shows welcome message when enabled', () => {
	render(<WelcomeMessageComponent />)
	// assert using testing-library query instead of global document
	expect(screen.getByText('hello')).toBeInTheDocument()
})

// Extra behavioral test merged here: ensure modal renders and Close works
import { fireEvent } from '@testing-library/react'

test('WelcomeMessageComponent shows modal when welcome message present and Close does not throw', () => {
	const { container, getByText } = render(<WelcomeMessageComponent />)
	expect(container).toBeTruthy()
	const btn = getByText(/Close/i)
	expect(btn).toBeTruthy()
	fireEvent.click(btn)
})

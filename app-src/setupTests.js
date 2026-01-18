// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like: expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom'

// jsdom does not implement HTMLFormElement.requestSubmit yet (used when buttons
// with type="submit" are activated). Provide a small polyfill so tests that
// trigger form submission via button activation don't error.
if (typeof HTMLFormElement !== 'undefined' && !HTMLFormElement.prototype.requestSubmit) {
	HTMLFormElement.prototype.requestSubmit = function (submitter) {
		if (submitter && typeof submitter.click === 'function') {
			submitter.click()
			return
		}
		const event = new Event('submit', { bubbles: true, cancelable: true })
		this.dispatchEvent(event)
	}
}

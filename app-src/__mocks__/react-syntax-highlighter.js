const React = require('react')

function Light(props) {
	return React.createElement('pre', null, props.children)
}

function registerLanguage() {
	// noop for tests
}
// attach as static method so calls like SyntaxHighlighter.registerLanguage(...) succeed
Light.registerLanguage = registerLanguage

module.exports = {
	Light,
	Prism: Light,
	default: Light
}

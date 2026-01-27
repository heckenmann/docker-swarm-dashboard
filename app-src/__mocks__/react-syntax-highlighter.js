const React = require('react')

/**
 * Minimal mock of `react-syntax-highlighter` used in tests.
 * Renders children into a simple <pre> element.
 *
 * @param {{children: any}} props - React props passed to the component
 * @returns {React.Element}
 */
function Light(props) {
  return React.createElement('pre', null, props.children)
}

/**
 * No-op registerLanguage replacement so tests that call
 * `SyntaxHighlighter.registerLanguage(...)` do not fail.
 */
function registerLanguage() {
  // noop for tests
}
// attach as static method so calls like SyntaxHighlighter.registerLanguage(...) succeed
Light.registerLanguage = registerLanguage

module.exports = {
  Light,
  Prism: Light,
  default: Light,
}

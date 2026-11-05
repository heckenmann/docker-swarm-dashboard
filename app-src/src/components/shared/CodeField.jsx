import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Button, Form } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Highlight, themes } from 'prism-react-renderer'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'

/**
 * Read-only highlighted code field; copying preserves the original payload.
 * @param {object} props - Component properties.
 * @param {string} props.value - Complete source text.
 * @param {boolean} [props.binary=false] - Whether the value is Base64 binary data.
 * @returns {React.ReactElement} Code viewer and copy controls.
 */
const CodeField = ({ value, binary = false }) => {
  const variant = useAtomValue(currentVariantAtom)
  const [language, setLanguage] = useState('auto')
  const [copyStatus, setCopyStatus] = useState('')
  let detected = 'plain'
  try {
    JSON.parse(value)
    detected = 'json'
  } catch {
    /* Arbitrary text stays readable without guessing its syntax. */
  }
  const lineEndings = value.match(/\r\n|\r|\n/g) || []
  const syntax = binary ? 'plain' : language === 'auto' ? detected : language
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Copy failed')
    }
  }
  return (
    <div className="border rounded overflow-hidden">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2 bg-body-tertiary border-bottom">
        <Form.Select
          size="sm"
          className="w-auto"
          aria-label="Code language"
          value={binary ? 'plain' : language}
          disabled={binary}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="auto">Auto (JSON / text)</option>
          <option value="plain">Plain text</option>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="markup">XML / HTML</option>
        </Form.Select>
        <div className="d-flex align-items-center gap-2">
          {copyStatus && (
            <span className="small text-muted" role="status">
              {copyStatus}
            </span>
          )}
          <Button
            size="sm"
            variant="outline-secondary"
            aria-label="Copy config content"
            onClick={copy}
          >
            <FontAwesomeIcon icon="copy" className="me-1" />
            Copy
          </Button>
        </div>
      </div>
      <Highlight
        code={value}
        language={syntax}
        theme={variant === 'dark' ? themes.vsDark : themes.github}
      >
        {({ style, tokens, getTokenProps }) => (
          <pre
            className="m-0 p-3 overflow-auto small"
            style={{ ...style, maxHeight: '32rem', tabSize: 2 }}
            role="textbox"
            aria-readonly="true"
            aria-multiline="true"
            tabIndex={0}
            aria-label="Config payload"
          >
            <code>
              {tokens.map((line, index) => (
                <React.Fragment key={index}>
                  {line.map((token, key) => (
                    <span
                      key={key}
                      {...getTokenProps({
                        token: token.empty ? { ...token, content: '' } : token,
                      })}
                    />
                  ))}
                  {lineEndings[index] || null}
                </React.Fragment>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}
CodeField.propTypes = {
  value: PropTypes.string.isRequired,
  binary: PropTypes.bool,
}
export default CodeField

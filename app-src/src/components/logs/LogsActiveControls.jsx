import { useAtom, useAtomValue } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  currentVariantAtom,
  logsConfigAtom,
  logsLinesAtom,
  logsNumberOfLinesAtom,
  logsSearchKeywordAtom,
  logsShowLogsAtom,
} from '../../common/store/atoms'

/**
 * LogsActiveControls renders the controls displayed while logs are active.
 * Shows the selected service name, number-of-lines setting, keyword search,
 * and a button to hide the current log view. Reads and writes Jotai atoms
 * directly; no props required.
 */
function LogsActiveControls() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const logsConfig = useAtomValue(logsConfigAtom)
  const [logsNumberOfLines, setLogsNumberOfLines] = useAtom(
    logsNumberOfLinesAtom,
  )
  const [searchKeyword, setSearchKeyword] = useAtom(logsSearchKeywordAtom)

  const resetLogsLines = useResetAtom(logsLinesAtom)
  const [, setLogsConfig] = useAtom(logsConfigAtom)
  const [, setLogsShowLogs] = useAtom(logsShowLogsAtom)

  const hideLogs = () => {
    // Preserve form atom values so the form remains populated when
    // reopening the logs UI. Only hide the logs output and clear
    // the live lines/config used for the current view.
    resetLogsLines()
    setLogsConfig(null)
    setLogsShowLogs(false)
  }

  return (
    <Form>
      <Form.Group as={Row} className="mb-3" controlId="logprinterservicename">
        <Form.Label column sm="2">
          Service
        </Form.Label>
        <Col sm="10">
          <Form.Control
            type="text"
            defaultValue={logsConfig?.serviceName}
            disabled={true}
          />
          <Form.Text
            className={
              currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
            }
          >
            Selected service for which logs are shown.
          </Form.Text>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="logprinternumberoflines">
        <Form.Label column sm="2">
          Number of lines
        </Form.Label>
        <Col sm="10">
          <Form.Control
            type="text"
            value={logsNumberOfLines}
            onChange={(e) => setLogsNumberOfLines(Number(e.target.value) || 0)}
          />
          <Form.Text
            className={
              currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
            }
          >
            How many of the most recent log lines to display (like --tail).
          </Form.Text>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="logprinterkeyword">
        <Form.Label column sm="2">
          Search keyword
        </Form.Label>
        <Col sm="10">
          <InputGroup>
            <Form.Control
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Filter log lines…"
              aria-label="Search log lines"
            />
            {searchKeyword && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearchKeyword('')}
                aria-label="Clear search keyword"
              >
                <FontAwesomeIcon icon="times" />
              </Button>
            )}
          </InputGroup>
          <Form.Text
            className={
              currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
            }
          >
            Filter log lines containing this keyword (client-side,
            case-insensitive).
          </Form.Text>
        </Col>
      </Form.Group>

      <Form.Group as={Row}>
        <Col sm={{ span: 10, offset: 2 }}>
          <Button type="button" onClick={hideLogs}>
            <FontAwesomeIcon icon="align-left" /> Hide logs
          </Button>
        </Col>
      </Form.Group>
    </Form>
  )
}

LogsActiveControls.propTypes = {}

export { LogsActiveControls }

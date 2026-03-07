import { useAtom, useAtomValue } from 'jotai'
import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  currentVariantAtom,
  logsServicesAtom,
  logsFormServiceIdAtom,
  logsFormServiceNameAtom,
  logsFormTailAtom,
  logsFormSinceAtom,
  logsFormSinceErrorAtom,
  logsFormSinceAmountAtom,
  logsFormSinceUnitAtom,
  logsFormSinceIsISOAtom,
  logsFormShowAdvancedAtom,
  logsFormFollowAtom,
  logsFormTimestampsAtom,
  logsFormStdoutAtom,
  logsFormStderrAtom,
  logsFormDetailsAtom,
  logsSearchKeywordAtom,
  logsNumberOfLinesAtom,
  logsConfigAtom,
  logsShowLogsAtom,
} from '../../common/store/atoms'
import { isValidSince } from './logsUtils'
import { SinceInput } from './SinceInput'
import { useState } from 'react'

/**
 * LogsSetupForm renders the initial log configuration form shown before logs are active.
 * Manages service selection, tail, since, follow, and advanced options.
 * Reads and writes Jotai atoms directly; no props required.
 */
function LogsSetupForm() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const services = useAtomValue(logsServicesAtom)

  const [serviceId, setServiceId] = useAtom(logsFormServiceIdAtom)
  const [serviceName, setServiceName] = useAtom(logsFormServiceNameAtom)
  const [tail, setTail] = useAtom(logsFormTailAtom)
  const [since, setSince] = useAtom(logsFormSinceAtom)
  const [, setSinceError] = useAtom(logsFormSinceErrorAtom)
  const [, setSinceAmount] = useAtom(logsFormSinceAmountAtom)
  const [, setSinceUnit] = useAtom(logsFormSinceUnitAtom)
  const [, setSinceIsISO] = useAtom(logsFormSinceIsISOAtom)
  const [showAdvanced, setShowAdvanced] = useAtom(logsFormShowAdvancedAtom)
  const [followVal, setFollowVal] = useAtom(logsFormFollowAtom)
  const [timestampsVal, setTimestampsVal] = useAtom(logsFormTimestampsAtom)
  const [stdoutVal, setStdoutVal] = useAtom(logsFormStdoutAtom)
  const [stderrVal, setStderrVal] = useAtom(logsFormStderrAtom)
  const [detailsVal, setDetailsVal] = useAtom(logsFormDetailsAtom)
  const [, setSearchKeyword] = useAtom(logsSearchKeywordAtom)
  const [, setLogsNumberOfLines] = useAtom(logsNumberOfLinesAtom)
  const [, setLogsConfig] = useAtom(logsConfigAtom)
  const [, setLogsShowLogs] = useAtom(logsShowLogsAtom)

  const [_serviceHighlightIndex, setServiceHighlightIndex] = useState(-1)

  const serviceOptions = []
  const serviceNames = {}
  services.forEach((service) => {
    serviceNames[service['ID']] = service['Name']
    serviceOptions.push(
      <option key={'serviceDropdown-' + service['ID']} value={service['ID']}>
        {service['Name']} ({service['ID']})
      </option>,
    )
  })

  const isServiceSelected = Boolean(serviceId)

  const showLogs = () => {
    const tailNum = Number(tail) || 20
    setLogsNumberOfLines(tailNum)
    if (!isValidSince(since)) {
      setSinceError('Invalid value. Use e.g. 5m, 1h or an ISO timestamp')
      return
    }
    setSinceError(false)
    const newLogsConfig = {
      serviceId: serviceId,
      serviceName: serviceName || serviceNames[serviceId],
      tail: String(tailNum),
      since: since,
      follow: followVal,
      timestamps: timestampsVal,
      stdout: stdoutVal,
      stderr: stderrVal,
      details: detailsVal,
    }
    setLogsConfig(newLogsConfig)
    setLogsShowLogs(true)
  }

  const clearForm = () => {
    setServiceId('')
    setServiceName('')
    setTail('20')
    setSince('1h')
    setSinceAmount('1')
    setSinceUnit('h')
    setSinceIsISO(false)
    setSinceError(false)
    setFollowVal(false)
    setTimestampsVal(false)
    setStdoutVal(true)
    setStderrVal(true)
    setDetailsVal(false)
    setSearchKeyword('')
  }

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault()
        showLogs()
      }}
    >
      <Form.Group as={Row} className="mb-3" controlId="logsformservice">
        <Form.Label column sm="2">
          Service
        </Form.Label>
        <Col sm="10">
          <Form.Select
            value={serviceId}
            onChange={(e) => {
              const id = e.target.value
              setServiceId(id)
              setServiceName(serviceNames[id] || '')
              setServiceHighlightIndex(-1)
            }}
            aria-label="Select service"
          >
            <option value="">-- Select service --</option>
            {serviceOptions}
          </Form.Select>
          <Form.Text
            className={
              currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
            }
          >
            Select the service to retrieve logs from (Docker service
            identifier).
          </Form.Text>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="logsformtail">
        <Form.Label column sm="2">
          Tail
        </Form.Label>
        <Col sm="10">
          <InputGroup className="w-auto">
            <Form.Control
              type="number"
              min="1"
              value={tail}
              onChange={(e) => setTail(e.target.value)}
              aria-label="Number of lines"
            />
            <InputGroup.Text>lines</InputGroup.Text>
          </InputGroup>
          <Form.Text
            className={
              currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
            }
          >
            Number of most recent log lines to show (similar to Docker&apos;s
            --tail option).
          </Form.Text>
        </Col>
      </Form.Group>

      <SinceInput />

      <Form.Group as={Row} className="mb-3" controlId="logsformfollow">
        <Form.Label column sm="2">
          Follow
        </Form.Label>
        <Col sm="10">
          <Form.Check
            type="switch"
            checked={followVal}
            onChange={(e) => setFollowVal(e.target.checked)}
          />
          <Form.Text
            className={
              currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
            }
          >
            Stream logs in real-time (like docker logs -f).
          </Form.Text>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Col sm={{ span: 10, offset: 2 }}>
          <Button
            variant="link"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            aria-controls="advanced-options"
          >
            <FontAwesomeIcon icon="chevron-right" className="me-2" />
            {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
          </Button>
        </Col>
      </Form.Group>

      {showAdvanced && (
        <div id="advanced-options">
          <Form.Group as={Row} className="mb-3" controlId="logsformtimestamps">
            <Form.Label column sm="2">
              Timestamps
            </Form.Label>
            <Col sm="10">
              <Form.Check
                type="switch"
                checked={timestampsVal}
                onChange={(e) => setTimestampsVal(e.target.checked)}
              />
              <Form.Text
                className={
                  currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
                }
              >
                Include timestamps for each log line.
              </Form.Text>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="logsformstdout">
            <Form.Label column sm="2">
              Stdout
            </Form.Label>
            <Col sm="10">
              <Form.Check
                type="switch"
                checked={stdoutVal}
                onChange={(e) => setStdoutVal(e.target.checked)}
              />
              <Form.Text
                className={
                  currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
                }
              >
                Include standard output stream (stdout).
              </Form.Text>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="logsformstderr">
            <Form.Label column sm="2">
              Stderr
            </Form.Label>
            <Col sm="10">
              <Form.Check
                type="switch"
                checked={stderrVal}
                onChange={(e) => setStderrVal(e.target.checked)}
              />
              <Form.Text
                className={
                  currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
                }
              >
                Include standard error stream (stderr).
              </Form.Text>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="logsformdetails">
            <Form.Label column sm="2">
              Details
            </Form.Label>
            <Col sm="10">
              <Form.Check
                type="switch"
                checked={detailsVal}
                onChange={(e) => setDetailsVal(e.target.checked)}
              />
              <Form.Text
                className={
                  currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
                }
              >
                Include additional metadata/details (e.g., task and container
                IDs).
              </Form.Text>
            </Col>
          </Form.Group>
        </div>
      )}

      <Form.Group as={Row}>
        <Col sm={{ span: 10, offset: 2 }}>
          <Button
            type="submit"
            disabled={!isServiceSelected}
            variant="primary"
            className="me-2"
            aria-disabled={!isServiceSelected}
            title={
              !isServiceSelected ? 'Select a valid service first' : 'Show logs'
            }
          >
            <FontAwesomeIcon icon="desktop" /> Show logs
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={clearForm}
            aria-label="Clear form"
          >
            <FontAwesomeIcon icon="eraser" className="me-1" /> Clear
          </Button>
        </Col>
      </Form.Group>
    </Form>
  )
}

LogsSetupForm.propTypes = {}

export { LogsSetupForm }

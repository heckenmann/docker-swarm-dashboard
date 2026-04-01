import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Row, Col, Form, Button, InputGroup, ListGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import { logsServicesAtom } from '../../common/store/atoms/dashboardAtoms'
import {
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
  logsConfigAtom,
  logsShowLogsAtom,
  logsNumberOfLinesAtom,
} from '../../common/store/atoms/logsAtoms'
import { isValidSince } from './logsUtils'
import SinceInput from './SinceInput.jsx'

/**
 * LogsSetupForm renders the initial log configuration form shown before logs are active.
 * Manages service selection, tail, since, follow, and advanced options.
 * Reads and writes Jotai atoms directly; no props required.
 */
const LogsSetupForm = React.memo(function LogsSetupForm() {
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

  const [serviceSearch, setServiceSearch] = useState('')

  const serviceNames = {}
  services.forEach((service) => {
    serviceNames[service['ID']] = service['Name']
  })
  const filteredServices = serviceSearch
    ? services.filter(
        (s) =>
          s['ID'] === serviceId ||
          s['Name'].toLowerCase().includes(serviceSearch.toLowerCase()),
      )
    : services

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
    setServiceSearch('')
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
          <InputGroup className="mb-2">
            <InputGroup.Text>
              <FontAwesomeIcon icon="search" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder={`Filter ${services.length} service${services.length !== 1 ? 's' : ''}\u2026`}
              value={serviceSearch}
              onChange={(e) => {
                setServiceSearch(e.target.value)
                if (serviceId) {
                  setServiceId('')
                  setServiceName('')
                }
              }}
              aria-label="Search services"
            />
            {serviceSearch && (
              <Button
                variant="outline-secondary"
                onClick={() => setServiceSearch('')}
                aria-label="Clear service search"
                tabIndex={-1}
              >
                <FontAwesomeIcon icon="times" />
              </Button>
            )}
          </InputGroup>
          {serviceId && !serviceSearch ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setServiceId('')
                setServiceName('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setServiceId('')
                  setServiceName('')
                }
              }}
              aria-label="Change service"
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded border mb-1 ${
                currentVariant === 'dark'
                  ? 'border-secondary text-secondary'
                  : 'border-secondary-subtle text-muted'
              }`}
              style={{ fontSize: '0.875rem', cursor: 'pointer' }}
            >
              <FontAwesomeIcon
                icon="check"
                style={{ color: 'var(--bs-success)' }}
              />
              <strong>{serviceName || serviceNames[serviceId]}</strong>
              <span className="font-monospace text-muted ms-auto">
                {serviceId}
              </span>
              <FontAwesomeIcon
                icon="pencil-alt"
                className="ms-2 text-muted"
                style={{ fontSize: '0.75em' }}
              />
            </div>
          ) : (
            <ListGroup
              style={{ maxHeight: '14rem', overflowY: 'auto' }}
              aria-label="Select service"
            >
              {filteredServices.length === 0 ? (
                <ListGroup.Item disabled className="text-muted fst-italic">
                  {serviceSearch
                    ? `No services match \u201c${serviceSearch}\u201d`
                    : 'No services available'}
                </ListGroup.Item>
              ) : (
                filteredServices.map((service) => (
                  <ListGroup.Item
                    key={'serviceList-' + service['ID']}
                    action
                    active={serviceId === service['ID']}
                    onClick={() => {
                      setServiceId(service['ID'])
                      setServiceName(service['Name'])
                      setServiceSearch('')
                    }}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{service['Name']}</span>
                    <span
                      className={`font-monospace ms-3 ${
                        serviceId === service['ID']
                          ? 'opacity-75'
                          : 'text-muted'
                      }`}
                      style={{ fontSize: '0.8em' }}
                    >
                      {service['ID']}
                    </span>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          )}
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
        <Col sm={{ span: 10, offset: 2 }}>
          <Form.Check
            type="switch"
            label="Follow"
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
            <Col sm={{ span: 10, offset: 2 }}>
              <Form.Check
                type="switch"
                label="Timestamps"
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
            <Col sm={{ span: 10, offset: 2 }}>
              <Form.Check
                type="switch"
                label="Stdout"
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
            <Col sm={{ span: 10, offset: 2 }}>
              <Form.Check
                type="switch"
                label="Stderr"
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
            <Col sm={{ span: 10, offset: 2 }}>
              <Form.Check
                type="switch"
                label="Details"
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
})

LogsSetupForm.propTypes = {}

export default LogsSetupForm

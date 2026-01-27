import { useAtom, useAtomValue } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import {
  Row,
  Col,
  Form,
  Button,
  Card,
  InputGroup,
  ButtonGroup,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  logsConfigAtom,
  logsLinesAtom,
  logsNumberOfLinesAtom,
  logsMessageMaxLenAtom,
  logsServicesAtom,
  logsShowLogsAtom,
  logsWebsocketUrlAtom,
  logsFormServiceIdAtom,
  logsFormServiceNameAtom,
  logsFormTailAtom,
  logsFormSinceAtom,
  logsFormSinceErrorAtom,
  logsFormShowAdvancedAtom,
  logsFormSinceAmountAtom,
  logsFormSinceUnitAtom,
  logsFormSinceIsISOAtom,
  logsFormFollowAtom,
  logsFormTimestampsAtom,
  logsFormStdoutAtom,
  logsFormStderrAtom,
  logsFormDetailsAtom,
} from '../common/store/atoms'
import useWebSocket from 'react-use-websocket'
import { useEffect, useCallback, useState } from 'react'

export function isValidSince(s) {
  if (!s) return false
  if (/^\d+[smhd]$/.test(s)) return true
  const d = Date.parse(s)
  return !Number.isNaN(d)
}

/**
 * LogsComponent is a React functional component that handles the display and management
 * of log data. It uses various atoms from Jotai for state management and connects to a
 * WebSocket to receive log messages in real-time.
 */
function LogsComponent() {
  const [logsLines, setLogsLines] = useAtom(logsLinesAtom)
  const resetLogsLines = useResetAtom(logsLinesAtom)
  const [logsNumberOfLines, setLogsNumberOfLines] = useAtom(
    logsNumberOfLinesAtom,
  )
  const logsMessageMaxLen = useAtomValue(logsMessageMaxLenAtom)
  const [logsShowLogs, setLogsShowLogs] = useAtom(logsShowLogsAtom)
  const [logsConfig, setLogsConfig] = useAtom(logsConfigAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const logsWebsocketUrl = useAtomValue(logsWebsocketUrlAtom)
  // will define shouldReconnect below and call useWebSocket after
  // Syntax highlighting removed — use plain rendering for logs

  const shouldReconnect = useCallback(() => {
    return Boolean(logsShowLogs && logsConfig?.follow)
  }, [logsShowLogs, logsConfig?.follow])

  const { lastMessage } = useWebSocket(
    logsWebsocketUrl,
    {
      onOpen: () => console.log('logger-websocket connected'),
      onClose: () => console.log('logger-websocket closed'),
      shouldReconnect: shouldReconnect,
    },
    logsShowLogs,
  )

  // Controlled inputs (persisted in atoms so they survive navigation)
  const [serviceId, setServiceId] = useAtom(logsFormServiceIdAtom)
  const [serviceName, setServiceName] = useAtom(logsFormServiceNameAtom)
  const [tail, setTail] = useAtom(logsFormTailAtom)
  const [since, setSince] = useAtom(logsFormSinceAtom)
  const [sinceError, setSinceError] = useAtom(logsFormSinceErrorAtom)
  const [showAdvanced, setShowAdvanced] = useAtom(logsFormShowAdvancedAtom)
  // serviceSearch state removed (not used); keep code simple
  const [_serviceHighlightIndex, setServiceHighlightIndex] = useState(-1)
  const [followVal, setFollowVal] = useAtom(logsFormFollowAtom)
  const [timestampsVal, setTimestampsVal] = useAtom(logsFormTimestampsAtom)
  const [stdoutVal, setStdoutVal] = useAtom(logsFormStdoutAtom)
  const [stderrVal, setStderrVal] = useAtom(logsFormStderrAtom)
  const [detailsVal, setDetailsVal] = useAtom(logsFormDetailsAtom)
  const [sinceAmount, setSinceAmount] = useAtom(logsFormSinceAmountAtom)
  const [sinceUnit, setSinceUnit] = useAtom(logsFormSinceUnitAtom)
  const [sinceIsISO, setSinceIsISO] = useAtom(logsFormSinceIsISOAtom)
  useEffect(() => {
    if (!lastMessage) return
    let raw
    try {
      raw = lastMessage.data
    } catch {
      return
    }
    let message
    if (typeof raw === 'string') message = raw
    else {
      try {
        message = JSON.stringify(raw)
      } catch {
        message = String(raw)
      }
    }
    const maxLen = Number(logsMessageMaxLen) || 10000
    if (message.length > maxLen) message = message.slice(0, maxLen) + '...'
    setLogsLines((prev) => {
      const cap = Math.max(2 * Number(logsNumberOfLines) || 20, 20)
      const out = [...prev, message].slice(-cap)
      return out
    })
  }, [lastMessage, logsNumberOfLines, logsMessageMaxLen, setLogsLines])

  const hideLogs = () => {
    // Preserve form atom values so the form remains populated when
    // reopening the logs UI. Only hide the logs output and clear
    // the live lines/config used for the current view.
    resetLogsLines()
    setLogsConfig(null)
    setLogsShowLogs(false)
  }

  const clearForm = () => {
    setServiceId('')
    setServiceName('')
    setTail('20')
    setSince('1h')
    setFollowVal(false)
    setTimestampsVal(false)
    setStdoutVal(true)
    setStderrVal(true)
    setDetailsVal(false)
  }

  // use the module-level `isValidSince` exported above

  const showLogs = () => {
    // validate tail
    const tailNum = Number(tail) || 20
    setLogsNumberOfLines(tailNum)
    // validate since
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

  const serviceOptions = []
  const serviceNames = {}

  const services = useAtomValue(logsServicesAtom)
  services.forEach((service) => {
    serviceNames[service['ID']] = service['Name']
    serviceOptions.push(
      <option key={'serviceDropdown-' + service['ID']} value={service['ID']}>
        {service['Name']} ({service['ID']})
      </option>,
    )
  })

  // service search is supported via `serviceSearch`, `serviceNames` and `serviceOptions`.
  // A filtered list was previously computed but is unused; keeping hook dependencies
  // minimal avoids unused-variable warnings.
  const isServiceSelected = Boolean(serviceId)
  const logPrinterOptions = (
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
          <Form.Control type="text" disabled={true} />
          <Form.Text
            className={
              currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
            }
          >
            Filter log lines containing this keyword (client-side filter).
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

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Body>
        {!logsShowLogs && (
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              showLogs()
            }}
          >
            <Card.Header className={`mb-3 ${currentVariantClasses}`}>
              <strong>Logs</strong>
              <div
                className={`small ${currentVariant === 'dark' ? 'text-secondary' : 'text-muted'}`}
              >
                Choose a service and options
              </div>
            </Card.Header>
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
                  Number of most recent log lines to show (similar to Docker's
                  --tail option).
                </Form.Text>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="logsformsince">
              <Form.Label column sm="2">
                Since
              </Form.Label>
              <Col sm="10">
                <div className="d-flex align-items-center gap-2 w-100 flex-nowrap">
                  {!sinceIsISO ? (
                    <>
                      <Form.Control
                        type="number"
                        min="1"
                        value={sinceAmount}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '')
                          setSinceAmount(v)
                          setSince(`${v}${sinceUnit}`)
                          setSinceError(false)
                        }}
                        aria-label="Since amount"
                        isInvalid={!!sinceError}
                        className="me-2 w-auto"
                      />
                      <ButtonGroup aria-label="Since units">
                        {[
                          { k: 's', label: 's (seconds)' },
                          { k: 'm', label: 'm (minutes)' },
                          { k: 'h', label: 'h (hours)' },
                          { k: 'd', label: 'd (days)' },
                        ].map((u) => (
                          <Button
                            key={u.k}
                            variant={
                              sinceUnit === u.k
                                ? 'primary'
                                : 'outline-secondary'
                            }
                            onClick={() => {
                              setSinceUnit(u.k)
                              setSince(`${sinceAmount}${u.k}`)
                              setSinceError(false)
                            }}
                          >
                            {u.label}
                          </Button>
                        ))}
                      </ButtonGroup>
                      <ButtonGroup aria-label="Since presets">
                        {['5m', '15m', '1h', '6h', '24h'].map((p) => {
                          const match = p.match(/^(\d+)([smhd])$/)
                          return (
                            <Button
                              key={p}
                              variant="outline-secondary"
                              onClick={() => {
                                setSinceAmount(match[1])
                                setSinceUnit(match[2])
                                setSince(p)
                                setSinceError(false)
                              }}
                            >
                              {p}
                            </Button>
                          )
                        })}
                      </ButtonGroup>
                    </>
                  ) : (
                    <Form.Control
                      type="text"
                      value={since}
                      onChange={(e) => {
                        setSince(e.target.value)
                        setSinceError(false)
                      }}
                      onBlur={() => {
                        if (!isValidSince(since))
                          setSinceError('Invalid ISO timestamp')
                      }}
                      placeholder="2023-01-01T12:00:00Z"
                      isInvalid={!!sinceError}
                      className="w-100"
                    />
                  )}

                  <Button
                    variant="outline-secondary"
                    className="ms-2 flex-shrink-0"
                    aria-pressed={sinceIsISO}
                    aria-label={
                      sinceIsISO ? 'Switch to duration' : 'Switch to ISO'
                    }
                    onClick={() =>
                      setSinceIsISO((v) => {
                        const newV = !v
                        if (newV) {
                          const iso24 = new Date(
                            Date.now() - 24 * 60 * 60 * 1000,
                          ).toISOString()
                          setSince(iso24)
                        } else {
                          setSince(`${sinceAmount}${sinceUnit}`)
                        }
                        setSinceError(false)
                        return newV
                      })
                    }
                  >
                    <FontAwesomeIcon
                      icon={sinceIsISO ? 'clock' : 'calendar'}
                      className="me-1"
                    />
                    {sinceIsISO ? 'Use duration' : 'Use ISO'}
                  </Button>
                </div>
                {sinceError && (
                  <div className="invalid-feedback d-block">{sinceError}</div>
                )}
                <Form.Text
                  className={
                    currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
                  }
                >
                  Show logs since the given duration (e.g. "1h") or ISO
                  timestamp. Matches Docker's --since behavior. See{' '}
                  <a
                    href="https://docs.docker.com/engine/reference/commandline/cli/#filtering"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Docker docs
                  </a>
                  .
                </Form.Text>
              </Col>
            </Form.Group>
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
                  {showAdvanced
                    ? 'Hide advanced options'
                    : 'Show advanced options'}
                </Button>
              </Col>
            </Form.Group>
            {showAdvanced && (
              <div id="advanced-options">
                <Form.Group
                  as={Row}
                  className="mb-3"
                  controlId="logsformtimestamps"
                >
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
                        currentVariant === 'dark'
                          ? 'text-secondary'
                          : 'text-muted'
                      }
                    >
                      Include timestamps for each log line.
                    </Form.Text>
                  </Col>
                </Form.Group>
                <Form.Group
                  as={Row}
                  className="mb-3"
                  controlId="logsformstdout"
                >
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
                        currentVariant === 'dark'
                          ? 'text-secondary'
                          : 'text-muted'
                      }
                    >
                      Include standard output stream (stdout).
                    </Form.Text>
                  </Col>
                </Form.Group>
                <Form.Group
                  as={Row}
                  className="mb-3"
                  controlId="logsformstderr"
                >
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
                        currentVariant === 'dark'
                          ? 'text-secondary'
                          : 'text-muted'
                      }
                    >
                      Include standard error stream (stderr).
                    </Form.Text>
                  </Col>
                </Form.Group>
                <Form.Group
                  as={Row}
                  className="mb-3"
                  controlId="logsformdetails"
                >
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
                        currentVariant === 'dark'
                          ? 'text-secondary'
                          : 'text-muted'
                      }
                    >
                      Include additional metadata/details (e.g., task and
                      container IDs).
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
                    !isServiceSelected
                      ? 'Select a valid service first'
                      : 'Show logs'
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
        )}
        {logsShowLogs && logPrinterOptions}
      </Card.Body>
      {logsShowLogs && (
        <div
          className={`p-2 border-top border-secondary overflow-auto ${currentVariantClasses}`}
          aria-live="polite"
          aria-label="Log output"
        >
          <div className="font-monospace small">
            {/** Render only last N lines for performance */}
            {logsLines
              ?.slice(-Number(logsNumberOfLines || tail || 100))
              .map((l, i) => {
                const isErr = /stderr|error|ERROR/.test(l)
                return (
                  <div
                    key={i}
                    className={isErr ? 'text-danger fw-semibold' : undefined}
                  >
                    {l}
                  </div>
                )
              })}
          </div>
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline-secondary"
              className="me-2"
              onClick={() => {
                navigator.clipboard?.writeText(logsLines?.join('\n') || '')
              }}
            >
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                const blob = new Blob([logsLines?.join('\n') || ''], {
                  type: 'text/plain',
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${serviceName || serviceId || 'logs'}.log`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

LogsComponent.propTypes = {}

export { LogsComponent }

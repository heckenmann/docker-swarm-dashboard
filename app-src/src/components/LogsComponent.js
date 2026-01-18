import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom, useAtomValue } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  currentSyntaxHighlighterStyleAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  logsConfigAtom,
  logsLinesAtom,
  logsNumberOfLinesAtom,
  logsServicesAtom,
  logsShowLogsAtom,
  logsWebsocketUrlAtom,
} from '../common/store/atoms'
import useWebSocket from 'react-use-websocket'
import { useEffect, useRef } from 'react'

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
  const resetLogsNumberOfLines = useResetAtom(logsNumberOfLinesAtom)
  const [logsShowLogs, setLogsShowLogs] = useAtom(logsShowLogsAtom)
  const [logsConfig, setLogsConfig] = useAtom(logsConfigAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const logsWebsocketUrl = useAtomValue(logsWebsocketUrlAtom)
  const { lastMessage } = useWebSocket(
    logsWebsocketUrl,
    {
      onOpen: () => console.log('logger-websocket connected'),
      onClose: () => console.log('logger-websocket closed'),
      shouldReconnect: () => logsShowLogs && logsConfig?.follow,
    },
    logsShowLogs,
  )
  const currentSyntaxHighlighterStyle = useAtomValue(
    currentSyntaxHighlighterStyleAtom,
  )

  // Inputs
  let inputServiceId
  let inputTail
  let inputSince
  let inputFollow
  let inputTimestamps
  let inputStdout
  let inputStderr
  let inputDetails

  // Ring buffer for incoming log lines to reduce copy/GC churn under high
  // message throughput. We collect incoming messages into a mutable buffer
  // and flush to React state in a coalesced tick.
  // Start with a safe default capacity; the effect below will resize the
  // buffer if `logsNumberOfLines` differs. Avoid coercing `logsNumberOfLines`
  // during render because test environments may provide non-primitive
  // placeholders transiently.
  const bufferRef = useRef({ arr: [], start: 0, size: 0, capacity: 20 })
  const flushTimerRef = useRef(null)

  // Helper: flush buffer content into the logsLines atom
  const flushBuffer = () => {
    const buf = bufferRef.current
    const out = []
    for (let i = 0; i < buf.size; i++) {
      out.push(buf.arr[(buf.start + i) % buf.capacity])
    }
    setLogsLines(out)
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
  }

  useEffect(() => {
    if (lastMessage === null) return

    const buf = bufferRef.current
    const cap = Number(logsNumberOfLines) || 20

    // If capacity changed, reallocate preserving most recent entries
    if (buf.capacity !== cap) {
      const newArr = new Array(cap)
      const take = Math.min(buf.size, cap)
      // copy last `take` entries
      for (let i = 0; i < take; i++) {
        newArr[i] = buf.arr[(buf.start + buf.size - take + i) % buf.capacity]
      }
      buf.arr = newArr
      buf.start = 0
      buf.size = take
      buf.capacity = cap
    }

    // push new message into ring buffer
    const message = lastMessage.data
    if (buf.size < buf.capacity) {
      const idx = (buf.start + buf.size) % buf.capacity
      buf.arr[idx] = message
      buf.size += 1
    } else {
      // overwrite oldest
      buf.arr[buf.start] = message
      buf.start = (buf.start + 1) % buf.capacity
    }

    // schedule a coalesced flush on next tick if not already scheduled
    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(() => flushBuffer(), 0)
    }

    // cleanup on unmount
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
    }
  }, [lastMessage, logsNumberOfLines, setLogsLines])

  const hideLogs = () => {
    resetLogsLines()
    setLogsConfig(null)
    setLogsShowLogs(false)
  }

  const showLogs = () => {
  const tailVal = inputTail?.value
  if (tailVal && Number(tailVal) > 0) setLogsNumberOfLines(Number(tailVal))
  else setLogsNumberOfLines(20)
    const newLogsConfig = {
      serviceId: inputServiceId.value,
      serviceName: serviceNames[inputServiceId.value],
      tail: inputTail.value,
      since: inputSince.value,
      follow: inputFollow.checked,
      timestamps: inputTimestamps.checked,
      stdout: inputStdout.checked,
      stderr: inputStderr.checked,
      details: inputDetails.checked,
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
        {service['Name']}
      </option>,
    )
  })

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
            onChange={(e) => setLogsNumberOfLines(e.target.value)}
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="logprinterkeyword">
        <Form.Label column sm="2">
          Search keyword
        </Form.Label>
        <Col sm="10">
          <Form.Control type="text" disabled={true} />
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
          <Form onSubmit={showLogs}>
            <Form.Group as={Row} className="mb-3" controlId="logsformservice">
              <Form.Label column sm="2">
                Service
              </Form.Label>
              <Col sm="10">
                <Form.Control
                  as="select"
                  ref={(node) => (inputServiceId = node)}
                >
                  {serviceOptions}
                </Form.Control>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="logsformtail">
              <Form.Label column sm="2">
                Tail
              </Form.Label>
              <Col sm="10">
                <Form.Control
                  type="text"
                  defaultValue="20"
                  ref={(node) => (inputTail = node)}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="logsformsince">
              <Form.Label column sm="2">
                Since
              </Form.Label>
              <Col sm="10">
                <Form.Control
                  type="text"
                  defaultValue="1h"
                  ref={(node) => (inputSince = node)}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="logsformfollow">
              <Form.Label column sm="2">
                Follow
              </Form.Label>
              <Col sm="10">
                <Form.Check ref={(node) => (inputFollow = node)} />
              </Col>
            </Form.Group>
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
                  defaultChecked={false}
                  ref={(node) => (inputTimestamps = node)}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="logsformstdout">
              <Form.Label column sm="2">
                Stdout
              </Form.Label>
              <Col sm="10">
                <Form.Check
                  defaultChecked={true}
                  ref={(node) => (inputStdout = node)}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="logsformstderr">
              <Form.Label column sm="2">
                Stderr
              </Form.Label>
              <Col sm="10">
                <Form.Check
                  defaultChecked={true}
                  ref={(node) => (inputStderr = node)}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="logsformdetails">
              <Form.Label column sm="2">
                Details
              </Form.Label>
              <Col sm="10">
                <Form.Check
                  defaultChecked={false}
                  ref={(node) => (inputDetails = node)}
                />
              </Col>
            </Form.Group>

            <Form.Group as={Row}>
              <Col sm={{ span: 10, offset: 2 }}>
                <Button
                  type="submit"
                  disabled={!serviceOptions || serviceOptions.length === 0}
                >
                  <FontAwesomeIcon icon="desktop" /> Show logs
                </Button>
              </Col>
            </Form.Group>
          </Form>
        )}
        {logsShowLogs && logPrinterOptions}
      </Card.Body>
      {logsShowLogs && (
        <SyntaxHighlighter style={currentSyntaxHighlighterStyle}>
          {logsLines?.join('\n')}
        </SyntaxHighlighter>
      )}
    </Card>
  )
}

export { LogsComponent }

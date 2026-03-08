import { useAtom, useAtomValue } from 'jotai'
import { Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  logsConfigAtom,
  logsLinesAtom,
  logsNumberOfLinesAtom,
  logsMessageMaxLenAtom,
  logsShowLogsAtom,
  logsWebsocketUrlAtom,
} from '../../common/store/atoms'
import useWebSocket from 'react-use-websocket'
import { useEffect, useCallback } from 'react'
import { LogsSetupForm } from './LogsSetupForm'
import { LogsActiveControls } from './LogsActiveControls'
import { LogsOutput } from './LogsOutput'

// Re-export for consumers that import isValidSince from this module
export { isValidSince } from './logsUtils'

/**
 * LogsComponent is the top-level orchestrator for the Logs view.
 * It manages the WebSocket connection and incoming message buffering,
 * then delegates rendering to LogsSetupForm, LogsActiveControls and LogsOutput.
 */
function LogsComponent() {
  const [, setLogsLines] = useAtom(logsLinesAtom)
  const logsNumberOfLines = useAtomValue(logsNumberOfLinesAtom)
  const logsMessageMaxLen = useAtomValue(logsMessageMaxLenAtom)
  const [logsShowLogs] = useAtom(logsShowLogsAtom)
  const logsConfig = useAtomValue(logsConfigAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const logsWebsocketUrl = useAtomValue(logsWebsocketUrlAtom)

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

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      {!logsShowLogs && (
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FontAwesomeIcon icon="desktop" className="me-2" />
            <strong>Logs</strong>
          </div>
          <div className="text-muted">Choose a service and options</div>
        </Card.Header>
      )}
      <Card.Body>
        {!logsShowLogs && <LogsSetupForm />}
        {logsShowLogs && <LogsActiveControls />}
      </Card.Body>
      {logsShowLogs && <LogsOutput />}
    </Card>
  )
}

LogsComponent.propTypes = {}

export { LogsComponent }

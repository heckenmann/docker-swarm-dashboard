import React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Card } from 'react-bootstrap'
import useWebSocket from 'react-use-websocket'
import { useCallback } from 'react'
import {
  logsConfigAtom,
  logsErrorAtom,
  logsLinesAtom,
  logsNumberOfLinesAtom,
  logsMessageMaxLenAtom,
  logsShowLogsAtom,
  logsWebsocketUrlAtom,
} from '../../common/store/atoms/logsAtoms'
import DSDCard from '../common/DSDCard.jsx'
import LogsSetupForm from './LogsSetupForm.jsx'
import LogsActiveControls from './LogsActiveControls.jsx'
import LogsOutput from './LogsOutput'
import { toLogLine } from './logsUtils'

// Re-export for consumers that import isValidSince from this module
export { isValidSince } from './logsUtils'

/**
 * LogsComponent is the top-level orchestrator for the Logs view.
 * It manages the WebSocket connection and incoming message buffering,
 * then delegates rendering to LogsSetupForm, LogsActiveControls and LogsOutput.
 */
const LogsComponent = React.memo(function LogsComponent() {
  const [, setLogsLines] = useAtom(logsLinesAtom)
  const logsNumberOfLines = useAtomValue(logsNumberOfLinesAtom)
  const logsMessageMaxLen = useAtomValue(logsMessageMaxLenAtom)
  const [logsShowLogs] = useAtom(logsShowLogsAtom)
  const logsConfig = useAtomValue(logsConfigAtom)
  const logsWebsocketUrl = useAtomValue(logsWebsocketUrlAtom)
  const setLogsError = useSetAtom(logsErrorAtom)

  const shouldReconnect = useCallback(() => {
    return Boolean(logsShowLogs && logsConfig?.follow)
  }, [logsShowLogs, logsConfig?.follow])

  // Append every incoming line from the websocket callback rather than from an
  // effect on `lastMessage`. The backend emits one message per log line, so a
  // burst of lines arrives faster than React re-renders: with `lastMessage`
  // only the final line of each burst survived and the rest were silently
  // dropped. The functional updater also keeps every line when several
  // messages land in the same batch.
  const handleMessage = useCallback(
    (event) => {
      const message = toLogLine(event?.data, logsMessageMaxLen)
      const cap = Math.max(2 * Number(logsNumberOfLines) || 20, 20)
      setLogsLines((prev) => [...prev, message].slice(-cap))
    },
    [logsNumberOfLines, logsMessageMaxLen, setLogsLines],
  )

  // The backend reports why a stream could not be served (an option Docker
  // rejects, for instance) in the websocket close reason. Surfacing it keeps a
  // failed request from looking like a service without any logs.
  const handleClose = useCallback(
    (event) => {
      if (!event || event.code === 1000 || event.code === 1005) return
      setLogsError(event.reason || `Log stream closed (code ${event.code})`)
    },
    [setLogsError],
  )

  const handleOpen = useCallback(() => setLogsError(null), [setLogsError])

  useWebSocket(
    logsWebsocketUrl,
    {
      onMessage: handleMessage,
      onOpen: handleOpen,
      onClose: handleClose,
      shouldReconnect: shouldReconnect,
    },
    logsShowLogs,
  )

  return (
    <DSDCard
      icon="desktop"
      title="Logs"
      body={
        <>
          {!logsShowLogs && (
            <div className="text-muted mb-3">Choose a service and options</div>
          )}
          <Card.Body>
            {!logsShowLogs && <LogsSetupForm />}
            {logsShowLogs && <LogsActiveControls />}
          </Card.Body>
          {logsShowLogs && <LogsOutput />}
        </>
      }
    />
  )
})

LogsComponent.propTypes = {}

export default LogsComponent

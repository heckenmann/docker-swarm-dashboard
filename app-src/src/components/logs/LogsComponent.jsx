import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Card } from 'react-bootstrap'
import useWebSocket from 'react-use-websocket'
import { useEffect, useCallback } from 'react'
import {
  logsConfigAtom,
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
    const raw = lastMessage.data
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

import { useAtomValue } from 'jotai'
import { Button } from 'react-bootstrap'
import React from 'react'
import { currentVariantClassesAtom } from '../../common/store/atoms/themeAtoms'
import {
  logsFormServiceIdAtom,
  logsFormServiceNameAtom,
  logsFormTailAtom,
  logsLinesAtom,
  logsNumberOfLinesAtom,
  logsSearchKeywordAtom,
} from '../../common/store/atoms/logsAtoms'

/**
 * Escape all RegExp metacharacters in a string so it can be used as a
 * literal pattern inside `new RegExp()`.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Copy log lines to clipboard as newline-separated string.
 * @param {string[]|null|undefined} logs - Array of log lines
 */
export function copyLogsToClipboard(logs) {
  const text = Array.isArray(logs) ? logs.join('\n') : ''
  navigator.clipboard?.writeText(text)
}

/**
 * Download logs as a .log file.
 * @param {string[]|null|undefined} logs - Array of log lines
 * @param {string|null} serviceName - Filename base (uses serviceId if null)
 * @param {string|null} serviceId - Filename base if serviceName is null
 */
export function downloadLogs(logs, serviceName, serviceId) {
  const text = Array.isArray(logs) ? logs.join('\n') : ''
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${serviceName || serviceId || 'logs'}.log`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * LogsOutput renders the live log display: filtered and highlighted log lines,
 * a match counter when a keyword is active, and Copy / Download actions.
 * Reads Jotai atoms directly; no props required.
 */
const LogsOutput = React.memo(function LogsOutput() {
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const logsLines = useAtomValue(logsLinesAtom)
  const logsNumberOfLines = useAtomValue(logsNumberOfLinesAtom)
  const tail = useAtomValue(logsFormTailAtom)
  const searchKeyword = useAtomValue(logsSearchKeywordAtom)
  const serviceId = useAtomValue(logsFormServiceIdAtom)
  const serviceName = useAtomValue(logsFormServiceNameAtom)

  const keyword = (searchKeyword ?? '').trim().toLowerCase()
  const sliced =
    logsLines?.slice(-Number(logsNumberOfLines || tail || 100)) || []
  const filtered = keyword
    ? sliced.filter((l) => l.toLowerCase().includes(keyword))
    : sliced
  const hiddenCount = sliced.length - filtered.length

  return (
    <div
      className={`p-2 border-top border-secondary overflow-auto ${currentVariantClasses}`}
      aria-live="polite"
      aria-label="Log output"
    >
      <div className="font-monospace small">
        {keyword && (
          <div className="text-muted small mb-1">
            {filtered.length} of {sliced.length} lines match
            {hiddenCount > 0 && (
              <span className="ms-1">({hiddenCount} hidden)</span>
            )}
          </div>
        )}
        {filtered.map((l, i) => {
          const isErr = /stderr|error|ERROR/.test(l)
          const highlightedLine =
            keyword && l.toLowerCase().includes(keyword)
              ? l
                  .split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'))
                  .map((part, pi) =>
                    part.toLowerCase() === keyword ? (
                      <mark key={pi} className="bg-warning px-0">
                        {part}
                      </mark>
                    ) : (
                      part
                    ),
                  )
              : l
          return (
            <div
              key={i}
              className={isErr ? 'text-danger fw-semibold' : undefined}
            >
              {highlightedLine}
            </div>
          )
        })}
      </div>
      <div className="mt-2">
        <Button
          size="sm"
          variant="outline-secondary"
          className="me-2"
          onClick={() => copyLogsToClipboard(logsLines)}
        >
          Copy
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => downloadLogs(logsLines, serviceName, serviceId)}
        >
          Download
        </Button>
      </div>
    </div>
  )
})

LogsOutput.propTypes = {}

export default LogsOutput

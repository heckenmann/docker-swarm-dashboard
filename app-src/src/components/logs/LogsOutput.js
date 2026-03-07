import { useAtomValue } from 'jotai'
import { Button } from 'react-bootstrap'
import {
  currentVariantClassesAtom,
  logsFormServiceIdAtom,
  logsFormServiceNameAtom,
  logsFormTailAtom,
  logsLinesAtom,
  logsNumberOfLinesAtom,
  logsSearchKeywordAtom,
} from '../../common/store/atoms'

/**
 * LogsOutput renders the live log display: filtered and highlighted log lines,
 * a match counter when a keyword is active, and Copy / Download actions.
 * Reads Jotai atoms directly; no props required.
 */
function LogsOutput() {
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const logsLines = useAtomValue(logsLinesAtom)
  const logsNumberOfLines = useAtomValue(logsNumberOfLinesAtom)
  const tail = useAtomValue(logsFormTailAtom)
  const searchKeyword = useAtomValue(logsSearchKeywordAtom)
  const serviceId = useAtomValue(logsFormServiceIdAtom)
  const serviceName = useAtomValue(logsFormServiceNameAtom)

  const keyword = searchKeyword.trim().toLowerCase()
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
              ? l.split(new RegExp(`(${keyword})`, 'gi')).map((part, pi) =>
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
  )
}

LogsOutput.propTypes = {}

export { LogsOutput }

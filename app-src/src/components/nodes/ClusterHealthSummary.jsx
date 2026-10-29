import React from 'react'
import { useAtomValue } from 'jotai'
import { Alert, Badge, Button, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clusterHealthAtom } from '../../common/store/atoms/dashboardAtoms'
import { loadable } from '../../common/store/loadable'
import { useEntityActions } from '../../common/hooks/useEntityActions'

const healthLoadable = loadable(clusterHealthAtom)
const warningTitles = {
  single_manager: 'No manager redundancy',
  even_managers: 'Even manager count',
  unreachable_managers: 'Manager unreachable',
  unknown_reachability: 'Reachability unknown',
  missing_leader: 'No leader reported',
  multiple_leaders: 'Conflicting leader reports',
  insufficient_reachable: 'Reachable managers below majority',
  no_managers: 'No managers reported',
}

/**
 * Display Docker-reported control-plane observations independently of exporters.
 * @returns {JSX.Element} Cluster health summary with manager status and warnings.
 */
export default function ClusterHealthSummary() {
  const result = useAtomValue(healthLoadable)
  const { onOpen } = useEntityActions('node')
  let body
  let status
  if (result.state === 'loading') {
    body = (
      <div role="status" className="text-body-secondary py-2">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading control-plane observation...
      </div>
    )
  } else if (result.state === 'hasError' || !result.data?.available) {
    status = <Badge bg="secondary">Unavailable</Badge>
    body = (
      <Alert variant="warning" className="mb-0">
        Control-plane information is unavailable. Docker node information could
        not be retrieved.
      </Alert>
    )
  } else {
    const health = result.data
    const nodeName = (id) =>
      health.nodes?.find((node) => node.id === id)?.hostname || id
    const reserve = health.remainingFailures
    status = (
      <Badge bg={health.state === 'warning' ? 'warning' : 'info'} text="dark">
        {health.state === 'warning'
          ? 'Warnings observed'
          : 'Majority observed reachable'}
      </Badge>
    )
    body = (
      <>
        <div className="row g-3 mb-3">
          <div className="col-6 col-xl-3">
            <div
              className="border-start border-3 ps-3 h-100"
              aria-label="Configured managers"
            >
              <div className="small text-body-secondary mb-1">Managers</div>
              <div className="fs-3 fw-semibold lh-1">
                {health.managers}
                {health.warnings
                  .filter((warning) =>
                    ['single_manager', 'even_managers', 'no_managers'].includes(
                      warning.code,
                    ),
                  )
                  .map((warning) => (
                    <button
                      key={warning.code}
                      type="button"
                      className="btn p-0 border-0 ms-2 fs-6 text-warning-emphasis"
                      title={`${warningTitles[warning.code]}: ${warning.message}`}
                      aria-label={`${warningTitles[warning.code]}: ${warning.message}`}
                    >
                      <FontAwesomeIcon icon="exclamation-triangle" />
                    </button>
                  ))}
              </div>
              <div className="small text-body-secondary mt-2">
                Configured in Swarm
              </div>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div
              className="border-start border-3 ps-3 h-100"
              aria-label="Manager quorum"
            >
              <div className="small text-body-secondary mb-1">
                Reachable / required
              </div>
              <div className="fs-3 fw-semibold lh-1">
                {health.reachable}
                <span className="text-body-secondary fs-5 fw-normal">
                  {' '}
                  / {health.majority}
                </span>
              </div>
              <div className="small text-body-secondary mt-2">
                {health.unreachable} unreachable · {health.unknown} unknown
              </div>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div
              className="border-start border-3 ps-3 h-100"
              aria-label="Manager failure reserve"
            >
              <div className="small text-body-secondary mb-1">
                Failure reserve
              </div>
              <div
                className={`fs-3 fw-semibold lh-1 ${reserve === 0 ? 'text-warning-emphasis' : ''}`}
              >
                {reserve ?? 'Unknown'}
              </div>
              <div className="small text-body-secondary mt-2">
                Additional failures tolerated
              </div>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div
              className="border-start border-3 ps-3 h-100"
              aria-label="Reported leader"
            >
              <div className="small text-body-secondary mb-1">Leader</div>
              <div className="fw-semibold text-break">
                {health.leaderIds.length
                  ? health.leaderIds.map((id) => (
                      <Button
                        key={id}
                        variant="link"
                        className="p-0 text-start fw-semibold text-break me-2"
                        onClick={() => onOpen(id)}
                      >
                        {nodeName(id)}
                      </Button>
                    ))
                  : 'Unknown'}
              </div>
              <div className="small text-body-secondary mt-2">
                Reported by Docker
              </div>
            </div>
          </div>
        </div>
        {health.warnings.some(
          (warning) =>
            !['single_manager', 'even_managers', 'no_managers'].includes(
              warning.code,
            ),
        ) && (
          <div className="border rounded px-3 mb-3">
            {health.warnings
              .filter(
                (warning) =>
                  !['single_manager', 'even_managers', 'no_managers'].includes(
                    warning.code,
                  ),
              )
              .map((warning, index) => (
                <div
                  key={warning.code}
                  role="alert"
                  className={`d-flex gap-2 py-2 ${index > 0 ? 'border-top' : ''}`}
                >
                  <FontAwesomeIcon
                    icon="exclamation-triangle"
                    className="text-warning-emphasis mt-1 flex-shrink-0"
                  />
                  <div className="flex-grow-1 small">
                    <div className="fw-semibold">
                      {warningTitles[warning.code] || 'Manager warning'}
                    </div>
                    <div className="text-body-secondary">{warning.message}</div>
                    {warning.nodeIds.length > 0 && (
                      <div className="d-flex flex-wrap gap-3 mt-1">
                        {warning.nodeIds.map((id) => (
                          <Button
                            key={id}
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={() => onOpen(id)}
                          >
                            {nodeName(id)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </>
    )
  }
  return (
    <section aria-label="Control plane">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <span className="small fw-semibold text-body-secondary">
          Control plane
        </span>
        {status}
      </div>
      {body}
    </section>
  )
}

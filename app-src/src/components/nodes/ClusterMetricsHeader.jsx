import React from 'react'
import { useAtomValue } from 'jotai'
import { ProgressBar, Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { loadable } from '../../common/store/loadable'
import { clusterMetricsAtom } from '../../common/store/atoms/dashboardAtoms'
import { formatBytes } from '../../common/utils/formatUtils'

const clusterMetricsLoadable = loadable(clusterMetricsAtom)

/**
 * Display cluster resources inside the shared cluster overview.
 * @returns {JSX.Element} Resource totals or an explicit availability state.
 */
const ClusterMetricsHeader = React.memo(function ClusterMetricsHeader() {
  const metricsRes = useAtomValue(clusterMetricsLoadable)
  let body
  if (metricsRes.state === 'loading') {
    body = (
      <div className="small text-body-secondary" role="status">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading cluster metrics...
      </div>
    )
  } else if (metricsRes.state === 'hasError' || metricsRes.data?.error) {
    const error = metricsRes.error || metricsRes.data?.error
    body = (
      <Alert variant="warning" className="py-2 mb-0 small">
        <strong>Cluster metrics warning:</strong>{' '}
        {error
          ? error instanceof Error
            ? error.message
            : String(error)
          : 'Failed to fetch metrics from nodes.'}
      </Alert>
    )
  } else if (!metricsRes.data?.available) {
    body = (
      <details className="small text-body-secondary">
        <summary className="cursor-pointer">
          <FontAwesomeIcon icon="info-circle" className="me-2" />
          Cluster resources unavailable
        </summary>
        <p className="mt-2 mb-0">
          Cluster-wide metrics are not enabled. Deploy{' '}
          <strong>node-exporter</strong> as a global service with the label{' '}
          <code>
            {metricsRes.data?.message?.includes('dsd.')
              ? 'dsd.node-exporter=true'
              : 'your configured label'}
          </code>{' '}
          to visualize cluster resources.
        </p>
      </details>
    )
  } else {
    const metrics = metricsRes.data
    body = (
      <>
        <div className="d-flex flex-wrap justify-content-between gap-1 mb-3 small text-body-secondary">
          <span className="fw-semibold">Resources</span>
          <span>Aggregated from {metrics.nodesAvailable} nodes</span>
        </div>
        <div className="row g-3">
          <div className="col-12 col-md-4" aria-label="Cluster CPU">
            <div className="d-flex align-items-center gap-2 small text-body-secondary mb-1">
              <FontAwesomeIcon icon="microchip" />
              Cluster CPU
            </div>
            <div className="d-flex justify-content-between gap-2 small mb-2">
              <span>{metrics.totalCpu} cores</span>
              <strong>
                {metrics.cpuPercent === null || metrics.cpuPercent === undefined
                  ? 'Unavailable'
                  : `${metrics.cpuPercent.toFixed(1)}%`}
              </strong>
            </div>
            <ProgressBar
              aria-label="Cluster CPU usage"
              now={metrics.cpuPercent ?? 0}
              variant={
                metrics.cpuPercent > 90
                  ? 'danger'
                  : metrics.cpuPercent > 75
                    ? 'warning'
                    : 'success'
              }
              style={{ height: '6px' }}
            />
          </div>
          <div className="col-12 col-md-4" aria-label="Cluster Memory">
            <div className="d-flex align-items-center gap-2 small text-body-secondary mb-2">
              <FontAwesomeIcon icon="memory" />
              Cluster Memory
            </div>
            <div className="d-flex justify-content-between gap-2 small mb-2">
              <span>
                {formatBytes(metrics.usedMemory)} /{' '}
                {formatBytes(metrics.totalMemory)}
              </span>
              <strong>{metrics.memoryPercent.toFixed(1)}%</strong>
            </div>
            <ProgressBar
              aria-label="Cluster memory usage"
              now={metrics.memoryPercent}
              variant={
                metrics.memoryPercent > 90
                  ? 'danger'
                  : metrics.memoryPercent > 75
                    ? 'warning'
                    : 'success'
              }
              style={{ height: '6px' }}
            />
          </div>
          <div className="col-12 col-md-4" aria-label="Cluster Disk">
            <div className="d-flex align-items-center gap-2 small text-body-secondary mb-2">
              <FontAwesomeIcon icon="hdd" />
              Cluster Disk
            </div>
            <div className="d-flex justify-content-between gap-2 small mb-2">
              <span>
                {formatBytes(metrics.usedDisk)} /{' '}
                {formatBytes(metrics.totalDisk)}
              </span>
              <strong>{metrics.diskPercent.toFixed(1)}%</strong>
            </div>
            <ProgressBar
              aria-label="Cluster disk usage"
              now={metrics.diskPercent}
              variant={
                metrics.diskPercent > 90
                  ? 'danger'
                  : metrics.diskPercent > 75
                    ? 'warning'
                    : 'success'
              }
              style={{ height: '6px' }}
            />
          </div>
        </div>
      </>
    )
  }
  return (
    <section aria-label="Cluster resources" className="border-top pt-3 mt-3">
      {body}
    </section>
  )
})

export default ClusterMetricsHeader

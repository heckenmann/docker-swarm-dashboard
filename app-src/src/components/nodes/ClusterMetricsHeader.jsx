import React from 'react'
import { useAtomValue } from 'jotai'
import { loadable } from 'jotai/utils'
import { Row, Col, ProgressBar, Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clusterMetricsAtom } from '../../common/store/atoms/dashboardAtoms'
import { formatBytes } from '../../common/utils/formatUtils'
import DSDCard from '../common/DSDCard'

const clusterMetricsLoadable = loadable(clusterMetricsAtom)

/**
 * ClusterMetricsHeader - Displays aggregated cluster-wide metrics in a header row.
 *
 * Shows CPU, Memory, and Disk usage across all nodes in the swarm cluster.
 * Handles loading, error, and unavailable states gracefully.
 *
 * @returns {JSX.Element}
 */
const ClusterMetricsHeader = React.memo(function ClusterMetricsHeader() {
  const metricsRes = useAtomValue(clusterMetricsLoadable)

  if (metricsRes.state === 'loading') {
    return (
      <Row className="mb-4 mt-2 px-2 text-center">
        <Col>
          <Spinner animation="border" size="sm" className="me-2" />
          <span className="text-muted">Loading cluster metrics...</span>
        </Col>
      </Row>
    )
  }

  if (
    metricsRes.state === 'hasError' ||
    (metricsRes.data && metricsRes.data.error)
  ) {
    return (
      <Alert variant="warning" className="mx-2">
        <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
        <strong>Cluster metrics warning:</strong>{' '}
        {metricsRes.error ||
          metricsRes.data?.error ||
          'Failed to fetch metrics from nodes.'}
      </Alert>
    )
  }

  if (!metricsRes.data || !metricsRes.data.available) {
    return (
      <Alert variant="info" className="mx-2 shadow-sm border-0 bg-light-subtle">
        <FontAwesomeIcon icon="info-circle" className="me-2 text-info" />
        Cluster-wide metrics are not enabled. Deploy{' '}
        <strong>node-exporter</strong> as a global service with the label{' '}
        <code>
          {metricsRes.data?.message?.includes('dsd.')
            ? 'dsd.node-exporter=true'
            : 'your configured label'}
        </code>{' '}
        to visualize cluster resources.
      </Alert>
    )
  }

  const metrics = metricsRes.data

  return (
    <Row className="mb-4 mt-2 px-2">
      <Col md={4} className="d-flex">
        <DSDCard title="Cluster CPU" icon="microchip">
          <div className="p-3">
            <div className="d-flex justify-content-between mb-1">
              <span>Total Cores</span>
              <span className="fw-bold">{metrics.totalCpu}</span>
            </div>
            <div className="text-muted small">
              Aggregated from {metrics.nodesAvailable} nodes
            </div>
          </div>
        </DSDCard>
      </Col>
      <Col md={4} className="d-flex">
        <DSDCard title="Cluster Memory" icon="memory">
          <div className="p-3">
            <div className="d-flex justify-content-between mb-1">
              <span>
                {formatBytes(metrics.usedMemory)} /{' '}
                {formatBytes(metrics.totalMemory)}
              </span>
              <span className="fw-bold">
                {metrics.memoryPercent.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              now={metrics.memoryPercent}
              variant={
                metrics.memoryPercent > 90
                  ? 'danger'
                  : metrics.memoryPercent > 75
                    ? 'warning'
                    : 'success'
              }
              style={{ height: '8px' }}
              className="mt-2"
            />
          </div>
        </DSDCard>
      </Col>
      <Col md={4} className="d-flex">
        <DSDCard title="Cluster Disk" icon="hdd">
          <div className="p-3">
            <div className="d-flex justify-content-between mb-1">
              <span>
                {formatBytes(metrics.usedDisk)} /{' '}
                {formatBytes(metrics.totalDisk)}
              </span>
              <span className="fw-bold">{metrics.diskPercent.toFixed(1)}%</span>
            </div>
            <ProgressBar
              now={metrics.diskPercent}
              variant={
                metrics.diskPercent > 90
                  ? 'danger'
                  : metrics.diskPercent > 75
                    ? 'warning'
                    : 'success'
              }
              style={{ height: '8px' }}
              className="mt-2"
            />
          </div>
        </DSDCard>
      </Col>
    </Row>
  )
})

export default ClusterMetricsHeader

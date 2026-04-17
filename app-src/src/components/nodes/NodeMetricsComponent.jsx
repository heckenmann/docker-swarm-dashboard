import { useState, useEffect } from 'react'
import React from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Card, Alert, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { baseUrlAtom } from '../../common/store/atoms/foundationAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import NodeInfoHeader from './metrics/NodeInfoHeader'
import NodeCpuSection from './metrics/NodeCpuSection'
import NodeMemorySection from './metrics/NodeMemorySection'
import NodeFilesystemNetworkSection from './metrics/NodeFilesystemNetworkSection'
import NodeDiskIOSection from './metrics/NodeDiskIOSection'
import NodeSystemSection from './metrics/NodeSystemSection'

/**
 * Fetches and displays node-exporter metrics for a single Docker Swarm node.
 * Renders loading/error states and delegates rendering of each metric section
 * to focused sub-components.
 * @param {object} props
 * @param {string} props.nodeId - The ID of the node to fetch metrics for
 */
const NodeMetricsComponent = React.memo(function NodeMetricsComponent({
  nodeId,
}) {
  const baseURL = useAtomValue(baseUrlAtom)
  const view = useAtomValue(viewAtom)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metricsData, setMetricsData] = useState(null)
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        setAvailable(false)

        const response = await fetch(`${baseURL}docker/nodes/${nodeId}/metrics`)
        const data = await response.json()

        if (!mounted) return

        setAvailable(data.available)

        if (data.error) {
          setError(data.error)
          setMetricsData(null)
        } else if (data.message) {
          setError(data.message)
          setMetricsData(null)
        } else if (data.metrics) {
          setMetricsData(data.metrics)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch metrics: ' + err.message)
          setMetricsData(null)
          setAvailable(true) // Treat fetch exceptions as hard errors (warning)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchMetrics()

    return () => {
      mounted = false
    }
  }, [baseURL, nodeId, view?.timestamp])

  if (loading) {
    return (
      <Card.Body>
        <div className="text-center py-4">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading metrics...</span>
          </Spinner>
          <p className="mt-2 text-muted small text-uppercase fw-bold">Fetching Node Metrics</p>
        </div>
      </Card.Body>
    )
  }

  if (error && available) {
    return (
      <Card.Body>
        <Alert variant="warning" className="shadow-sm">
          <Alert.Heading className="h6">
            <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
            Metrics Collection Warning
          </Alert.Heading>
          <p className="mb-0 small">{error}</p>
        </Alert>
      </Card.Body>
    )
  }

  if (!available) {
    return (
      <Card.Body>
        <Alert variant="info" className="bg-light-subtle border-0 shadow-sm">
          <Alert.Heading className="h6 text-info">
            <FontAwesomeIcon icon="info-circle" className="me-2" />
            Node Metrics Not Configured
          </Alert.Heading>
          <p className="small mb-2">
            {error ||
              'Node-level metrics (CPU, RAM, Disk) require node-exporter.'}
            {!error && (
              <>
                {' '}
                To enable them, deploy node-exporter as a global service with
                the following label:
              </>
            )}
          </p>
          {!error && (
            <code className="d-block p-2 bg-dark text-light rounded small mb-3">
              dsd.node-exporter: &quot;true&quot;
            </code>
          )}

          <p className="extra-small text-muted mb-0">
            Check the documentation for a complete <code>docker-compose.yml</code> example.
          </p>
        </Alert>
      </Card.Body>
    )
  }

  if (!metricsData) {
    return (
      <Card.Body>
        <Alert variant="warning">No metrics data available</Alert>
      </Card.Body>
    )
  }

  const cpuData = metricsData.cpu || []
  const memoryData = metricsData.memory || {}
  const filesystemData = metricsData.filesystem || []
  const networkData = metricsData.network || []
  const diskIOData = metricsData.diskIO || []
  const ntpData = metricsData.ntp || {}
  const systemData = metricsData.system || {}
  const tcpData = metricsData.tcp || {}
  const fdData = metricsData.fileDescriptor || {}
  const serverTime = metricsData.serverTime
    ? new Date(metricsData.serverTime * 1000).toLocaleString()
    : 'N/A'

  return (
    <Card.Body>
      <NodeInfoHeader
        systemData={systemData}
        ntpData={ntpData}
        serverTime={serverTime}
      />
      <NodeCpuSection cpuData={cpuData} systemData={systemData} />
      <NodeMemorySection memoryData={memoryData} />
      <NodeFilesystemNetworkSection
        filesystemData={filesystemData}
        networkData={networkData}
      />
      <NodeDiskIOSection diskIOData={diskIOData} />
      <NodeSystemSection
        tcpData={tcpData}
        fdData={fdData}
        systemData={systemData}
      />
    </Card.Body>
  )
})

NodeMetricsComponent.propTypes = {
  nodeId: PropTypes.string.isRequired,
}

export default NodeMetricsComponent

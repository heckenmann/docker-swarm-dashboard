import { useState, useEffect } from 'react'
import React from 'react'
import { useAtomValue } from 'jotai'
import { baseUrlAtom } from '../../common/store/atoms/foundationAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import { Card, Alert, Spinner } from 'react-bootstrap'
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
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading metrics...</span>
          </Spinner>
          <p className="mt-2">Loading metrics...</p>
        </div>
      </Card.Body>
    )
  }

  if (error || !available) {
    return (
      <Card.Body>
        <Alert variant="info">
          <Alert.Heading>Node Metrics Not Available</Alert.Heading>
          <p>{error || 'Node-exporter service not found.'}</p>
          <hr />
          <p className="mb-0">
            To enable node metrics, deploy node-exporter as a global service
            with the label:
          </p>
          <code className="d-block mt-2">
            dsd.node-exporter: &quot;true&quot;
          </code>

          <p className="mt-3 mb-0">
            See README.md for full configuration instructions and example
            docker-compose.yml.
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

export default NodeMetricsComponent

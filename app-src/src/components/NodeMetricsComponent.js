import { useState, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { baseUrlAtom } from '../common/store/atoms'
import { Card, Alert, Spinner } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'

/**
 * Format CPU metrics for chart display
 * @param {Array} cpuMetrics - Array of {mode, value} objects from server
 * @returns {Array} CPU series data for ApexCharts
 */
function formatCPUMetrics(cpuMetrics) {
  if (!cpuMetrics || !Array.isArray(cpuMetrics)) {
    return []
  }

  return cpuMetrics.map((metric) => ({
    x: metric.mode,
    y: metric.value.toFixed(2),
  }))
}

/**
 * Calculate memory usage details from memory metrics
 * @param {object} memoryMetrics - Memory metrics object from server
 * @returns {object} Memory metrics with calculated usage
 */
function formatMemoryMetrics(memoryMetrics) {
  if (!memoryMetrics) {
    return {
      total: 0,
      free: 0,
      available: 0,
      used: 0,
      usedPercent: 0,
    }
  }

  const total = memoryMetrics.total || 0
  const free = memoryMetrics.free || 0
  const available = memoryMetrics.available || 0

  return {
    total,
    free,
    available,
    used: total - free,
    usedPercent: total > 0 ? ((total - available) / total) * 100 : 0,
  }
}

/**
 * Component to display node metrics from node-exporter
 * @param {object} props - Component props
 * @param {string} props.nodeId - The ID of the node to fetch metrics for
 */
function NodeMetricsComponent({ nodeId }) {
  const baseURL = useAtomValue(baseUrlAtom)
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
          // Metrics are already parsed by the server, just store them
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

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [baseURL, nodeId])

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
          <code className="d-block mt-2">dsd.node-exporter: "true"</code>
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

  const cpuData = formatCPUMetrics(metricsData.cpu)
  const memoryData = formatMemoryMetrics(metricsData.memory)

  // CPU Chart Configuration
  const cpuChartOptions = {
    chart: {
      type: 'bar',
      height: 250,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val + 's',
    },
    xaxis: {
      title: {
        text: 'Seconds',
      },
    },
    yaxis: {
      title: {
        text: 'CPU Mode',
      },
    },
    title: {
      text: 'CPU Time by Mode',
      align: 'center',
    },
    legend: {
      show: false,
    },
  }

  const cpuChartSeries = [
    {
      name: 'CPU Seconds',
      data: cpuData,
    },
  ]

  // Memory Chart Configuration
  const memoryChartOptions = {
    chart: {
      type: 'donut',
      height: 250,
    },
    labels: ['Used', 'Available'],
    title: {
      text: 'Memory Usage',
      align: 'center',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () =>
                (memoryData.total / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val.toFixed(1) + '%',
    },
  }

  const memoryChartSeries = [
    memoryData.total - memoryData.available,
    memoryData.available,
  ]

  return (
    <Card.Body>
      <div className="row">
        <div className="col-md-6">
          {cpuData.length > 0 ? (
            <ReactApexChart
              options={cpuChartOptions}
              series={cpuChartSeries}
              type="bar"
              height={250}
            />
          ) : (
            <Alert variant="info">No CPU metrics available</Alert>
          )}
        </div>
        <div className="col-md-6">
          {memoryData.total > 0 ? (
            <ReactApexChart
              options={memoryChartOptions}
              series={memoryChartSeries}
              type="donut"
              height={250}
            />
          ) : (
            <Alert variant="info">No memory metrics available</Alert>
          )}
        </div>
      </div>
      <div className="row mt-3">
        <div className="col-12">
          <small className="text-muted">
            Metrics refresh every 30 seconds. Data from node-exporter service.
          </small>
        </div>
      </div>
    </Card.Body>
  )
}

export { NodeMetricsComponent }

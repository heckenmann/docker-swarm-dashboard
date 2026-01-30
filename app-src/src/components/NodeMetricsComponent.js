import { useState, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { baseURLAtom } from '../common/store/atoms'
import { Card, Alert, Spinner } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'

/**
 * Parse Prometheus metrics format and extract key metrics for visualization
 * @param {string} metricsText - Raw Prometheus metrics text
 * @returns {object} Parsed metrics data structure
 */
function parsePrometheusMetrics(metricsText) {
  const lines = metricsText.split('\n')
  const metrics = {}

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') continue

    // Parse metric line: metric_name{labels} value timestamp?
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?([^}]*)\}?\s+([\d.eE+-]+)/)
    if (match) {
      const [, metricName, labels, value] = match
      if (!metrics[metricName]) {
        metrics[metricName] = []
      }
      metrics[metricName].push({
        labels: labels,
        value: parseFloat(value),
      })
    }
  }

  return metrics
}

/**
 * Extract CPU metrics and prepare for chart display
 * @param {object} metrics - Parsed metrics object
 * @returns {Array} CPU series data for ApexCharts
 */
function extractCPUMetrics(metrics) {
  const cpuMetrics = metrics['node_cpu_seconds_total'] || []
  const cpuModes = {}

  // Group by mode
  for (const metric of cpuMetrics) {
    const modeMatch = metric.labels.match(/mode="([^"]+)"/)
    if (modeMatch) {
      const mode = modeMatch[1]
      if (!cpuModes[mode]) {
        cpuModes[mode] = 0
      }
      cpuModes[mode] += metric.value
    }
  }

  return Object.entries(cpuModes).map(([mode, value]) => ({
    x: mode,
    y: value.toFixed(2),
  }))
}

/**
 * Extract memory metrics and prepare for display
 * @param {object} metrics - Parsed metrics object
 * @returns {object} Memory metrics object
 */
function extractMemoryMetrics(metrics) {
  const memTotal = metrics['node_memory_MemTotal_bytes']?.[0]?.value || 0
  const memFree = metrics['node_memory_MemFree_bytes']?.[0]?.value || 0
  const memAvailable = metrics['node_memory_MemAvailable_bytes']?.[0]?.value || 0

  return {
    total: memTotal,
    free: memFree,
    available: memAvailable,
    used: memTotal - memFree,
    usedPercent: memTotal > 0 ? ((memTotal - memAvailable) / memTotal) * 100 : 0,
  }
}

/**
 * Component to display node metrics from node-exporter
 * @param {object} props - Component props
 * @param {string} props.nodeId - The ID of the node to fetch metrics for
 */
function NodeMetricsComponent({ nodeId }) {
  const baseURL = useAtomValue(baseURLAtom)
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
          const parsed = parsePrometheusMetrics(data.metrics)
          setMetricsData(parsed)
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

  const cpuData = extractCPUMetrics(metricsData)
  const memoryData = extractMemoryMetrics(metricsData)

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

import { useState, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import {
  baseUrlAtom,
  isDarkModeAtom,
  tableSizeAtom,
  viewAtom,
} from '../common/store/atoms'
import { Card, Alert, Spinner, Row, Col, Table } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'

/**
 * Get chart theme configuration based on dark mode
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {object} Theme configuration for ApexCharts
 */
function getChartTheme(isDarkMode) {
  return {
    mode: isDarkMode ? 'dark' : 'light',
    palette: 'palette1',
    monochrome: {
      enabled: false,
    },
  }
}

/**
 * Get common chart options for dark mode compatibility
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {object} Common chart options
 */
function getCommonChartOptions(isDarkMode) {
  const textColor = isDarkMode ? '#e0e0e0' : '#373d3f'
  const gridColor = isDarkMode ? '#444' : '#e0e0e0'

  return {
    theme: getChartTheme(isDarkMode),
    chart: {
      foreColor: textColor,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
    },
    grid: {
      borderColor: gridColor,
    },
    xaxis: {
      labels: {
        style: {
          colors: textColor,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
        },
      },
    },
    legend: {
      labels: {
        colors: textColor,
      },
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
    },
  }
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Component to display service memory metrics from cAdvisor
 * @param {object} props - Component props
 * @param {string} props.serviceId - The ID of the service to fetch metrics for
 */
function ServiceMetricsComponent({ serviceId }) {
  const baseURL = useAtomValue(baseUrlAtom)
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const tableSize = useAtomValue(tableSizeAtom)
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

        const response = await fetch(
          `${baseURL}docker/services/${serviceId}/metrics`,
        )
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
  }, [baseURL, serviceId, view?.timestamp])

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
          <Alert.Heading>Service Metrics Not Available</Alert.Heading>
          <p>{error || 'cAdvisor service not found.'}</p>
          <hr />
          <p className="mb-0">
            To enable service memory metrics, deploy cAdvisor as a global
            service with the label:
          </p>
          <code className="d-block mt-2">dsd.cadvisor: &quot;true&quot;</code>
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

  const containerMetrics = metricsData.containers || []
  const totalUsage = metricsData.totalUsage || 0
  const totalLimit = metricsData.totalLimit || 0
  const averageUsage = metricsData.averageUsage || 0
  const averagePercent = metricsData.averagePercent || 0
  const serverTime = metricsData.serverTime
    ? new Date(metricsData.serverTime * 1000).toLocaleString()
    : 'N/A'

  const commonOpts = getCommonChartOptions(isDarkMode)

  // Total Memory Usage Chart (Donut)
  const totalMemUsed = totalUsage
  const totalMemAvailable = totalLimit > 0 ? totalLimit - totalUsage : 0

  const totalMemoryChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'donut',
      height: 350,
    },
    labels: ['Used', 'Available'],
    title: {
      text: 'Total Service Memory',
      align: 'center',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Limit',
              formatter: () => (totalLimit > 0 ? formatBytes(totalLimit) : 'No Limit'),
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

  const totalMemoryChartSeries =
    totalLimit > 0 ? [totalMemUsed, totalMemAvailable] : [totalMemUsed, 0]

  // Container Memory Usage Bar Chart
  const containerMemoryChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 350,
      stacked: true,
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      ...commonOpts.xaxis,
      categories: containerMetrics.map(
        (c) => c.taskName || c.containerId?.substring(0, 12) || 'Unknown',
      ),
      title: {
        text: 'Memory (MB)',
      },
    },
    title: {
      text: 'Container Memory Usage',
      align: 'center',
    },
  }

  const containerMemoryChartSeries = [
    {
      name: 'Used',
      data: containerMetrics.map((c) => (c.usage / 1024 / 1024).toFixed(2)),
    },
    {
      name: 'Available',
      data: containerMetrics.map((c) =>
        c.limit > 0 ? ((c.limit - c.usage) / 1024 / 1024).toFixed(2) : 0,
      ),
    },
  ]

  return (
    <Card.Body>
      {/* System Info Header */}
      <Alert variant="secondary" className="mb-3 py-2">
        <Row>
          <Col xs={12} md={6} className="mb-1 mb-md-0">
            <strong>Server Time:</strong> {serverTime}
          </Col>
          <Col xs={12} md={6}>
            <strong>Containers:</strong> {containerMetrics.length}
          </Col>
        </Row>
        <Row className="mt-1">
          <Col xs={12} md={6} className="mb-1 mb-md-0">
            <strong>Total Usage:</strong> {formatBytes(totalUsage)}
          </Col>
          <Col xs={12} md={6}>
            <strong>Total Limit:</strong>{' '}
            {totalLimit > 0 ? formatBytes(totalLimit) : 'No Limit'}
          </Col>
        </Row>
        {averagePercent > 0 && (
          <Row className="mt-1">
            <Col xs={12}>
              <strong>Average Usage:</strong> {formatBytes(averageUsage)} (
              {averagePercent.toFixed(2)}% of limit)
            </Col>
          </Row>
        )}
      </Alert>

      {/* Memory Charts */}
      <Row className="mb-3">
        <Col xs={12} lg={6} className="mb-3 mb-lg-0">
          {totalUsage > 0 ? (
            <ReactApexChart
              options={totalMemoryChartOptions}
              series={totalMemoryChartSeries}
              type="donut"
              height={350}
            />
          ) : (
            <Alert variant="info">No memory usage data available</Alert>
          )}
        </Col>
        <Col xs={12} lg={6}>
          {containerMetrics.length > 0 ? (
            <ReactApexChart
              options={containerMemoryChartOptions}
              series={containerMemoryChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <Alert variant="info">No container metrics available</Alert>
          )}
        </Col>
      </Row>

      {/* Container Details Table */}
      {containerMetrics.length > 0 && (
        <Row className="mb-3">
          <Col>
            <h6>Container Memory Details</h6>
            <Table
              striped
              bordered
              hover
              size={tableSize}
              variant={isDarkMode ? 'dark' : 'light'}
            >
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Container ID</th>
                  <th>Usage</th>
                  <th>Working Set</th>
                  <th>Limit</th>
                  <th>Usage %</th>
                </tr>
              </thead>
              <tbody>
                {containerMetrics.map((container, idx) => (
                  <tr key={container.containerId || idx}>
                    <td>{container.taskName || 'N/A'}</td>
                    <td>
                      <code>
                        {container.containerId?.substring(0, 12) || 'N/A'}
                      </code>
                    </td>
                    <td>{formatBytes(container.usage || 0)}</td>
                    <td>{formatBytes(container.workingSet || 0)}</td>
                    <td>
                      {container.limit > 0
                        ? formatBytes(container.limit)
                        : 'No Limit'}
                    </td>
                    <td
                      className={
                        container.usagePercent > 90
                          ? 'text-danger'
                          : container.usagePercent > 75
                            ? 'text-warning'
                            : ''
                      }
                    >
                      {container.limit > 0
                        ? `${container.usagePercent.toFixed(2)}%`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}

      {/* Footer Info */}
      <Row>
        <Col>
          <small className="text-muted">
            Metrics refresh with global interval. Data from cAdvisor service.
          </small>
        </Col>
      </Row>
    </Card.Body>
  )
}

export { ServiceMetricsComponent }

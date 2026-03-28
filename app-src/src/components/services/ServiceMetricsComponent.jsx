import React from 'react'
import { useState, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { baseUrlAtom } from '../../common/store/atoms/foundationAtoms'
import { isDarkModeAtom } from '../../common/store/atoms/themeAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import { Alert, Spinner, Row, Col, Card } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { getCommonChartOptions } from '../../common/chartUtils'
import { formatBytes, bytesToMB } from '../../common/formatUtils'

// Constants
const NO_LIMIT_TEXT = 'No Limit'
const UNKNOWN_CONTAINER_TEXT = 'Container N/A'

/**
 * Component to display service memory metrics from cAdvisor
 * @param {object} props - Component props
 * @param {string} props.serviceId - The ID of the service to fetch metrics for
 */
const ServiceMetricsComponent = React.memo(function ServiceMetricsComponent({
  serviceId,
}) {
  const baseURL = useAtomValue(baseUrlAtom)
  const isDarkMode = useAtomValue(isDarkModeAtom)
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
              formatter: () =>
                totalLimit > 0 ? formatBytes(totalLimit) : NO_LIMIT_TEXT,
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
        (c) =>
          c.taskName ||
          c.containerId?.substring(0, 12) ||
          UNKNOWN_CONTAINER_TEXT,
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
      data: containerMetrics.map((c) => bytesToMB(c.usage)),
    },
    {
      name: 'Available',
      data: containerMetrics.map((c) =>
        c.limit > 0 ? bytesToMB(c.limit - c.usage) : 0,
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
            {totalLimit > 0 ? formatBytes(totalLimit) : NO_LIMIT_TEXT}
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
})

export default ServiceMetricsComponent

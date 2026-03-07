import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  taskDetailAtom,
  baseUrlAtom,
  isDarkModeAtom,
  viewAtom,
} from '../common/store/atoms'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import {
  Card,
  Tabs,
  Tab,
  Table,
  Spinner,
  Alert,
  Row,
  Col,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from './JsonTable'
import { NodeName } from './names/NodeName'
import { ServiceName } from './names/ServiceName'
import ServiceStatusBadge from './ServiceStatusBadge'
import { useState, useEffect } from 'react'
import ReactApexChart from 'react-apexcharts'

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Build common ApexCharts options respecting dark mode.
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Shared chart option overrides
 */
function getCommonChartOptions(isDarkMode) {
  const textColor = isDarkMode ? '#e0e0e0' : '#373d3f'
  const gridColor = isDarkMode ? '#444' : '#e0e0e0'
  return {
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    chart: {
      foreColor: textColor,
      background: 'transparent',
      toolbar: { show: false },
    },
    grid: { borderColor: gridColor },
    legend: { labels: { colors: textColor } },
    tooltip: { theme: isDarkMode ? 'dark' : 'light' },
  }
}

/**
 * Determine alert colour class based on a percentage value.
 * @param {number} pct - Percentage value 0-100
 * @returns {string} Bootstrap text-colour class
 */
function pctClass(pct) {
  if (pct > 90) return 'text-danger fw-bold'
  if (pct > 75) return 'text-warning fw-bold'
  return ''
}

/**
 * Component to display details of a task.
 * Shows task information, charts for memory/CPU/network/filesystem from cAdvisor, and raw data tabs.
 */
function DetailsTaskComponent() {
  useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const baseURL = useAtomValue(baseUrlAtom)
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const view = useAtomValue(viewAtom)

  const currentTask = useAtomValue(taskDetailAtom)

  // State for task metrics
  const [taskMetrics, setTaskMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState(null)

  // Fetch task metrics
  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      if (!currentTask?.ID) return

      try {
        setMetricsLoading(true)
        setMetricsError(null)
        const response = await fetch(
          `${baseURL}docker/tasks/${currentTask.ID}/metrics`,
        )
        const data = await response.json()

        if (!mounted) return

        if (data.available && data.metrics) {
          setTaskMetrics(data.metrics)
        } else {
          setTaskMetrics(null)
          if (data.message) {
            setMetricsError(data.message)
          }
        }
      } catch (err) {
        console.error('Failed to fetch task metrics:', err)
        setTaskMetrics(null)
        setMetricsError('Failed to fetch metrics from cAdvisor')
      } finally {
        if (mounted) {
          setMetricsLoading(false)
        }
      }
    }

    fetchMetrics()

    return () => {
      mounted = false
    }
  }, [baseURL, currentTask?.ID, view?.timestamp])

  if (!currentTask) return <div>Task doesn't exist</div>

  const taskObj = currentTask

  // ─── Chart builders (only when metrics are present) ───────────────────────
  const buildMemoryCharts = (m, commonOpts) => {
    // Radial gauge for memory usage %
    const memGaugeOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'radialBar' },
      plotOptions: {
        radialBar: {
          startAngle: -130,
          endAngle: 130,
          hollow: { size: '55%' },
          dataLabels: {
            name: { fontSize: '14px', offsetY: -10 },
            value: {
              fontSize: '22px',
              formatter: (val) => `${parseFloat(val).toFixed(1)}%`,
            },
          },
          track: { background: isDarkMode ? '#444' : '#e0e0e0' },
        },
      },
      colors:
        m.usagePercent > 90
          ? ['#dc3545']
          : m.usagePercent > 75
            ? ['#fd7e14']
            : ['#28a745'],
      labels: ['Memory'],
      title: { text: 'Memory Usage', align: 'center' },
    }
    const memGaugeSeries = [parseFloat((m.usagePercent || 0).toFixed(1))]

    // Donut breakdown: Working Set / Cache / Other Used / Available
    const memCache = m.memoryCache || 0
    const workingSet = m.workingSet || 0
    const otherUsed = Math.max(0, (m.usage || 0) - workingSet - memCache)
    const memAvailable = m.limit > 0 ? Math.max(0, m.limit - (m.usage || 0)) : 0

    const memDonutOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'donut' },
      labels:
        m.limit > 0
          ? ['Working Set', 'Cache', 'Other Used', 'Available']
          : ['Working Set', 'Cache', 'Other Used'],
      title: { text: 'Memory Breakdown', align: 'center' },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: m.limit > 0 ? 'Limit' : 'Total RSS',
                formatter: () =>
                  formatBytes(m.limit > 0 ? m.limit : m.usage || 0),
              },
            },
          },
        },
      },
      dataLabels: { formatter: (val) => val.toFixed(1) + '%' },
    }
    const memDonutSeries =
      m.limit > 0
        ? [workingSet, memCache, otherUsed, memAvailable]
        : [workingSet, memCache, otherUsed]

    return { memGaugeOptions, memGaugeSeries, memDonutOptions, memDonutSeries }
  }

  const buildCPUCharts = (m, commonOpts) => {
    // Radial gauge for CPU % of quota (only rendered when cpuPercent is known)
    const cpuGaugeOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'radialBar' },
      plotOptions: {
        radialBar: {
          startAngle: -130,
          endAngle: 130,
          hollow: { size: '55%' },
          dataLabels: {
            name: { fontSize: '14px', offsetY: -10 },
            value: {
              fontSize: '22px',
              formatter: (val) => `${parseFloat(val).toFixed(1)}%`,
            },
          },
          track: { background: isDarkMode ? '#444' : '#e0e0e0' },
        },
      },
      colors:
        m.cpuPercent > 90
          ? ['#dc3545']
          : m.cpuPercent > 75
            ? ['#fd7e14']
            : ['#0d6efd'],
      labels: ['CPU Quota'],
      title: { text: 'CPU vs Quota', align: 'center' },
    }
    const cpuGaugeSeries = [
      Math.min(parseFloat((m.cpuPercent || 0).toFixed(1)), 100),
    ]

    // Pie: user vs system CPU seconds
    const userSec = m.cpuUserSeconds || 0
    const sysSec = m.cpuSystemSeconds || 0
    const cpuBreakdownOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'pie' },
      labels: ['User', 'System'],
      title: { text: 'CPU Time Split', align: 'center' },
      dataLabels: { formatter: (val) => val.toFixed(1) + '%' },
    }
    const cpuBreakdownSeries = [userSec, sysSec]

    return {
      cpuGaugeOptions,
      cpuGaugeSeries,
      cpuBreakdownOptions,
      cpuBreakdownSeries,
    }
  }

  const buildNetworkChart = (m, commonOpts) => {
    const networkChartOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'bar' },
      plotOptions: { bar: { horizontal: true, distributed: true } },
      dataLabels: { enabled: true, formatter: (val) => formatBytes(val) },
      xaxis: {
        categories: ['Received', 'Transmitted'],
        labels: { formatter: (val) => formatBytes(val) },
        title: { text: 'Bytes' },
      },
      title: { text: 'Network Traffic (Total)', align: 'center' },
      legend: { show: false },
    }
    const networkChartSeries = [
      { name: 'Bytes', data: [m.networkRxBytes || 0, m.networkTxBytes || 0] },
    ]
    return { networkChartOptions, networkChartSeries }
  }

  const buildFSChart = (m, commonOpts) => {
    const fsUsed = m.fsUsage || 0
    const fsAvail = m.fsLimit > 0 ? Math.max(0, m.fsLimit - fsUsed) : 0
    const fsChartOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'bar', stacked: true },
      plotOptions: { bar: { horizontal: true } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Filesystem'],
        title: { text: 'GB' },
      },
      title: { text: 'Filesystem Usage', align: 'center' },
    }
    const fsChartSeries = [
      {
        name: 'Used',
        data: [parseFloat((fsUsed / 1024 / 1024 / 1024).toFixed(2))],
      },
      ...(m.fsLimit > 0
        ? [
            {
              name: 'Available',
              data: [parseFloat((fsAvail / 1024 / 1024 / 1024).toFixed(2))],
            },
          ]
        : []),
    ]
    return { fsChartOptions, fsChartSeries }
  }

  // Pre-compute charts
  const commonOpts = getCommonChartOptions(isDarkMode)
  const memCharts = taskMetrics
    ? buildMemoryCharts(taskMetrics, commonOpts)
    : null
  const cpuCharts = taskMetrics ? buildCPUCharts(taskMetrics, commonOpts) : null
  const netCharts = taskMetrics
    ? buildNetworkChart(taskMetrics, commonOpts)
    : null
  const fsCharts = taskMetrics ? buildFSChart(taskMetrics, commonOpts) : null

  const hasNetwork =
    taskMetrics &&
    (taskMetrics.networkRxBytes || 0) + (taskMetrics.networkTxBytes || 0) > 0
  const hasFS = taskMetrics && (taskMetrics.fsUsage || 0) > 0
  const hasCPUBreakdown =
    taskMetrics &&
    (taskMetrics.cpuUserSeconds || 0) + (taskMetrics.cpuSystemSeconds || 0) > 0

  return (
    <div>
      <Card className={currentVariantClasses}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FontAwesomeIcon icon="tasks" className="me-2" />
            <strong>Task Details</strong>
          </div>
          <ServiceStatusBadge state={taskObj.Status?.State} />
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="metrics" className="mb-3">
            <Tab eventKey="metrics" title="Metrics">
              {/* ── Task Info Table ─────────────────────────────────── */}
              <div className="mb-3">
                <h5>Task Information</h5>
                <Table size="sm" bordered className={currentVariantClasses}>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Service</strong>
                      </td>
                      <td>
                        <ServiceName serviceId={taskObj.ServiceID} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Node</strong>
                      </td>
                      <td>
                        <NodeName nodeId={taskObj.NodeID} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>State</strong>
                      </td>
                      <td>
                        <ServiceStatusBadge state={taskObj.Status?.State} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Desired State</strong>
                      </td>
                      <td>{taskObj.DesiredState}</td>
                    </tr>
                    {taskObj.Slot && (
                      <tr>
                        <td>
                          <strong>Slot</strong>
                        </td>
                        <td>{taskObj.Slot}</td>
                      </tr>
                    )}
                    <tr>
                      <td>
                        <strong>Created</strong>
                      </td>
                      <td>{toDefaultDateTimeString(taskObj.CreatedAt)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Updated</strong>
                      </td>
                      <td>{toDefaultDateTimeString(taskObj.UpdatedAt)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* ── Container Metrics ───────────────────────────────── */}
              <h5>Container Metrics</h5>

              {metricsLoading && (
                <div className="text-center my-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading metrics...
                </div>
              )}

              {!metricsLoading && metricsError && (
                <Alert variant="info">
                  <FontAwesomeIcon icon="info-circle" className="me-2" />
                  {metricsError}
                </Alert>
              )}

              {!metricsLoading && !metricsError && taskMetrics && (
                <>
                  {/* Summary row */}
                  <Alert variant="secondary" className="py-2 mb-3">
                    <Row>
                      <Col xs={12} md={6} className="mb-1 mb-md-0">
                        <strong>Container:</strong>{' '}
                        <code>
                          {taskMetrics.containerId
                            ?.split('/')
                            .pop()
                            .substring(0, 12)}
                        </code>
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Memory:</strong>{' '}
                        {formatBytes(taskMetrics.usage || 0)}
                        {taskMetrics.limit > 0 &&
                          ` / ${formatBytes(taskMetrics.limit)}`}
                        {taskMetrics.usagePercent > 0 && (
                          <span
                            className={`ms-2 ${pctClass(taskMetrics.usagePercent)}`}
                          >
                            ({taskMetrics.usagePercent.toFixed(1)}%)
                          </span>
                        )}
                      </Col>
                    </Row>
                    <Row className="mt-1">
                      <Col xs={12} md={6} className="mb-1 mb-md-0">
                        <strong>CPU Total:</strong>{' '}
                        {(taskMetrics.cpuUsage || 0).toFixed(2)}s
                        {taskMetrics.cpuPercent > 0 && (
                          <span
                            className={`ms-2 ${pctClass(taskMetrics.cpuPercent)}`}
                          >
                            ({taskMetrics.cpuPercent.toFixed(1)}% of quota)
                          </span>
                        )}
                      </Col>
                      {hasNetwork && (
                        <Col xs={12} md={6}>
                          <strong>Network:</strong> ↓{' '}
                          {formatBytes(taskMetrics.networkRxBytes || 0)} / ↑{' '}
                          {formatBytes(taskMetrics.networkTxBytes || 0)}
                        </Col>
                      )}
                    </Row>
                  </Alert>

                  {/* Memory charts */}
                  <Row className="mb-3">
                    {taskMetrics.limit > 0 || taskMetrics.usagePercent > 0 ? (
                      <Col xs={12} md={5} className="mb-3 mb-md-0">
                        <ReactApexChart
                          options={memCharts.memGaugeOptions}
                          series={memCharts.memGaugeSeries}
                          type="radialBar"
                          height={280}
                        />
                      </Col>
                    ) : null}
                    <Col
                      xs={12}
                      md={
                        taskMetrics.limit > 0 || taskMetrics.usagePercent > 0
                          ? 7
                          : 12
                      }
                    >
                      <ReactApexChart
                        options={memCharts.memDonutOptions}
                        series={memCharts.memDonutSeries}
                        type="donut"
                        height={280}
                      />
                    </Col>
                  </Row>

                  {/* CPU charts */}
                  <Row className="mb-3">
                    {taskMetrics.cpuPercent > 0 && (
                      <Col
                        xs={12}
                        md={hasCPUBreakdown ? 5 : 12}
                        className="mb-3 mb-md-0"
                      >
                        <ReactApexChart
                          options={cpuCharts.cpuGaugeOptions}
                          series={cpuCharts.cpuGaugeSeries}
                          type="radialBar"
                          height={280}
                        />
                      </Col>
                    )}
                    {hasCPUBreakdown && (
                      <Col xs={12} md={taskMetrics.cpuPercent > 0 ? 7 : 12}>
                        <ReactApexChart
                          options={cpuCharts.cpuBreakdownOptions}
                          series={cpuCharts.cpuBreakdownSeries}
                          type="pie"
                          height={280}
                        />
                      </Col>
                    )}
                    {!taskMetrics.cpuPercent && !hasCPUBreakdown && (
                      <Col xs={12}>
                        <Alert variant="info">
                          CPU details not available (no quota configured)
                        </Alert>
                      </Col>
                    )}
                  </Row>

                  {/* Network chart */}
                  {hasNetwork && (
                    <Row className="mb-3">
                      <Col xs={12} md={6}>
                        <ReactApexChart
                          options={netCharts.networkChartOptions}
                          series={netCharts.networkChartSeries}
                          type="bar"
                          height={200}
                        />
                      </Col>
                    </Row>
                  )}

                  {/* Filesystem chart */}
                  {hasFS && (
                    <Row className="mb-3">
                      <Col xs={12} md={6}>
                        <ReactApexChart
                          options={fsCharts.fsChartOptions}
                          series={fsCharts.fsChartSeries}
                          type="bar"
                          height={200}
                        />
                      </Col>
                    </Row>
                  )}
                </>
              )}

              {!metricsLoading && !metricsError && !taskMetrics && (
                <Alert variant="info">
                  <FontAwesomeIcon icon="info-circle" className="me-2" />
                  Metrics not available for this task
                </Alert>
              )}
            </Tab>

            <Tab eventKey="table" title="Table">
              <JsonTable json={taskObj} />
            </Tab>

            <Tab eventKey="json" title="JSON">
              <pre>{JSON.stringify(taskObj, null, 2)}</pre>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  )
}

export { DetailsTaskComponent }

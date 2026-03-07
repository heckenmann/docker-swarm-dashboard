import { useAtomValue } from 'jotai'
import { isDarkModeAtom } from '../../../common/store/atoms'
import { Alert, Row, Col, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ReactApexChart from 'react-apexcharts'
import { getCommonChartOptions } from '../../../common/chartUtils'
import {
  formatBytesCompact as formatBytes,
  pctClass,
} from '../../../common/formatUtils'

// ─── Chart builder helpers ─────────────────────────────────────────────────

/**
 * Build memory gauge + donut chart configurations.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @param {boolean} isDarkMode
 * @returns {{ memGaugeOptions, memGaugeSeries, memDonutOptions, memDonutSeries }}
 */
function buildMemoryCharts(m, commonOpts, isDarkMode) {
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

/**
 * Build CPU gauge + pie chart configurations.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @param {boolean} isDarkMode
 * @returns {{ cpuGaugeOptions, cpuGaugeSeries, cpuBreakdownOptions, cpuBreakdownSeries }}
 */
function buildCPUCharts(m, commonOpts, isDarkMode) {
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

/**
 * Build network bar chart configuration.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @returns {{ networkChartOptions, networkChartSeries }}
 */
function buildNetworkChart(m, commonOpts) {
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

/**
 * Build filesystem stacked-bar chart configuration.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @returns {{ fsChartOptions, fsChartSeries }}
 */
function buildFSChart(m, commonOpts) {
  const fsUsed = m.fsUsage || 0
  const fsAvail = m.fsLimit > 0 ? Math.max(0, m.fsLimit - fsUsed) : 0
  const fsChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'bar', stacked: true },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Filesystem'], title: { text: 'GB' } },
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

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Container metrics section for a task: summary row, memory/CPU/network/FS
 * charts, and loading / error states.
 * @param {object} props
 * @param {object|null} props.taskMetrics - Fetched metrics object (null when unavailable)
 * @param {boolean} props.metricsLoading - Whether the metrics fetch is in progress
 * @param {string|null} props.metricsError - Error message if the fetch failed
 */
function TaskMetricsContent({ taskMetrics, metricsLoading, metricsError }) {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const commonOpts = getCommonChartOptions(isDarkMode, false)

  const memCharts = taskMetrics
    ? buildMemoryCharts(taskMetrics, commonOpts, isDarkMode)
    : null
  const cpuCharts = taskMetrics
    ? buildCPUCharts(taskMetrics, commonOpts, isDarkMode)
    : null
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
    <>
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
                  {taskMetrics.containerId?.split('/').pop().substring(0, 12)}
                </code>
              </Col>
              <Col xs={12} md={6}>
                <strong>Memory:</strong> {formatBytes(taskMetrics.usage || 0)}
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
                  <span className={`ms-2 ${pctClass(taskMetrics.cpuPercent)}`}>
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
                taskMetrics.limit > 0 || taskMetrics.usagePercent > 0 ? 7 : 12
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
    </>
  )
}

export {
  TaskMetricsContent,
  buildMemoryCharts,
  buildCPUCharts,
  buildNetworkChart,
  buildFSChart,
}

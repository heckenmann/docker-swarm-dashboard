import React from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Alert, Row, Col, Spinner, Badge } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ReactApexChart from 'react-apexcharts'
import { isDarkModeAtom } from '../../../common/store/atoms/themeAtoms'
import {
  getCommonChartOptions,
  METRIC_THRESHOLDS,
} from '../../../common/chartUtils'
import { formatBytesCompact as formatBytes } from '../../../common/formatUtils'
import { buildMemoryCharts } from './MemoryCharts.jsx'
import { buildCPUCharts } from './CpuCharts.jsx'
import { buildNetworkChart } from './NetworkChart.jsx'
import { buildFSChart } from './fsChart.jsx'
import MetricCard from '../../shared/MetricCard.jsx'
import MetricGrid from '../../shared/MetricGrid.jsx'

const KpiBadge = ({ icon, label, value, colorClass }) => (
  <div className="d-flex align-items-center me-3 mb-1">
    <FontAwesomeIcon
      icon={icon}
      className={`me-2 ${colorClass || 'text-muted'}`}
    />
    <span className="text-muted small me-1">{label}:</span>
    <span className={`fw-medium ${colorClass || ''}`}>{value}</span>
  </div>
)

KpiBadge.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  colorClass: PropTypes.string,
}

KpiBadge.defaultProps = {
  colorClass: '',
}

const KpiHeader = ({ taskMetrics, hasNetwork }) => {
  const containerId =
    (taskMetrics.containerId?.split('/') || [])
      .pop()
      ?.replace('docker-', '')
      ?.replace('.scope', '')
      ?.substring(0, 12) || 'N/A'

  const cpuStatusClass =
    taskMetrics.cpuPercent > METRIC_THRESHOLDS.critical
      ? 'bg-danger'
      : taskMetrics.cpuPercent > METRIC_THRESHOLDS.warning
        ? 'bg-warning text-dark'
        : 'bg-success'

  const memStatusClass =
    taskMetrics.usagePercent > METRIC_THRESHOLDS.critical
      ? 'bg-danger'
      : taskMetrics.usagePercent > METRIC_THRESHOLDS.warning
        ? 'bg-warning text-dark'
        : 'bg-success'

  return (
    <MetricCard title="Container Summary" icon="info-circle" className="mb-3">
      <div className="d-flex flex-wrap align-items-center">
        <div className="me-auto mb-1">
          <span className="text-muted small me-1">Container:</span>
          <code className="fs-6">{containerId}</code>
        </div>
        <KpiBadge
          icon="memory"
          label="Memory"
          value={`${formatBytes(taskMetrics.usage || 0)}${taskMetrics.limit > 0 ? ` / ${formatBytes(taskMetrics.limit)}` : ''}`}
        />
        {taskMetrics.usagePercent > 0 && (
          <Badge className={`ms-1 ${memStatusClass}`}>
            {taskMetrics.usagePercent.toFixed(1)}%
          </Badge>
        )}
        <KpiBadge
          icon="microchip"
          label="CPU"
          value={`${(taskMetrics.cpuUsage || 0).toFixed(2)}s`}
          colorClass={
            taskMetrics.cpuPercent > METRIC_THRESHOLDS.critical
              ? 'text-danger'
              : taskMetrics.cpuPercent > METRIC_THRESHOLDS.warning
                ? 'text-warning'
                : ''
          }
        />
        {taskMetrics.cpuPercent > 0 && (
          <Badge className={`ms-1 ${cpuStatusClass}`}>
            {taskMetrics.cpuPercent.toFixed(1)}%
          </Badge>
        )}
        {hasNetwork && (
          <KpiBadge
            icon="network-wired"
            label="Network"
            value={`↓ ${formatBytes(taskMetrics.networkRxBytes || 0)} / ↑ ${formatBytes(taskMetrics.networkTxBytes || 0)}`}
          />
        )}
      </div>
    </MetricCard>
  )
}

KpiHeader.propTypes = {
  taskMetrics: PropTypes.shape({
    containerId: PropTypes.string,
    cpuPercent: PropTypes.number,
    cpuUsage: PropTypes.number,
    usage: PropTypes.number,
    usagePercent: PropTypes.number,
    limit: PropTypes.number,
    networkRxBytes: PropTypes.number,
    networkTxBytes: PropTypes.number,
  }).isRequired,
  hasNetwork: PropTypes.bool.isRequired,
}

/**
 * Container metrics section for a task: summary row, memory/CPU/network/FS
 * charts, and loading / error states.
 * @param {object} props
 * @param {object|null} props.taskMetrics - Fetched metrics object (null when unavailable)
 * @param {boolean} props.metricsLoading - Whether the metrics fetch is in progress
 * @param {string|null} props.metricsError - Error message if the fetch failed
 */
const TaskMetricsContent = React.memo(function TaskMetricsContent({
  taskMetrics,
  metricsLoading,
  metricsError,
}) {
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
          <KpiHeader taskMetrics={taskMetrics} hasNetwork={hasNetwork} />

          <MetricGrid>
            <MetricCard title="Memory Usage" icon="memory" chartContent>
              {taskMetrics.usage > 0 || taskMetrics.workingSet > 0 ? (
                <Row>
                  <Col xs={12} md={5} className="mb-3 mb-md-0">
                    <ReactApexChart
                      options={memCharts.memGaugeOptions}
                      series={memCharts.memGaugeSeries}
                      type="radialBar"
                      height={280}
                    />
                  </Col>
                  <Col xs={12} md={7}>
                    <ReactApexChart
                      options={memCharts.memDonutOptions}
                      series={memCharts.memDonutSeries}
                      type="donut"
                      height={280}
                    />
                  </Col>
                </Row>
              ) : (
                <Alert variant="info" className="mb-0">
                  No memory data available
                </Alert>
              )}
            </MetricCard>

            <MetricCard title="CPU Usage" icon="microchip" chartContent>
              {taskMetrics.cpuUsage > 0 ||
              taskMetrics.cpuUserSeconds > 0 ||
              taskMetrics.cpuSystemSeconds > 0 ? (
                <Row>
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
                  {hasCPUBreakdown && (
                    <Col xs={12} md={7}>
                      <ReactApexChart
                        options={cpuCharts.cpuBreakdownOptions}
                        series={cpuCharts.cpuBreakdownSeries}
                        type="pie"
                        height={280}
                      />
                    </Col>
                  )}
                </Row>
              ) : (
                <Alert variant="info" className="mb-0">
                  No CPU data available
                </Alert>
              )}
            </MetricCard>

            {hasNetwork && (
              <MetricCard
                title="Network Traffic"
                icon="network-wired"
                chartContent
              >
                <ReactApexChart
                  options={netCharts.networkChartOptions}
                  series={netCharts.networkChartSeries}
                  type="bar"
                  height={200}
                />
              </MetricCard>
            )}

            {hasFS && (
              <MetricCard title="Filesystem Usage" icon="hdd" chartContent>
                <ReactApexChart
                  options={fsCharts.fsChartOptions}
                  series={fsCharts.fsChartSeries}
                  type="bar"
                  height={200}
                />
              </MetricCard>
            )}
          </MetricGrid>
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
})

TaskMetricsContent.propTypes = {
  taskMetrics: PropTypes.object,
  metricsLoading: PropTypes.bool.isRequired,
  metricsError: PropTypes.string,
}

export default TaskMetricsContent

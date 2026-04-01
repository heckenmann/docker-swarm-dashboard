import React from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Alert, Row, Col } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { isDarkModeAtom } from '../../../common/store/atoms/themeAtoms'
import { getCommonChartOptions } from '../../../common/chartUtils'
import { formatBytes } from '../../../common/formatUtils'

/**
 * Renders Memory usage donut chart (Active / Buffers+Cache / Available)
 * and Swap usage donut chart.
 * @param {object} props
 * @param {object} props.memoryData - Memory metrics from node-exporter
 */
const NodeMemorySection = React.memo(function NodeMemorySection({
  memoryData,
}) {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const commonOpts = getCommonChartOptions(isDarkMode)

  // ── Memory Donut ───────────────────────────────────────────────────────────
  const memTotal = memoryData.total || 0
  const memAvailable = memoryData.available || 0
  const memBuffers = memoryData.buffers || 0
  const memCached = memoryData.cached || 0
  const memBuffersCache = memBuffers + memCached
  const memUsedRaw = memTotal - memAvailable
  const memActive = Math.max(0, memUsedRaw - memBuffersCache)

  const memoryChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'donut', height: 350 },
    labels:
      memBuffersCache > 0
        ? ['Active Used', 'Buffers/Cache', 'Available']
        : ['Used', 'Available'],
    title: { text: 'Memory Usage', align: 'center' },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => formatBytes(memTotal),
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

  const memoryChartSeries =
    memBuffersCache > 0
      ? [memActive, memBuffersCache, memAvailable]
      : [memUsedRaw, memAvailable]

  // ── Swap Donut ─────────────────────────────────────────────────────────────
  const swapTotal = memoryData.swapTotal || 0
  const swapUsed = memoryData.swapUsed || 0
  const swapFree = memoryData.swapFree || 0

  const swapChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'donut', height: 350 },
    labels: ['Used', 'Free'],
    title: { text: 'Swap Usage', align: 'center' },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => formatBytes(swapTotal),
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

  const swapChartSeries = [swapUsed, swapFree]

  return (
    <Row className="mb-3">
      <Col xs={12} md={6} lg={8} className="mb-3 mb-lg-0">
        {memTotal > 0 ? (
          <ReactApexChart
            options={memoryChartOptions}
            series={memoryChartSeries}
            type="donut"
            height={350}
          />
        ) : (
          <Alert variant="info">No memory metrics available</Alert>
        )}
      </Col>
      <Col xs={12} md={6} lg={4}>
        {swapTotal > 0 ? (
          <ReactApexChart
            options={swapChartOptions}
            series={swapChartSeries}
            type="donut"
            height={350}
          />
        ) : (
          <Alert variant="info">No swap configured</Alert>
        )}
      </Col>
    </Row>
  )
})

NodeMemorySection.propTypes = {
  memoryData: PropTypes.object.isRequired,
}

export default NodeMemorySection

import React from 'react'
import { useAtomValue } from 'jotai'
import { isDarkModeAtom } from '../../../common/store/atoms/themeAtoms'
import { Alert, Row, Col } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { getCommonChartOptions } from '../../../common/chartUtils'

/**
 * Renders CPU mode distribution donut chart and load average radialBar gauge.
 * @param {object} props
 * @param {Array<{mode: string, value: number}>} props.cpuData - Per-mode CPU seconds
 * @param {object} props.systemData - System metrics (numCPUs, load1, load5, load15)
 */
const NodeCpuSection = React.memo(function NodeCpuSection({
  cpuData,
  systemData,
}) {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const commonOpts = getCommonChartOptions(isDarkMode)
  const textColor = isDarkMode ? '#e0e0e0' : '#373d3f'
  const numCPUs = systemData.numCPUs || 1

  // ── CPU Mode Distribution Donut ────────────────────────────────────────────
  const totalCPUSeconds = cpuData.reduce((sum, m) => sum + m.value, 0)

  const cpuChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'donut', height: 350 },
    labels: cpuData.map((m) => m.mode),
    title: {
      text: `CPU Mode Distribution (${systemData.numCPUs || '?'} cores)`,
      align: 'center',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Sec',
              formatter: () => totalCPUSeconds.toFixed(0),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val.toFixed(1) + '%',
    },
    tooltip: {
      ...commonOpts.tooltip,
      y: {
        formatter: (val, opts) => {
          const seconds = cpuData[opts.seriesIndex]?.value || 0
          return `${val.toFixed(1)}% (${seconds.toFixed(0)}s)`
        },
      },
    },
  }

  const cpuChartSeries = cpuData.map((m) =>
    totalCPUSeconds > 0
      ? parseFloat(((m.value / totalCPUSeconds) * 100).toFixed(2))
      : 0,
  )

  // ── Load Average Gauge (relative to CPU count) ─────────────────────────────
  const loadGaugeOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'radialBar', height: 350 },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: { margin: 5, size: '30%' },
        dataLabels: {
          name: { fontSize: '13px', colors: [textColor] },
          value: {
            fontSize: '12px',
            colors: [textColor],
            formatter: (val, opts) => {
              const idx =
                opts?.config?.plotOptions?.radialBar?._seriesIndex ?? 0
              const rawLoads = [
                systemData.load1,
                systemData.load5,
                systemData.load15,
              ]
              return (rawLoads[idx] ?? 0).toFixed(2)
            },
          },
        },
        track: { background: isDarkMode ? '#444' : '#e0e0e0' },
      },
    },
    colors: ['#0d6efd', '#6f42c1', '#20c997'],
    labels: ['1m', '5m', '15m'],
    legend: {
      show: true,
      floating: true,
      fontSize: '12px',
      position: 'left',
      labels: { colors: textColor },
      markers: { size: 0 },
      formatter: (seriesName, opts) => {
        const rawLoads = [systemData.load1, systemData.load5, systemData.load15]
        return `${seriesName}: ${(rawLoads[opts.seriesIndex] ?? 0).toFixed(2)}`
      },
    },
    title: { text: `Load Average (${numCPUs} cores)`, align: 'center' },
  }

  const loadGaugeSeries = [
    Math.min(
      parseFloat((((systemData.load1 || 0) / numCPUs) * 100).toFixed(1)),
      200,
    ),
    Math.min(
      parseFloat((((systemData.load5 || 0) / numCPUs) * 100).toFixed(1)),
      200,
    ),
    Math.min(
      parseFloat((((systemData.load15 || 0) / numCPUs) * 100).toFixed(1)),
      200,
    ),
  ]

  return (
    <Row className="mb-3">
      <Col xs={12} md={6} className="mb-3 mb-md-0">
        {cpuData.length > 0 ? (
          <ReactApexChart
            options={cpuChartOptions}
            series={cpuChartSeries}
            type="donut"
            height={350}
          />
        ) : (
          <Alert variant="info">No CPU metrics available</Alert>
        )}
      </Col>
      <Col xs={12} md={6}>
        {systemData.load1 !== undefined ? (
          <ReactApexChart
            options={loadGaugeOptions}
            series={loadGaugeSeries}
            type="radialBar"
            height={350}
          />
        ) : (
          <Alert variant="info">No load average available</Alert>
        )}
      </Col>
    </Row>
  )
})

export default NodeCpuSection

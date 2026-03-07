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
import { getCommonChartOptions } from '../common/chartUtils'
import { formatBytes, formatUptime } from '../common/formatUtils'

/**
 * Component to display node metrics from node-exporter
 * @param {object} props - Component props
 * @param {string} props.nodeId - The ID of the node to fetch metrics for
 */
function NodeMetricsComponent({ nodeId }) {
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

  const commonOpts = getCommonChartOptions(isDarkMode)
  const textColor = isDarkMode ? '#e0e0e0' : '#373d3f'

  // ── CPU: percentage-distribution donut (lifetime mode shares) ──────────────
  const totalCPUSeconds = cpuData.reduce((sum, m) => sum + m.value, 0)
  const numCPUs = systemData.numCPUs || 1

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

  // ── Memory: 3-part donut (Active Used / Buffers+Cache / Available) ─────────
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

  // Swap Chart (if swap exists)
  const swapTotal = memoryData.swapTotal || 0
  const swapUsed = memoryData.swapUsed || 0
  const swapFree = memoryData.swapFree || 0

  const swapChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'donut',
      height: 350,
    },
    labels: ['Used', 'Free'],
    title: {
      text: 'Swap Usage',
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

  // Filesystem Chart
  const filesystemChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 300,
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
      categories: filesystemData.map((fs) => fs.mountpoint || fs.device),
      title: {
        text: 'Storage (GB)',
      },
    },
    title: {
      text: 'Filesystem Usage',
      align: 'center',
    },
  }

  const filesystemChartSeries = [
    {
      name: 'Used',
      data: filesystemData.map((fs) =>
        (fs.used / 1024 / 1024 / 1024).toFixed(2),
      ),
    },
    {
      name: 'Available',
      data: filesystemData.map((fs) =>
        (fs.available / 1024 / 1024 / 1024).toFixed(2),
      ),
    },
  ]

  // Network Traffic Chart
  const networkChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatBytes(val),
    },
    xaxis: {
      ...commonOpts.xaxis,
      categories: networkData.map((net) => net.interface),
      title: {
        text: 'Bytes',
      },
    },
    title: {
      text: 'Network Traffic',
      align: 'center',
    },
  }

  const networkChartSeries = [
    {
      name: 'Received',
      data: networkData.map((net) => net.receiveBytes),
    },
    {
      name: 'Transmitted',
      data: networkData.map((net) => net.transmitBytes),
    },
  ]

  // Disk I/O Throughput Chart
  const diskIOChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatBytes(val),
    },
    xaxis: {
      ...commonOpts.xaxis,
      categories: diskIOData.map((disk) => disk.device),
      title: {
        text: 'Bytes',
      },
    },
    title: {
      text: 'Disk I/O Throughput (Total)',
      align: 'center',
    },
  }

  const diskIOChartSeries = [
    {
      name: 'Read',
      data: diskIOData.map((disk) => disk.readBytes),
    },
    {
      name: 'Written',
      data: diskIOData.map((disk) => disk.writtenBytes),
    },
  ]

  // Disk IOPS Chart
  const diskIOPSChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val.toLocaleString(),
    },
    xaxis: {
      ...commonOpts.xaxis,
      categories: diskIOData.map((disk) => disk.device),
      title: {
        text: 'Operations',
      },
    },
    title: {
      text: 'Disk IOPS (Total)',
      align: 'center',
    },
  }

  const diskIOPSChartSeries = [
    {
      name: 'Reads',
      data: diskIOData.map((disk) => disk.readsCompleted),
    },
    {
      name: 'Writes',
      data: diskIOData.map((disk) => disk.writesCompleted),
    },
  ]

  // ── TCP Donut (InUse / TimeWait / Free) ─────────────────────────────────────
  const tcpFree = Math.max(
    0,
    (tcpData.alloc || 0) - (tcpData.inuse || 0) - (tcpData.timeWait || 0),
  )
  const tcpDonutOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'donut', height: 300 },
    labels: ['In Use', 'Time Wait', 'Free'],
    title: {
      text: `TCP Sockets (CurrEstab: ${tcpData.currEstab || 0})`,
      align: 'center',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Allocated',
              formatter: () => (tcpData.alloc || 0).toLocaleString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: true, formatter: (val) => val.toFixed(1) + '%' },
  }
  const tcpDonutSeries = [tcpData.inuse || 0, tcpData.timeWait || 0, tcpFree]

  // ── File Descriptor Gauge ───────────────────────────────────────────────────
  const fdPct = parseFloat((fdData.usedPercent || 0).toFixed(1))
  const fdGaugeOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'radialBar', height: 300 },
    plotOptions: {
      radialBar: {
        hollow: { size: '55%' },
        dataLabels: {
          name: { fontSize: '14px', offsetY: -10, colors: [textColor] },
          value: {
            fontSize: '20px',
            colors: [textColor],
            formatter: (val) => val + '%',
          },
        },
        track: { background: isDarkMode ? '#444' : '#e0e0e0' },
      },
    },
    colors: [fdPct > 80 ? '#dc3545' : fdPct > 60 ? '#fd7e14' : '#198754'],
    labels: ['File Descriptors'],
    title: {
      text: `FD: ${fdData.allocated?.toLocaleString() || 'N/A'} / ${fdData.maximum?.toLocaleString() || 'N/A'}`,
      align: 'center',
    },
  }
  const fdGaugeSeries = [fdPct]

  return (
    <Card.Body>
      {/* System Info Header */}
      <Alert variant="secondary" className="mb-3 py-2">
        <Row>
          <Col xs={12} md={6} className="mb-1 mb-md-0">
            <strong>Server Time:</strong> {serverTime}
          </Col>
          <Col xs={12} md={6}>
            {systemData.load1 !== undefined && (
              <span>
                <strong>Load Avg:</strong> {systemData.load1.toFixed(2)}
                {', '}
                {systemData.load5.toFixed(2)}, {systemData.load15.toFixed(2)}
              </span>
            )}
            {systemData.uptimeSeconds !== undefined && (
              <span className="ms-3">
                <strong>Uptime:</strong>{' '}
                {formatUptime(systemData.uptimeSeconds)}
              </span>
            )}
          </Col>
        </Row>
        <Row className="mt-1">
          <Col xs={12} md={6} className="mb-1 mb-md-0">
            {ntpData.syncStatus !== undefined && (
              <span>
                <strong>NTP Sync:</strong>{' '}
                {ntpData.syncStatus === 1 ? (
                  <span className="text-success">✓ Synchronized</span>
                ) : (
                  <span className="text-warning">⚠ Not Synchronized</span>
                )}
                {ntpData.offsetSeconds !== undefined && (
                  <span className="ms-2">
                    (Offset: {(ntpData.offsetSeconds * 1000).toFixed(2)} ms)
                  </span>
                )}
              </span>
            )}
          </Col>
          <Col xs={12} md={6}>
            {systemData.numCPUs > 0 && (
              <span>
                <strong>CPUs:</strong> {systemData.numCPUs}
              </span>
            )}
            {systemData.procsRunning !== undefined && (
              <span className="ms-3">
                <strong>Processes:</strong> {systemData.procsRunning} running
                {systemData.procsBlocked > 0 &&
                  `, ${systemData.procsBlocked} blocked`}
              </span>
            )}
          </Col>
        </Row>
      </Alert>

      {/* CPU and Load Average */}
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

      {/* Memory Charts */}
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

      {/* Filesystem and Network Charts */}
      <Row className="mb-3">
        <Col xs={12} lg={6} className="mb-3 mb-lg-0">
          {filesystemData.length > 0 ? (
            <ReactApexChart
              options={filesystemChartOptions}
              series={filesystemChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <Alert variant="info">No filesystem metrics available</Alert>
          )}
        </Col>
        <Col xs={12} lg={6}>
          {networkData.length > 0 ? (
            <ReactApexChart
              options={networkChartOptions}
              series={networkChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <Alert variant="info">No network metrics available</Alert>
          )}
        </Col>
      </Row>

      {/* Disk I/O Charts */}
      <Row className="mb-3">
        <Col xs={12} lg={6} className="mb-3 mb-lg-0">
          {diskIOData.length > 0 ? (
            <ReactApexChart
              options={diskIOChartOptions}
              series={diskIOChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <Alert variant="info">No disk I/O metrics available</Alert>
          )}
        </Col>
        <Col xs={12} lg={6}>
          {diskIOData.length > 0 ? (
            <ReactApexChart
              options={diskIOPSChartOptions}
              series={diskIOPSChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <Alert variant="info">No disk IOPS metrics available</Alert>
          )}
        </Col>
      </Row>

      {/* Network Details Table */}
      {networkData.length > 0 && (
        <Row className="mb-3">
          <Col>
            <h6>Network Details</h6>
            <Table
              striped
              bordered
              hover
              size={tableSize}
              variant={isDarkMode ? 'dark' : 'light'}
            >
              <thead>
                <tr>
                  <th>Interface</th>
                  <th>RX Packets</th>
                  <th>TX Packets</th>
                  <th>RX Errors</th>
                  <th>TX Errors</th>
                  <th>RX Dropped</th>
                  <th>TX Dropped</th>
                </tr>
              </thead>
              <tbody>
                {networkData.map((net) => (
                  <tr key={net.interface}>
                    <td>{net.interface}</td>
                    <td>{net.receivePackets?.toLocaleString() || 0}</td>
                    <td>{net.transmitPackets?.toLocaleString() || 0}</td>
                    <td className={net.receiveErrs > 0 ? 'text-warning' : ''}>
                      {net.receiveErrs?.toLocaleString() || 0}
                    </td>
                    <td className={net.transmitErrs > 0 ? 'text-warning' : ''}>
                      {net.transmitErrs?.toLocaleString() || 0}
                    </td>
                    <td className={net.receiveDrop > 0 ? 'text-warning' : ''}>
                      {net.receiveDrop?.toLocaleString() || 0}
                    </td>
                    <td className={net.transmitDrop > 0 ? 'text-warning' : ''}>
                      {net.transmitDrop?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}

      {/* TCP Donut + FD Gauge */}
      <Row className="mb-3">
        <Col xs={12} lg={6} className="mb-3 mb-lg-0">
          {tcpData.alloc > 0 ? (
            <ReactApexChart
              options={tcpDonutOptions}
              series={tcpDonutSeries}
              type="donut"
              height={300}
            />
          ) : (
            <Alert variant="info">No TCP metrics available</Alert>
          )}
        </Col>
        <Col xs={12} lg={6}>
          {fdData.allocated > 0 ? (
            <ReactApexChart
              options={fdGaugeOptions}
              series={fdGaugeSeries}
              type="radialBar"
              height={300}
            />
          ) : (
            <Alert variant="info">No file descriptor metrics available</Alert>
          )}
        </Col>
      </Row>

      {/* System Stats Table */}
      <Row className="mb-3">
        <Col>
          <h6>System Statistics</h6>
          <Table
            striped
            bordered
            size={tableSize}
            variant={isDarkMode ? 'dark' : 'light'}
          >
            <tbody>
              <tr>
                <td>
                  <strong>Context Switches:</strong>
                </td>
                <td>{systemData.contextSwitches?.toLocaleString() || 'N/A'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Interrupts:</strong>
                </td>
                <td>{systemData.interrupts?.toLocaleString() || 'N/A'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Processes (Running/Blocked):</strong>
                </td>
                <td>
                  {systemData.procsRunning || 0} /{' '}
                  {systemData.procsBlocked || 0}
                </td>
              </tr>
              {systemData.entropyAvailBits > 0 && (
                <tr>
                  <td>
                    <strong>Entropy Available (bits):</strong>
                  </td>
                  <td>
                    {systemData.entropyAvailBits?.toLocaleString() || 'N/A'}
                  </td>
                </tr>
              )}
              {systemData.pageFaults > 0 && (
                <tr>
                  <td>
                    <strong>Page Faults:</strong>
                  </td>
                  <td>{systemData.pageFaults?.toLocaleString() || 'N/A'}</td>
                </tr>
              )}
              {systemData.majorPageFaults > 0 && (
                <tr>
                  <td>
                    <strong>Major Page Faults:</strong>
                  </td>
                  <td>
                    {systemData.majorPageFaults?.toLocaleString() || 'N/A'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Disk I/O Details Table */}
      {diskIOData.length > 0 && (
        <Row className="mb-3">
          <Col>
            <h6>Disk I/O Details</h6>
            <Table
              striped
              bordered
              hover
              size={tableSize}
              variant={isDarkMode ? 'dark' : 'light'}
            >
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Reads</th>
                  <th>Writes</th>
                  <th>Read Bytes</th>
                  <th>Written Bytes</th>
                  <th>I/O Time (s)</th>
                  <th>Weighted I/O Time (s)</th>
                </tr>
              </thead>
              <tbody>
                {diskIOData.map((disk) => (
                  <tr key={disk.device}>
                    <td>{disk.device}</td>
                    <td>{disk.readsCompleted?.toLocaleString() || 0}</td>
                    <td>{disk.writesCompleted?.toLocaleString() || 0}</td>
                    <td>{formatBytes(disk.readBytes || 0)}</td>
                    <td>{formatBytes(disk.writtenBytes || 0)}</td>
                    <td>{disk.ioTimeSeconds?.toFixed(2) || 0}</td>
                    <td>{disk.ioTimeWeightedSeconds?.toFixed(2) || 0}</td>
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
            Metrics refresh with global interval. Data from node-exporter
            service.
          </small>
        </Col>
      </Row>
    </Card.Body>
  )
}

export { NodeMetricsComponent }

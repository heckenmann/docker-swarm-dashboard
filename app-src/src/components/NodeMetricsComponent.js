import { useState, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import {
  baseUrlAtom,
  isDarkModeAtom,
  tableSizeAtom,
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
 * Format uptime in human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
function formatUptime(seconds) {
  if (!seconds) return 'N/A'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${minutes}m`
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
 * Component to display node metrics from node-exporter
 * @param {object} props - Component props
 * @param {string} props.nodeId - The ID of the node to fetch metrics for
 */
function NodeMetricsComponent({ nodeId }) {
  const baseURL = useAtomValue(baseUrlAtom)
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const tableSize = useAtomValue(tableSizeAtom)
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

  // CPU Chart
  const cpuChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 350,
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
      ...commonOpts.xaxis,
      title: {
        text: 'Seconds',
      },
    },
    title: {
      text: `CPU Time by Mode (${systemData.numCPUs || '?'} cores)`,
      align: 'center',
    },
    legend: {
      show: false,
    },
  }

  const cpuChartSeries = [
    {
      name: 'CPU Seconds',
      data: cpuData.map((metric) => ({
        x: metric.mode,
        y: parseFloat(metric.value.toFixed(2)),
      })),
    },
  ]

  // Memory Chart
  const memTotal = memoryData.total || 0
  const memAvailable = memoryData.available || 0
  const memUsed = memTotal - memAvailable

  const memoryChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'donut',
      height: 350,
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

  const memoryChartSeries = [memUsed, memAvailable]

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
                <strong>Uptime:</strong> {formatUptime(systemData.uptimeSeconds)}
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
                {systemData.procsBlocked > 0 && `, ${systemData.procsBlocked} blocked`}
              </span>
            )}
          </Col>
        </Row>
      </Alert>

      {/* CPU and Memory Charts */}
      <Row className="mb-3">
        <Col xs={12} md={6} lg={4} className="mb-3 mb-lg-0">
          {cpuData.length > 0 ? (
            <ReactApexChart
              options={cpuChartOptions}
              series={cpuChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <Alert variant="info">No CPU metrics available</Alert>
          )}
        </Col>
        <Col xs={12} md={6} lg={4} className="mb-3 mb-lg-0">
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
        <Col xs={12} md={12} lg={4}>
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

      {/* System Stats Table */}
      <Row className="mb-3">
        <Col xs={12} lg={6} className="mb-3 mb-lg-0">
          <h6>TCP Connections</h6>
          <Table
            striped
            bordered
            size={tableSize}
            variant={isDarkMode ? 'dark' : 'light'}
          >
            <tbody>
              <tr>
                <td>
                  <strong>Allocated:</strong>
                </td>
                <td>{tcpData.alloc?.toLocaleString() || 'N/A'}</td>
              </tr>
              <tr>
                <td>
                  <strong>In Use:</strong>
                </td>
                <td>{tcpData.inuse?.toLocaleString() || 'N/A'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Established:</strong>
                </td>
                <td>{tcpData.currEstab?.toLocaleString() || 'N/A'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Time Wait:</strong>
                </td>
                <td>{tcpData.timeWait?.toLocaleString() || 'N/A'}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col xs={12} lg={6}>
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
                  <strong>File Descriptors:</strong>
                </td>
                <td>
                  {fdData.allocated?.toLocaleString() || 'N/A'} /{' '}
                  {fdData.maximum?.toLocaleString() || 'N/A'}
                  {fdData.usedPercent > 0 &&
                    ` (${fdData.usedPercent.toFixed(2)}%)`}
                </td>
              </tr>
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
            Metrics refresh with global interval. Data from node-exporter service.
          </small>
        </Col>
      </Row>
    </Card.Body>
  )
}

export { NodeMetricsComponent }

import { useAtomValue } from 'jotai'
import { isDarkModeAtom, tableSizeAtom } from '../../common/store/atoms'
import { Alert, Row, Col, Table } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { getCommonChartOptions } from '../../common/chartUtils'
import { formatBytes } from '../../common/formatUtils'

/**
 * Renders disk I/O throughput bar chart, disk IOPS bar chart and a
 * disk I/O details table (reads, writes, bytes and I/O time per device).
 * @param {object} props
 * @param {Array} props.diskIOData - Disk I/O metrics from node-exporter
 */
function NodeDiskIOSection({ diskIOData }) {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const commonOpts = getCommonChartOptions(isDarkMode)

  // ── Disk I/O Throughput Chart ──────────────────────────────────────────────
  const diskIOChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'bar', height: 350 },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: true, formatter: (val) => formatBytes(val) },
    xaxis: {
      ...commonOpts.xaxis,
      categories: diskIOData.map((disk) => disk.device),
      title: { text: 'Bytes' },
    },
    title: { text: 'Disk I/O Throughput (Total)', align: 'center' },
  }

  const diskIOChartSeries = [
    { name: 'Read', data: diskIOData.map((disk) => disk.readBytes) },
    { name: 'Written', data: diskIOData.map((disk) => disk.writtenBytes) },
  ]

  // ── Disk IOPS Chart ────────────────────────────────────────────────────────
  const diskIOPSChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'bar', height: 350 },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: true, formatter: (val) => val.toLocaleString() },
    xaxis: {
      ...commonOpts.xaxis,
      categories: diskIOData.map((disk) => disk.device),
      title: { text: 'Operations' },
    },
    title: { text: 'Disk IOPS (Total)', align: 'center' },
  }

  const diskIOPSChartSeries = [
    { name: 'Reads', data: diskIOData.map((disk) => disk.readsCompleted) },
    { name: 'Writes', data: diskIOData.map((disk) => disk.writesCompleted) },
  ]

  return (
    <>
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
    </>
  )
}

export { NodeDiskIOSection }

import React from 'react'
import { useAtomValue } from 'jotai'
import { isDarkModeAtom } from '../../../common/store/atoms/themeAtoms'
import { tableSizeAtom } from '../../../common/store/atoms/uiAtoms'
import { Alert, Row, Col, Table } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { getCommonChartOptions } from '../../../common/chartUtils'
import { formatBytes } from '../../../common/formatUtils'

/**
 * Renders filesystem usage bar chart, network traffic bar chart and a
 * network details table (packets, errors and drops per interface).
 * @param {object} props
 * @param {Array} props.filesystemData - Filesystem metrics from node-exporter
 * @param {Array} props.networkData - Network interface metrics from node-exporter
 */
const NodeFilesystemNetworkSection = React.memo(
  function NodeFilesystemNetworkSection({ filesystemData, networkData }) {
    const isDarkMode = useAtomValue(isDarkModeAtom)
    const tableSize = useAtomValue(tableSizeAtom)
    const commonOpts = getCommonChartOptions(isDarkMode)

    // ── Filesystem Bar Chart ───────────────────────────────────────────────────
    const filesystemChartOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'bar', height: 300, stacked: true },
      plotOptions: { bar: { horizontal: true } },
      dataLabels: { enabled: false },
      xaxis: {
        ...commonOpts.xaxis,
        categories: filesystemData.map((fs) => fs.mountpoint || fs.device),
        title: { text: 'Storage (GB)' },
      },
      title: { text: 'Filesystem Usage', align: 'center' },
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

    // ── Network Traffic Bar Chart ──────────────────────────────────────────────
    const networkChartOptions = {
      ...commonOpts,
      chart: { ...commonOpts.chart, type: 'bar', height: 350 },
      plotOptions: { bar: { horizontal: true } },
      dataLabels: { enabled: true, formatter: (val) => formatBytes(val) },
      xaxis: {
        ...commonOpts.xaxis,
        categories: networkData.map((net) => net.interface),
        title: { text: 'Bytes' },
      },
      title: { text: 'Network Traffic', align: 'center' },
    }

    const networkChartSeries = [
      { name: 'Received', data: networkData.map((net) => net.receiveBytes) },
      {
        name: 'Transmitted',
        data: networkData.map((net) => net.transmitBytes),
      },
    ]

    return (
      <>
        {/* Filesystem + Network Charts */}
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
                      <td
                        className={net.transmitErrs > 0 ? 'text-warning' : ''}
                      >
                        {net.transmitErrs?.toLocaleString() || 0}
                      </td>
                      <td className={net.receiveDrop > 0 ? 'text-warning' : ''}>
                        {net.receiveDrop?.toLocaleString() || 0}
                      </td>
                      <td
                        className={net.transmitDrop > 0 ? 'text-warning' : ''}
                      >
                        {net.transmitDrop?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        )}
      </>
    )
  },
)

export default NodeFilesystemNetworkSection

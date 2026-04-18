import React from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Alert, Row, Col, Table } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { isDarkModeAtom } from '../../../common/store/atoms/themeAtoms'
import { tableSizeAtom } from '../../../common/store/atoms/uiAtoms'
import { getCommonChartOptions } from '../../../common/chartUtils'
import { formatBytes } from '../../../common/formatUtils'

import MetricCard from '../../shared/MetricCard.jsx'

/**
 * Renders disk I/O throughput bar chart, disk IOPS bar chart and a
 * disk I/O details table (reads, writes, bytes and I/O time per device).
 * @param {object} props
 * @param {Array} props.diskIOData - Disk I/O metrics from node-exporter
 */
const NodeDiskIOSection = React.memo(function NodeDiskIOSection({
  diskIOData,
}) {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const commonOpts = getCommonChartOptions(isDarkMode)

  const diskIOChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 350,
      id: 'disk-io-bar',
    },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: true, formatter: (val) => formatBytes(val) },
    xaxis: {
      ...commonOpts.xaxis,
      categories: diskIOData.map((disk) => disk.device),
      title: { text: 'Bytes' },
    },
  }

  const diskIOChartSeries = [
    { name: 'Read', data: diskIOData.map((disk) => disk.readBytes) },
    { name: 'Written', data: diskIOData.map((disk) => disk.writtenBytes) },
  ]

  const diskIOPSChartOptions = {
    ...commonOpts,
    chart: {
      ...commonOpts.chart,
      type: 'bar',
      height: 350,
      id: 'disk-iops-bar',
    },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: true, formatter: (val) => val.toLocaleString() },
    xaxis: {
      ...commonOpts.xaxis,
      categories: diskIOData.map((disk) => disk.device),
      title: { text: 'Operations' },
    },
  }

  const diskIOPSChartSeries = [
    { name: 'Reads', data: diskIOData.map((disk) => disk.readsCompleted) },
    { name: 'Writes', data: diskIOData.map((disk) => disk.writesCompleted) },
  ]

  return (
    <>
      <Row className="mb-3">
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <MetricCard title="Disk I/O Throughput" icon="hdd" chartContent>
            {diskIOData.length > 0 ? (
              <ReactApexChart
                options={diskIOChartOptions}
                series={diskIOChartSeries}
                type="bar"
                height={350}
              />
            ) : (
              <Alert variant="info" className="mb-0">
                No disk I/O metrics available
              </Alert>
            )}
          </MetricCard>
        </Col>
        <Col xs={12} md={6}>
          <MetricCard title="Disk IOPS" icon="hdd" chartContent>
            {diskIOData.length > 0 ? (
              <ReactApexChart
                options={diskIOPSChartOptions}
                series={diskIOPSChartSeries}
                type="bar"
                height={350}
              />
            ) : (
              <Alert variant="info" className="mb-0">
                No disk IOPS metrics available
              </Alert>
            )}
          </MetricCard>
        </Col>
      </Row>

      {diskIOData.length > 0 && (
        <Row className="mb-3">
          <Col>
            <MetricCard
              title="Disk I/O Details"
              icon="info-circle"
              noBody={true}
            >
              <Table
                striped
                bordered
                hover
                size={tableSize}
                variant={isDarkMode ? 'dark' : 'light'}
                className="mb-0"
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
            </MetricCard>
          </Col>
        </Row>
      )}
    </>
  )
})

NodeDiskIOSection.propTypes = {
  diskIOData: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default NodeDiskIOSection

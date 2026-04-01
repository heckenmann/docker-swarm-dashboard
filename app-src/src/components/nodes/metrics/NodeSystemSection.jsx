import React from 'react'
import { useAtomValue } from 'jotai'
import { Alert, Row, Col, Table } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { isDarkModeAtom } from '../../../common/store/atoms/themeAtoms'
import { tableSizeAtom } from '../../../common/store/atoms/uiAtoms'
import { getCommonChartOptions } from '../../../common/chartUtils'

/**
 * Renders TCP socket donut chart, file descriptor radialBar gauge,
 * system statistics table and the metrics footer note.
 * @param {object} props
 * @param {object} props.tcpData - TCP socket metrics from node-exporter
 * @param {object} props.fdData - File descriptor metrics from node-exporter
 * @param {object} props.systemData - System metrics (context switches, interrupts, etc.)
 */
const NodeSystemSection = React.memo(function NodeSystemSection({
  tcpData,
  fdData,
  systemData,
}) {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const tableSize = useAtomValue(tableSizeAtom)
  const commonOpts = getCommonChartOptions(isDarkMode)
  const textColor = isDarkMode ? '#e0e0e0' : '#373d3f'

  // ── TCP Donut (InUse / TimeWait / Free) ────────────────────────────────────
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

  // ── File Descriptor Gauge ──────────────────────────────────────────────────
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
    <>
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

      {/* Footer */}
      <Row>
        <Col>
          <small className="text-muted">
            Metrics refresh with global interval. Data from node-exporter
            service.
          </small>
        </Col>
      </Row>
    </>
  )
})

export default NodeSystemSection

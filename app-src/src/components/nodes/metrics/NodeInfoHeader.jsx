import React from 'react'
import PropTypes from 'prop-types'
import { Alert, Row, Col } from 'react-bootstrap'
import { formatUptime } from '../../../common/formatUtils'

/**
 * System info header for node metrics — displays server time, load average,
 * uptime, NTP sync status, CPU count and running processes.
 * @param {object} props
 * @param {object} props.systemData - System metrics from node-exporter
 * @param {object} props.ntpData - NTP sync data
 * @param {string} props.serverTime - Formatted server time string
 */
const NodeInfoHeader = React.memo(function NodeInfoHeader({
  systemData,
  ntpData,
  serverTime,
}) {
  return (
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
              {systemData.procsBlocked > 0 &&
                `, ${systemData.procsBlocked} blocked`}
            </span>
          )}
        </Col>
      </Row>
    </Alert>
  )
})

NodeInfoHeader.propTypes = {
  systemData: PropTypes.object.isRequired,
  ntpData: PropTypes.object.isRequired,
  serverTime: PropTypes.string.isRequired,
}

export default NodeInfoHeader

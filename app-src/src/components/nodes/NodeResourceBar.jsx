import React from 'react'
import PropTypes from 'prop-types'
import { ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useAtomValue } from 'jotai'
import { loadable } from 'jotai/utils'
import { nodeMetricsAtomFamily } from '../../common/store/atoms/dashboardAtoms'
import { formatBytesCompact } from '../../common/utils/formatUtils'

/**
 * NodeResourceBar is a compact visualization component that displays the usage
 * of a specific node resource (Memory or Disk) as a color-coded progress bar.
 *
 * It fetches real-time metrics for the given node and handles root partition
 * resolution for disk metrics.
 *
 * @param {Object} props
 * @param {string} props.nodeId - The unique identifier of the Docker node.
 * @param {'memory' | 'disk'} props.type - The type of resource to visualize.
 */
const NodeResourceBar = React.memo(function NodeResourceBar({ nodeId, type }) {
  const metricsLoadable = useAtomValue(loadable(nodeMetricsAtomFamily(nodeId)))

  if (metricsLoadable.state === 'loading') {
    return (
      <div
        className="bg-light rounded w-100 d-flex align-items-center justify-content-center"
        style={{ height: '6px' }}
      >
        <div
          className="spinner-grow spinner-grow-sm text-primary"
          style={{ width: '4px', height: '4px' }}
          role="status"
        />
      </div>
    )
  }

  const json = metricsLoadable.data || { available: false }

  if (!json.available || !json.metrics) {
    return (
      <div
        className="text-muted small text-center"
        style={{ fontSize: '0.7rem' }}
      >
        N/A
      </div>
    )
  }

  const metrics = json.metrics
  let percent = 0
  let used = 0
  let total = 0
  let label = ''

  // Normalize metrics for both lowercase (Go JSON tags) and PascalCase (Go field names)
  const memory = metrics.memory || metrics.Memory
  const filesystem = metrics.filesystem || metrics.Filesystem

  if (type === 'memory' && memory) {
    label = 'Memory'
    total = Number(memory.total || memory.Total || 0)
    const available = Number(memory.available || memory.Available || 0)
    used = Math.max(0, total - available)
    if (total > 0) percent = (used / total) * 100
  } else if (type === 'disk' && filesystem) {
    label = 'Disk'
    // Find root partition
    const rootFs =
      filesystem.find((fs) => (fs.mountpoint || fs.Mountpoint) === '/') ||
      filesystem[0]
    if (rootFs) {
      total = Number(rootFs.size || rootFs.Size || 0)
      used = Number(rootFs.used || rootFs.Used || 0)
      if (total > 0) percent = (used / total) * 100
    }
  }

  if (total === 0) {
    return (
      <div
        className="text-muted small text-center"
        style={{ fontSize: '0.7rem' }}
      >
        N/A
      </div>
    )
  }

  const variant = percent > 90 ? 'danger' : percent > 75 ? 'warning' : 'success'

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip id="resource-tooltip">{`${label}: ${formatBytesCompact(
          used,
        )} / ${formatBytesCompact(total)} (${percent.toFixed(1)}%)`}</Tooltip>
      }
    >
      <ProgressBar
        now={percent}
        variant={variant}
        style={{ height: '6px' }}
        className="rounded-pill"
      />
    </OverlayTrigger>
  )
})

NodeResourceBar.propTypes = {
  nodeId: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['memory', 'disk']).isRequired,
}

export default NodeResourceBar

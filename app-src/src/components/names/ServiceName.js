/**
 * ServiceName
 * Presentational wrapper for service names. Optionally wraps the rendered name
 * with a Bootstrap Overlay/Tooltip and delegates action rendering to
 * `EntityName`.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.id
 * @param {string} [props.nameClass]
 * @param {boolean} [props.useOverlay=false]
 * @param {string|null} [props.tooltipText]
 * (Handlers are centralized; callers should not pass onOpen/onFilter)
 * @param {boolean} [props.showOpen=true]
 * @param {boolean} [props.showFilter=true]
 * @param {string} [props.size='sm']
 */
import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { EntityName } from './EntityName'

function ServiceName({
  name,
  id,
  nameClass = '',
  useOverlay = false,
  tooltipText = null,
  showOpen = true,
  showFilter = true,
  size = 'sm',
}) {
  if (!name) return null

  const nameNode = (
    <span
      className={nameClass ? nameClass : ''}
      title={tooltipText || undefined}
    >
      {name}
    </span>
  )

  const wrappedNameNode =
    useOverlay && tooltipText ? (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tt-${id}`}>{tooltipText}</Tooltip>}
      >
        {nameNode}
      </OverlayTrigger>
    ) : (
      nameNode
    )

  return (
    <EntityName
      name={name}
      id={id}
      showOpen={useOverlay ? false : showOpen}
      showFilter={useOverlay ? false : showFilter}
      size={size}
      nameClass={nameClass}
      tooltipText={tooltipText}
      nameNode={wrappedNameNode}
      entityType="service"
    />
  )
}

export { ServiceName }

'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import { Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * DSDCard - A reusable card component for the Docker Swarm Dashboard.
 *
 * This component standardizes the styling and structure of cards across the dashboard.
 * It supports customizable headers, bodies, and additional classes for flexibility.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} [props.header] - Content for the card header (legacy, use icon/title instead).
 * @param {string} [props.icon] - FontAwesome icon name for the card header.
 * @param {string} [props.title] - Title text for the card header.
 * @param {React.ReactNode} [props.headerActions] - Additional actions/content for the header (right side).
 * @param {React.ReactNode} [props.body] - Content for the card body.
 * @param {string} [props.className] - Additional classes for the card.
 * @param {string} [props.headerClassName] - Additional classes for the card header.
 * @param {string} [props.bodyClassName] - Additional classes for the card body.
 * @param {React.ReactNode} [props.children] - Fallback content if `body` prop is not provided.
 * @returns {React.ReactElement} A standardized card component.
 *
 * @example
 * // Basic usage with icon and title
 * <DSDCard
 *   icon="server"
 *   title="Nodes"
 *   body={<NodeTable />}
 * />
 *
 * @example
 * // With header actions (e.g., filter component)
 * <DSDCard
 *   icon="tasks"
 *   title="Tasks"
 *   headerActions={<FilterComponent />}
 *   body={<TasksTable />}
 * />
 *
 * @example
 * // Legacy usage with custom header
 * <DSDCard
 *   header={<h5>Node Details</h5>}
 *   body={<NodeTable />}
 * />
 *
 * @example
 * // Usage with children (no body prop)
 * <DSDCard className="mb-2">
 *   <CustomComponent />
 * </DSDCard>
 */
const DSDCard = React.memo(function DSDCard({
  header,
  icon,
  title,
  headerActions,
  body,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  children,
}) {
  // Build standardized header if icon or title is provided
  const renderHeader = () => {
    if (header) {
      // Legacy mode: use provided header content
      return <Card.Header className={headerClassName}>{header}</Card.Header>
    }

    if (icon || title) {
      // Standardized header with icon and title
      const hasActions = !!headerActions
      return (
        <Card.Header
          className={`${hasActions ? 'd-flex justify-content-between align-items-center ' : ''}${headerClassName}`}
        >
          <div>
            {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
            {title && <strong>{title}</strong>}
          </div>
          {headerActions}
        </Card.Header>
      )
    }

    return null
  }

  return (
    <Card className={`mb-3 shadow-sm ${className}`}>
      {renderHeader()}
      {body ? (
        <Card.Body className={bodyClassName}>{body}</Card.Body>
      ) : (
        children
      )}
    </Card>
  )
})

DSDCard.propTypes = {
  header: PropTypes.node,
  icon: PropTypes.string,
  title: PropTypes.string,
  headerActions: PropTypes.node,
  body: PropTypes.node,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  children: PropTypes.node,
}

export default DSDCard

import React from 'react'
import PropTypes from 'prop-types'
import { useSetAtom } from 'jotai'
import { viewAtom } from '../../../common/store/atoms/navigationAtoms'
import { networksDetailId } from '../../../common/navigationConstants'
import EntityName from './EntityName'

/**
 * Render a network name with the standard entity detail action.
 * @param {object} props - Component properties.
 * @param {string} props.name - Network display name.
 * @param {string} props.id - Full Docker network ID.
 * @returns {React.ReactElement} Network name and detail action.
 */
const NetworkName = ({ name, id }) => {
  const setView = useSetAtom(viewAtom)
  return (
    <EntityName
      name={name}
      id={id}
      entityType="network"
      showOpen={Boolean(id)}
      showFilter={false}
      onOpen={(detail) => setView({ id: networksDetailId, detail })}
    />
  )
}
NetworkName.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
}
export default NetworkName

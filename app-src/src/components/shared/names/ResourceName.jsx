import React from 'react'
import PropTypes from 'prop-types'
import { useSetAtom } from 'jotai'
import { viewAtom } from '../../../common/store/atoms/navigationAtoms'
import {
  configsDetailId,
  secretsDetailId,
} from '../../../common/navigationConstants'
import EntityName from './EntityName'

/**
 * Render a config or secret name with the standard detail action.
 * @param {object} props - Component properties.
 * @param {string} props.name - Resource display name.
 * @param {string} [props.id] - Resource ID.
 * @param {string} props.kind - Configs or secrets.
 * @returns {React.ReactElement} Resource name and detail action.
 */
const ResourceName = ({ name, id, kind }) => {
  const setView = useSetAtom(viewAtom)
  return (
    <EntityName
      name={name}
      id={id}
      entityType={kind === 'configs' ? 'config' : 'secret'}
      showOpen={Boolean(id)}
      showFilter={false}
      onOpen={(detail) =>
        setView({
          id: kind === 'configs' ? configsDetailId : secretsDetailId,
          detail,
        })
      }
    />
  )
}
ResourceName.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  kind: PropTypes.oneOf(['configs', 'secrets']).isRequired,
}
export default ResourceName

import { useState, useEffect } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  filterTypeAtom,
} from '../../common/store/atoms'

// UI imports
import {
  Form,
  InputGroup,
  Button,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * FilterComponent provides a UI for filtering services or stacks.
 *
 * The active filter type is toggled via icon-only buttons (folder = Service,
 * cubes = Stack) with tooltips. The text input shows an inline ×-clear button
 * that is only rendered when a filter is active.
 */
function FilterComponent() {
  const variant = useAtomValue(currentVariantAtom)
  const [serviceFilter, setServiceNameFilter] = useAtom(serviceNameFilterAtom)
  const [stackFilter, setStackNameFilter] = useAtom(stackNameFilterAtom)
  const [filterType, setFilterType] = useAtom(filterTypeAtom)
  const [filterValue, setFilterValue] = useState(
    `${serviceFilter}${stackFilter}`,
  )

  // Keep local UI state in sync when atoms change externally
  useEffect(() => {
    if (serviceFilter) {
      setFilterType('service')
      setFilterValue(serviceFilter)
    } else if (stackFilter) {
      setFilterType('stack')
      setFilterValue(stackFilter)
    } else {
      setFilterValue('')
    }
    // we only want to run when atoms change
  }, [serviceFilter, stackFilter])

  const changeFilterType = (type) => {
    setFilterType(type)
    changeFilterValue(type, filterValue)
  }

  const changeFilterValue = (type, value) => {
    setFilterValue(value)
    if (type === 'service') {
      setStackNameFilter('')
      setServiceNameFilter(value)
    } else if (type === 'stack') {
      setServiceNameFilter('')
      setStackNameFilter(value)
    }
  }

  return (
    <InputGroup style={{ maxWidth: '22rem' }} data-bs-theme={variant}>
      <OverlayTrigger overlay={<Tooltip>Service</Tooltip>}>
        <Button
          variant={filterType === 'service' ? 'secondary' : 'outline-secondary'}
          onClick={() => changeFilterType('service')}
          aria-label="Filter by service"
          aria-pressed={filterType === 'service'}
        >
          <FontAwesomeIcon icon="folder" />
        </Button>
      </OverlayTrigger>
      <OverlayTrigger overlay={<Tooltip>Stack</Tooltip>}>
        <Button
          variant={filterType === 'stack' ? 'secondary' : 'outline-secondary'}
          onClick={() => changeFilterType('stack')}
          aria-label="Filter by stack"
          aria-pressed={filterType === 'stack'}
        >
          <FontAwesomeIcon icon="cubes" />
        </Button>
      </OverlayTrigger>
      <Form.Control
        placeholder="Filter…"
        value={filterValue}
        onChange={(event) => changeFilterValue(filterType, event.target.value)}
        aria-label={`Filter by ${filterType} name`}
      />
      {filterValue && (
        <Button
          variant="outline-secondary"
          onClick={() => changeFilterValue(filterType, '')}
          aria-label="Clear filter"
        >
          <FontAwesomeIcon icon="times" />
        </Button>
      )}
    </InputGroup>
  )
}

export { FilterComponent }

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Form, InputGroup } from 'react-bootstrap'
import { useState } from 'react'
import { useAtom, useAtomValue } from 'jotai/index'
import {
  currentVariantAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
} from '../common/store/atoms'

function FilterComponent() {
  const variant = useAtomValue(currentVariantAtom)
  const [serviceFilter, setServiceNameFilter] = useAtom(serviceNameFilterAtom)
  const [stackFilter, setStackNameFilter] = useAtom(stackNameFilterAtom)
  const [filterType, setFilterType] = useState(
    serviceFilter ? 'service' : stackFilter ? 'stack' : 'service',
  )
  const [filterValue, setFilterValue] = useState(
    `${serviceFilter}${stackFilter}`,
  )

  const changeFilterType = (filterType) => {
    setFilterType(filterType)
    changeFilterValue(filterType, filterValue)
  }

  const changeFilterValue = (filterType, filterValue) => {
    setFilterValue(filterValue)
    if (filterType === 'service') {
      setStackNameFilter('')
      setServiceNameFilter(filterValue)
    } else if (filterType === 'stack') {
      setServiceNameFilter('')
      setStackNameFilter(filterValue)
    }
  }

  return (
    <Form className="mb-2" data-bs-theme={variant}>
      <InputGroup className="d-flex flex-nowrap">
        <InputGroup.Text>
          <FontAwesomeIcon icon="filter" />
        </InputGroup.Text>
        <Form.Select
          className="w-auto"
          value={filterType}
          onChange={(event) => {
            changeFilterType(event.target.value)
          }}
        >
          <option value="service">Service</option>
          <option value="stack">Stack</option>
        </Form.Select>
        <Form.Control
          className="w-75"
          placeholder={`Filter services by ${filterType} name`}
          value={filterValue}
          onChange={(event) =>
            changeFilterValue(filterType, event.target.value)
          }
        />
        <Button
          variant={filterValue ? 'danger' : 'outline-secondary'}
          onClick={() => changeFilterValue(filterType, '')}
          disabled={!filterValue}
        >
          <FontAwesomeIcon icon="times" />
        </Button>
      </InputGroup>
    </Form>
  )
}

export { FilterComponent }

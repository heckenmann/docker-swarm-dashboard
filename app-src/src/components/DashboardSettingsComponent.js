import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom } from 'jotai'
import {
  Button,
  ButtonGroup,
  Col,
  Form,
  InputGroup,
  Row,
} from 'react-bootstrap'
import { dashboardHId, dashboardVId } from '../common/navigationConstants'
import {
  serviceNameFilterAtom,
  dashboardSettingsDefaultLayoutViewIdAtom,
  viewAtom,
  stackNameFilterAtom,
  currentVariantAtom,
} from '../common/store/atoms'
import { useAtomValue } from 'jotai/index'
import { useState } from 'react'

function DashboardSettingsComponent() {
  const [view, updateViewId] = useAtom(viewAtom)
  const defaultLayout = useAtomValue(dashboardSettingsDefaultLayoutViewIdAtom)
  const [serviceFilter, setServiceNameFilter] = useAtom(serviceNameFilterAtom)
  const [stackFilter, setStackNameFilter] = useAtom(stackNameFilterAtom)
  const variant = useAtomValue(currentVariantAtom)
  const [filterType, setFilterType] = useState('service')
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

  const vertical =
    view?.id == dashboardVId || (!view.id && defaultLayout == dashboardVId)
  return (
    <>
      <Form className="mb-2" data-bs-theme={variant}>
        <Row className="align-items-start">
          <Col xs="auto">
            <ButtonGroup>
              <Button
                variant={`${vertical ? 'outline-' : ''}secondary`}
                onClick={() => updateViewId({ id: dashboardHId })}
              >
                <FontAwesomeIcon icon="grip" />
              </Button>
              <Button
                variant={`${vertical ? '' : 'outline-'}secondary`}
                onClick={() => updateViewId({ id: dashboardVId })}
              >
                <FontAwesomeIcon icon="grip-vertical" />
              </Button>
            </ButtonGroup>
          </Col>
          <Col xs={7}>
            <InputGroup>
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
            </InputGroup>
          </Col>
        </Row>
      </Form>
    </>
  )
}

export { DashboardSettingsComponent }

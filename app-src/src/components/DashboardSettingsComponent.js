import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom } from 'jotai'
import { Button, ButtonGroup, Col, Form, Row } from 'react-bootstrap'
import { dashboardHId, dashboardVId } from '../common/navigationConstants'
import {
  currentVariantAtom,
  dashboardSettingsDefaultLayoutViewIdAtom,
  viewAtom,
} from '../common/store/atoms'
import { useAtomValue } from 'jotai/index'
import { FilterComponent } from './FilterComponent'

/**
 * DashboardSettingsComponent is a React functional component that renders
 * the settings for the dashboard, including layout options and a filter component.
 */
function DashboardSettingsComponent() {
  const [view, updateViewId] = useAtom(viewAtom)
  const defaultLayout = useAtomValue(dashboardSettingsDefaultLayoutViewIdAtom)
  const variant = useAtomValue(currentVariantAtom)

  const vertical =
    view?.id === dashboardVId || (!view?.id && defaultLayout === dashboardVId)
  return (
    <>
      <Row className="align-items-start">
        <Col xs="auto">
          <Form className="mb-2" data-bs-theme={variant}>
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
          </Form>
        </Col>
        <Col xs={7}>
          <FilterComponent />
        </Col>
      </Row>
    </>
  )
}

export { DashboardSettingsComponent }

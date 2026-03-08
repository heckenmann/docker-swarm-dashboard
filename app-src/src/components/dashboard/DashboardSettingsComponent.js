import { useAtom } from 'jotai'
import { dashboardHId, dashboardVId } from '../../common/navigationConstants'
import {
  currentVariantAtom,
  dashboardSettingsDefaultLayoutViewIdAtom,
  viewAtom,
} from '../../common/store/atoms'
import { useAtomValue } from 'jotai'
import { ButtonGroup, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FilterComponent } from '../shared/FilterComponent'

/**
 * DashboardSettingsComponent renders layout toggle buttons on the left
 * and the shared FilterComponent flush-right, matching the standard
 * Card.Header pattern used across the dashboard.
 */
function DashboardSettingsComponent() {
  const [view, updateViewId] = useAtom(viewAtom)
  const defaultLayout = useAtomValue(dashboardSettingsDefaultLayoutViewIdAtom)
  const variant = useAtomValue(currentVariantAtom)

  const vertical =
    view?.id === dashboardVId || (!view?.id && defaultLayout === dashboardVId)

  return (
    <div
      className="d-flex justify-content-between align-items-center w-100"
      data-bs-theme={variant}
    >
      <div className="d-flex align-items-center gap-2">
        <div>
          <FontAwesomeIcon
            icon={vertical ? 'grip-vertical' : 'grip'}
            className="me-2"
          />
          <strong>Dashboard</strong>
        </div>
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
      </div>
      <FilterComponent />
    </div>
  )
}

export { DashboardSettingsComponent }

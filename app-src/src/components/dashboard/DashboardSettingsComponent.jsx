import React from 'react'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai'
import { ButtonGroup, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { dashboardHId, dashboardVId } from '../../common/navigationConstants'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import { dashboardSettingsDefaultLayoutViewIdAtom } from '../../common/store/atoms/dashboardAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import FilterComponent from '../shared/FilterComponent'

/**
 * DashboardSettingsComponent renders layout toggle buttons on the left
 * and the shared FilterComponent flush-right, matching the standard
 * Card.Header pattern used across the dashboard.
 */
const DashboardSettingsComponent = React.memo(
  function DashboardSettingsComponent() {
    const [view, updateViewId] = useAtom(viewAtom)
    const defaultLayout = useAtomValue(dashboardSettingsDefaultLayoutViewIdAtom)
    const variant = useAtomValue(currentVariantAtom)

    const vertical =
      view?.id === dashboardVId || (!view?.id && defaultLayout === dashboardVId)

    return (
      <div className="d-flex align-items-center gap-2" data-bs-theme={variant}>
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
        <FilterComponent />
      </div>
    )
  },
)

export default DashboardSettingsComponent

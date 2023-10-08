import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom } from 'jotai'
import { Button, ButtonGroup } from 'react-bootstrap'
import { dashboardHId, dashboardVId } from '../common/navigationConstants'
import { viewAtom } from '../common/store/atoms'

function DashboardSettingsComponent() {
  const [view, updateViewId] = useAtom(viewAtom)
  const vertical = view?.id == dashboardVId
  return (
    <>
      <ButtonGroup>
        <Button
          size="xl"
          variant={vertical ? 'outline-secondary' : 'secondary'}
          onClick={() => updateViewId({ id: dashboardHId })}
        >
          <FontAwesomeIcon icon="grip" />
        </Button>
        <Button
          size="xl"
          variant={vertical ? 'secondary' : 'outline-secondary'}
          onClick={() => updateViewId({ id: dashboardVId })}
        >
          <FontAwesomeIcon icon="grip-vertical" />
        </Button>
      </ButtonGroup>
    </>
  )
}

export { DashboardSettingsComponent }

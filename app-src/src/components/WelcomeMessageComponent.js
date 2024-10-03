import { Button, Modal } from 'react-bootstrap'
import { useAtom, useAtomValue } from 'jotai'
import {
  currentVariantClassesAtom,
  dashboardSettingsAtom,
  showWelcomeMessageAtom,
} from '../common/store/atoms'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function WelcomeMessageComponent() {
  let [showWelcomeMessage, setShowWelcomeMessage] = useAtom(
    showWelcomeMessageAtom,
  )
  let dashboardSettings = useAtomValue(dashboardSettingsAtom)
  let currentVariantClasses = useAtomValue(currentVariantClassesAtom)

  return (
    <Modal
      show={showWelcomeMessage && dashboardSettings.welcomeMessage}
      onHide={() => setShowWelcomeMessage(false)}
      contentClassName={currentVariantClasses}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon="info-circle" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{dashboardSettings.welcomeMessage}</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => setShowWelcomeMessage(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export { WelcomeMessageComponent }

import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Modal, Button } from 'react-bootstrap'
import { currentVariantClassesAtom } from '../../common/store/atoms/themeAtoms'
import { dashboardSettingsAtom } from '../../common/store/atoms/foundationAtoms'
import { showWelcomeMessageAtom } from '../../common/store/atoms/uiAtoms'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * WelcomeMessageComponent
 * Displays a dismissible modal with the configured welcome message from
 * dashboard settings. Uses Jotai atoms to control visibility and styling.
 *
 * @returns {JSX.Element|null} The welcome modal when enabled.
 */
const WelcomeMessageComponent = React.memo(function WelcomeMessageComponent() {
  const [showWelcomeMessage, setShowWelcomeMessage] = useAtom(
    showWelcomeMessageAtom,
  )
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)

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
})

export default WelcomeMessageComponent

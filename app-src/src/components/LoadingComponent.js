import { useAtomValue } from 'jotai'
import { Card } from 'react-bootstrap'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
} from '../common/store/atoms'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import LoadingBar from './LoadingBar'

/**
 * LoadingComponent is a functional component that displays a loading spinner
 * with a background and classes based on the current variant.
 */
function LoadingComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <Card
        bg={currentVariant}
        className={`${currentVariantClasses} card-elevated p-4 loading-card`}
      >
        <Card.Body className="text-center">
          <div className="d-flex flex-column align-items-center">
            <FontAwesomeIcon
              icon="spinner"
              className="rotating mb-3"
              style={{ fontSize: '2.25rem' }}
              aria-hidden="true"
            />
            <h4 className="mb-0 loading-title">Loading</h4>
            <div className="loading-subtitle">Preparing the dashboard…</div>
            <div className="w-100 mt-3">
              <LoadingBar force={true} />
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

export default LoadingComponent

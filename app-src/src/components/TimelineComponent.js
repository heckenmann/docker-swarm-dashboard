import { Card } from 'react-bootstrap'
import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
} from '../common/store/atoms'

function TimelineComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  return (
    <>
      <Card bg={currentVariant} className={currentVariantClasses}>
        <Card.Body></Card.Body>
      </Card>
    </>
  )
}

export { TimelineComponent }

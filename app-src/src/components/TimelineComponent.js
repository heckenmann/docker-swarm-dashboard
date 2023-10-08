import { Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAtom, useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  isDarkModeAtom,
} from '../common/store/atoms'
import HorizontalTimeline from 'react-horizontal-timeline'

function TimelineComponent() {
  const isDarkMode = useAtomValue(isDarkModeAtom)
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  return (
    <>
      //{' '}
      <Card bg={currentVariant} className={currentVariantClasses}>
        // <Card.Body>// // </Card.Body>
        //{' '}
      </Card>
      <HorizontalTimeline
        styles={{
          background: '#fff',
          foreground: '#1A79AD',
          outline: '#dfdfdf',
        }}
        index={0}
        indexClick={(index) => {}}
        getLabel={(date, index) => date}
        values={['1960']}
      />
    </>
  )
}

export { TimelineComponent }

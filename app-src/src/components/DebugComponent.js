import { useAtomValue } from 'jotai'
import { Card } from 'react-bootstrap'
import {
  currentSyntaxHighlighterStyleAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardHAtom,
  dashboardVAtom,
  nodesAtomNew,
  portsAtom,
  stacksAtom,
  tasksAtomNew,
} from '../common/store/atoms'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'

function DebugComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const currentSyntaxHighlighterStyle = useAtomValue(
    currentSyntaxHighlighterStyleAtom,
  )

  const debugJson = {
    dashboardh: useAtomValue(dashboardHAtom),
    dashboardv: useAtomValue(dashboardVAtom),
    stacks: useAtomValue(stacksAtom),
    nodes: useAtomValue(nodesAtomNew),
    tasks: useAtomValue(tasksAtomNew),
    ports: useAtomValue(portsAtom),
    services: null,
  }

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Body>
        <h1>Debug</h1>
        <h2>API Dump</h2>
        <SyntaxHighlighter style={currentSyntaxHighlighterStyle}>
          {JSON.stringify(debugJson, null, 2)}
        </SyntaxHighlighter>
      </Card.Body>
    </Card>
  )
}

export { DebugComponent }

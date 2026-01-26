import { useAtomValue } from 'jotai'
import {
  currentSyntaxHighlighterStyleAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardHAtom,
  dashboardSettingsAtom,
  dashboardVAtom,
  nodesAtomNew,
  portsAtom,
  stacksAtom,
  tasksAtomNew,
  versionAtom,
} from '../common/store/atoms'

/**
 * DebugComponent is a React functional component that displays debugging information.
 * It uses various atoms from Jotai to fetch and display the current state of the application.
 */
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
    settings: useAtomValue(dashboardSettingsAtom),
    version: useAtomValue(versionAtom),
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

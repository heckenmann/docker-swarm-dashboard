import { useAtomValue } from 'jotai'
import {
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
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          <code>{JSON.stringify(debugJson, null, 2)}</code>
        </pre>
      </Card.Body>
    </Card>
  )
}

export { DebugComponent }

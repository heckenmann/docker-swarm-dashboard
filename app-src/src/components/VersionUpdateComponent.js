import { useAtomValue } from 'jotai'
import { Card } from 'react-bootstrap'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardSettingsAtom,
  versionAtom,
} from '../common/store/atoms'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function VersionUpdateComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const version = useAtomValue(versionAtom)

  const dockerComposeExample = `
        services:
          dsd_docker-swarm-dashboard:
            image: ghcr.io/heckenmann/docker-swarm-dashboard:latest
            [...]
            environment:
              DSD_VERSION_CHECK_ENABLED: 'true'
            [...]
        `

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Body>
        <h2 className="text-center">
          {dashboardSettings.versionCheckEnabled ? (
            version.updateAvailable ? (
              <>
                Update to {version.remoteVersion} available!{' '}
                <FontAwesomeIcon icon="check" style={{ color: 'green' }} />
              </>
            ) : (
              <>Your version {dashboardSettings.version} is up to date</>
            )
          ) : (
            <>Automatic version checks are disabled</>
          )}
        </h2>
        <h3>How to enable update checks</h3>
        <p>
          Set the environment variable <code>DSD_VERSION_CHECK_ENABLED</code> to{' '}
          <code>true</code> in the service configuration to enable regular
          update checks for the Docker Swarm Dashboard. For example, in your{' '}
          <code>docker-compose.yml</code>:
        </p>

        <pre>
          <code>{dockerComposeExample}</code>
        </pre>
      </Card.Body>
    </Card>
  )
}

export { VersionUpdateComponent }

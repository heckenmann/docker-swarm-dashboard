import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  dashboardSettingsAtom,
  versionAtom,
} from '../../common/store/atoms'
import { Alert, Badge, Card, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const RELEASES_URL =
  'https://github.com/heckenmann/docker-swarm-dashboard/releases'

/**
 * Format an ISO timestamp string as a human-readable local date/time.
 * Returns an em-dash when the input is empty or invalid.
 *
 * @param {string} isoString - ISO 8601 / RFC 3339 timestamp, or empty string.
 * @returns {string} Formatted local date-time string or '—'.
 */
function formatLastChecked(isoString) {
  if (!isoString) return '—'
  try {
    return new Date(isoString).toLocaleString()
  } catch {
    return isoString
  }
}

/**
 * VersionUpdateComponent shows the current and latest version with an update
 * call-to-action, or explains how to enable version checks when disabled.
 */
function VersionUpdateComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const version = useAtomValue(versionAtom)

  const dockerComposeExample = `services:
  dsd_docker-swarm-dashboard:
    image: ghcr.io/heckenmann/docker-swarm-dashboard:latest
    [...]
    environment:
      DSD_VERSION_CHECK_ENABLED: 'true'
    [...]`

  return (
    <Card bg={currentVariant} className={currentVariantClasses}>
      <Card.Body>
        <h2 className="text-center mb-4">
          <FontAwesomeIcon icon="cloud-download-alt" className="me-2" />
          Version
        </h2>

        {dashboardSettings.versionCheckEnabled ? (
          <>
            {version.updateAvailable ? (
              <Alert variant="info" className="text-center">
                <FontAwesomeIcon
                  icon="arrow-up-right-from-square"
                  className="me-2"
                />
                <strong>Update {version.remoteVersion} available!</strong>{' '}
                <a
                  href={RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="alert-link"
                >
                  View release notes
                </a>
              </Alert>
            ) : (
              <Alert variant="success" className="text-center">
                <FontAwesomeIcon icon="check-circle" className="me-2" />
                Your installation is <strong>up to date</strong>.
              </Alert>
            )}

            <Table variant={currentVariant} bordered size="sm" className="mt-3">
              <tbody>
                <tr>
                  <th className="w-50">Installed version</th>
                  <td>
                    <code>{version.version || '—'}</code>
                  </td>
                </tr>
                <tr>
                  <th>Latest release</th>
                  <td>
                    {version.remoteVersion ? (
                      <a
                        href={`${RELEASES_URL}/tag/${version.remoteVersion}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <code>{version.remoteVersion}</code>
                      </a>
                    ) : (
                      <span className="text-muted">not checked yet</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>
                    {version.updateAvailable ? (
                      <Badge bg="warning" text="dark">
                        Update available
                      </Badge>
                    ) : (
                      <Badge bg="success">Up to date</Badge>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Last checked</th>
                  <td className="text-muted">
                    <small>{formatLastChecked(version.lastChecked)}</small>
                  </td>
                </tr>
              </tbody>
            </Table>
          </>
        ) : (
          <>
            <Alert variant="warning" className="text-center">
              <FontAwesomeIcon icon="times-circle" className="me-2" />
              Automatic version checks are <strong>disabled</strong>.
            </Alert>

            <h3>How to enable update checks</h3>
            <p>Note: version checks are only performed for release versions.</p>
            <p>
              Set <code>DSD_VERSION_CHECK_ENABLED</code> to <code>true</code> in
              the service configuration. For example, in your{' '}
              <code>docker-compose.yml</code>:
            </p>
            <pre className="p-3 rounded border">
              <code>{dockerComposeExample}</code>
            </pre>
            <p className="mt-2">
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon
                  icon="arrow-up-right-from-square"
                  className="me-1"
                />
                Browse all releases on GitHub
              </a>
            </p>
          </>
        )}
      </Card.Body>
    </Card>
  )
}

export { VersionUpdateComponent }

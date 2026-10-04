import React, { useMemo, useState } from 'react'
import { useAtomValue } from 'jotai'
import { Button, Form, InputGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DSDCard from '../common/DSDCard.jsx'
import {
  baseUrlAtom,
  dashboardSettingsAtom,
} from '../../common/store/atoms/foundationAtoms'

/**
 * Builds the externally visible MCP endpoint from the dashboard origin and
 * configured API path. The API host itself is intentionally ignored so local
 * development/mock API overrides cannot leak into connection instructions.
 *
 * @param {string} baseUrl - Configured dashboard API base URL or path.
 * @param {{origin: string, pathname: string}} location - Browser location.
 * @returns {string} Absolute Streamable HTTP MCP endpoint URL.
 */
export function buildMcpUrl(baseUrl, location = window.location) {
  let path = location.pathname || '/'

  try {
    const parsedBase = new URL(baseUrl || path, location.origin)
    path = parsedBase.pathname || '/'
  } catch {
    // Keep the current dashboard path when an invalid custom base URL is set.
  }

  if (!path.startsWith('/')) path = '/' + path
  if (!path.endsWith('/')) path += '/'

  return new URL(path + 'mcp', location.origin).toString()
}

/**
 * McpComponent explains how to connect an MCP-capable agent to the dashboard.
 *
 * @returns {React.ReactElement|null} MCP connection instructions when enabled.
 */
const McpComponent = React.memo(function McpComponent() {
  const baseUrl = useAtomValue(baseUrlAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)
  const [copyStatus, setCopyStatus] = useState('')
  const mcpUrl = useMemo(() => buildMcpUrl(baseUrl), [baseUrl])

  if (!dashboardSettings?.mcpEnabled) return null

  const copyMcpUrl = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is not available')
      }
      await navigator.clipboard.writeText(mcpUrl)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Copy failed')
    }
  }

  const body = (
    <div className="d-grid gap-3">
      <p className="mb-0">
        Docker Swarm Dashboard exposes its read-only cluster information to
        MCP-capable agents through a remote Model Context Protocol server.
      </p>

      <dl className="row mb-0">
        <dt className="col-sm-3">Server name</dt>
        <dd className="col-sm-9">
          <code>docker-swarm-dashboard</code>
        </dd>
        <dt className="col-sm-3">Transport</dt>
        <dd className="col-sm-9">
          <code>Streamable HTTP</code>
        </dd>
      </dl>

      <div>
        <Form.Label htmlFor="mcp-url">MCP URL</Form.Label>
        <InputGroup>
          <Form.Control
            id="mcp-url"
            aria-label="MCP URL"
            value={mcpUrl}
            readOnly
          />
          <Button
            variant="outline-secondary"
            onClick={copyMcpUrl}
            aria-label="Copy MCP URL"
          >
            <FontAwesomeIcon icon="copy" className="me-1" />
            Copy
          </Button>
        </InputGroup>
        {copyStatus && (
          <div className="small text-muted mt-1" role="status">
            {copyStatus}
          </div>
        )}
      </div>

      <div>
        <h6>Connect an agent</h6>
        <ol className="mb-0">
          <li>Open the MCP or server configuration of your agent/client.</li>
          <li>Add a remote MCP server.</li>
          <li>Select Streamable HTTP as the transport.</li>
          <li>
            Use <code>docker-swarm-dashboard</code> as the server name.
          </li>
          <li>Paste the MCP URL shown above.</li>
          <li>Connect and allow the client to discover the available tools.</li>
        </ol>
      </div>
    </div>
  )

  return <DSDCard icon="plug" title="MCP" body={body} />
})

export default McpComponent

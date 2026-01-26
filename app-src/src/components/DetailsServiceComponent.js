import { useAtomValue } from 'jotai'
import {
  currentSyntaxHighlighterStyleAtom,
  currentVariantAtom,
  currentVariantClassesAtom,
  serviceDetailAtom,
} from '../common/store/atoms'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'

/**
 * Component to display the details of a service.
 * It uses various atoms to get the current state and displays the service details
 * in a card with tabs for table and JSON views.
 */
function DetailsServiceComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const currentSyntaxHighlighterStyle = useAtomValue(
    currentSyntaxHighlighterStyleAtom,
  )

  const currentService = useAtomValue(serviceDetailAtom)

  if (!currentService) return <div>Service doesn't exist</div>

  // Defensive sanitizer: ensure fields that are used as element attributes
  // (for example `src` or `image`) are primitive strings/numbers so React
  // doesn't warn about non-primitive attribute values. We create a shallow
  // copy with coerced values for keys that may map to element attrs.
  const sanitizeAttrs = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    const copy = Array.isArray(obj)
      ? obj.map((v) => sanitizeAttrs(v))
      : { ...obj }
    Object.keys(copy).forEach((k) => {
      const v = copy[k]
      const lk = String(k).toLowerCase()
      if (lk === 'src' || lk === 'image' || lk === 'logo') {
        if (v === null || v === undefined) copy[k] = ''
        else if (typeof v === 'object') {
          try {
            copy[k] = JSON.stringify(v)
          } catch {
            copy[k] = String(v)
          }
        } else {
          copy[k] = String(v)
        }
      } else if (typeof v === 'object') {
        copy[k] = sanitizeAttrs(v)
      }
    })
    return copy
  }

  const sanitizedService = sanitizeAttrs(currentService.service)

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}
    >
      <Card className={currentVariantClasses}>
        <Card.Header>
          <h5>
            <FontAwesomeIcon icon="folder" /> Service "
            {currentService.service?.Spec?.Name}"
          </h5>
        </Card.Header>
        <Card.Body>
          <Tabs className="mb-3">
            <Tab eventKey="table" title="Table">
              <JsonTable json={sanitizedService} variant={currentVariant} />
            </Tab>
            <Tab eventKey="json" title="JSON">
              <SyntaxHighlighter
                language="javascript"
                style={currentSyntaxHighlighterStyle}
              >
                {JSON.stringify(sanitizedService, null, '\t')}
              </SyntaxHighlighter>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
      <Card className={currentVariantClasses}>
        <Card.Header>
          <h5>
            <FontAwesomeIcon icon="tasks" /> Tasks for this Service
          </h5>
        </Card.Header>
        <Table striped bordered hover size="sm" variant={currentVariant}>
          <thead>
            <tr>
              <th>Node</th>
              <th>State</th>
              <th>Desired State</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {currentService.tasks &&
              currentService.tasks.map((task, idx) => (
                <tr
                  key={
                    (task && task.ID ? String(task.ID) : `task-idx-${idx}`) +
                    `-${idx}`
                  }
                >
                  <td>
                    <NodeName name={task.NodeName} id={task.NodeID} />
                  </td>
                  <td>
                    <ServiceStatusBadge
                      id={task.ID}
                      serviceState={task.Status?.State || task.State}
                    />
                  </td>
                  <td>{task.DesiredState}</td>
                  <td>
                    {toDefaultDateTimeString(task.CreatedAt || task.Timestamp)}
                  </td>
                  <td>
                    {toDefaultDateTimeString(
                      task.UpdatedAt || task.CreatedAt || task.Timestamp,
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

export { DetailsServiceComponent }

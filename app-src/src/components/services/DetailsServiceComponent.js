import { useAtomValue } from 'jotai'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  serviceDetailAtom,
  baseUrlAtom,
  viewAtom,
} from '../../common/store/atoms'
import { Card, Tabs, Tab } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { JsonTable } from '../shared/JsonTable'
import { useState, useEffect } from 'react'
import { ServiceMetricsComponent } from './ServiceMetricsComponent'
import { ServiceTasksTab } from './details/ServiceTasksTab'

/**
 * Displays full details for a service: metrics, tasks table with per-task
 * metrics, a structured table view and a raw JSON tab.
 */
function DetailsServiceComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const baseURL = useAtomValue(baseUrlAtom)
  const view = useAtomValue(viewAtom)
  const currentService = useAtomValue(serviceDetailAtom)

  const [taskMetrics, setTaskMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      if (!currentService?.service?.ID) return
      try {
        setMetricsLoading(true)
        const response = await fetch(
          `${baseURL}docker/services/${currentService.service.ID}/metrics`,
        )
        const data = await response.json()
        if (!mounted) return
        if (data.available && data.metrics?.containers) {
          const metricsMap = {}
          data.metrics.containers.forEach((container) => {
            const key = container.taskName || container.taskId
            if (key) metricsMap[key] = container
          })
          setTaskMetrics(metricsMap)
        } else {
          setTaskMetrics(null)
        }
      } catch (err) {
        console.error('Failed to fetch task metrics:', err)
        setTaskMetrics(null)
      } finally {
        if (mounted) setMetricsLoading(false)
      }
    }

    fetchMetrics()
    return () => {
      mounted = false
    }
  }, [baseURL, currentService?.service?.ID, view?.timestamp])

  if (!currentService) return <div>Service doesn&apos;t exist</div>

  const serviceObj = currentService.service
  const tasksForService = currentService.tasks || []

  // Sanitize object keys that map to HTML element attributes (e.g. src, image)
  const sanitizeAttrs = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    const copy = Array.isArray(obj) ? obj.map(sanitizeAttrs) : { ...obj }
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

  const sanitizedService = sanitizeAttrs(serviceObj || {})

  return (
    <Card className={currentVariantClasses}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <FontAwesomeIcon icon="folder" className="me-2" />
          <strong>
            Service &quot;
            {serviceObj?.Spec?.Name || serviceObj?.Name || 'unknown'}&quot;
          </strong>
        </div>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto' }}>
        <Tabs className="mb-3" defaultActiveKey="metrics">
          <Tab eventKey="metrics" title="Metrics">
            <ServiceMetricsComponent serviceId={serviceObj?.ID} />
          </Tab>
          <Tab eventKey="tasks" title="Tasks">
            <ServiceTasksTab
              tasksForService={tasksForService}
              taskMetrics={taskMetrics}
              metricsLoading={metricsLoading}
            />
          </Tab>
          <Tab eventKey="table" title="Table">
            <JsonTable json={sanitizedService} variant={currentVariant} />
          </Tab>
          <Tab eventKey="json" title="JSON">
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              <code>{JSON.stringify(sanitizedService, null, '\t')}</code>
            </pre>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  )
}

export { DetailsServiceComponent }

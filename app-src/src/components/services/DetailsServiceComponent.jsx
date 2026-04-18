import React from 'react'
import { useAtomValue } from 'jotai'
import { Card, Tabs, Tab } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, useEffect } from 'react'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
} from '../../common/store/atoms/themeAtoms'
import { serviceDetailAtom } from '../../common/store/atoms/navigationAtoms'
import { baseUrlAtom } from '../../common/store/atoms/foundationAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import JsonTable from '../shared/JsonTable.jsx'
import ServiceMetricsComponent from './ServiceMetricsComponent'
import ServiceTasksTab from './details/ServiceTasksTab'

import MetricCard from '../shared/MetricCard.jsx'

/**
 * Displays full details for a service: metrics, tasks table with per-task
 * metrics, a structured table view and a raw JSON tab.
 */
const DetailsServiceComponent = React.memo(function DetailsServiceComponent() {
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
            if (container.taskId) metricsMap[container.taskId] = container
            if (container.taskName) metricsMap[container.taskName] = container
          })
          setTaskMetrics(metricsMap)
        } else {
          setTaskMetrics(null)
        }
      } catch {
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
            <MetricCard title="Service Properties" icon="table" noBody={true}>
              <JsonTable json={sanitizedService} variant={currentVariant} />
            </MetricCard>
          </Tab>
          <Tab eventKey="json" title="JSON">
            <MetricCard title="Raw JSON" icon="code">
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
                className="mb-0"
              >
                <code>{JSON.stringify(sanitizedService, null, '\t')}</code>
              </pre>
            </MetricCard>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  )
})

export default DetailsServiceComponent

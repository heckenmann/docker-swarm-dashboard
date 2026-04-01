import React from 'react'
import { useAtomValue } from 'jotai'
import { Card, Tabs, Tab } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, useEffect } from 'react'
import { currentVariantClassesAtom } from '../../common/store/atoms/themeAtoms'
import { taskDetailAtom } from '../../common/store/atoms/navigationAtoms'
import { baseUrlAtom } from '../../common/store/atoms/foundationAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import JsonTable from '../shared/JsonTable.jsx'
import TaskInfoTable from './details/TaskInfoTable.jsx'
import TaskMetricsContent from './details/TaskMetricsContent.jsx'

/**
 * Displays full details for a single task: an info table, container metrics
 * charts, a structured table view and a raw JSON tab.
 */
const DetailsTaskComponent = React.memo(function DetailsTaskComponent() {
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const baseURL = useAtomValue(baseUrlAtom)
  const view = useAtomValue(viewAtom)
  const currentTask = useAtomValue(taskDetailAtom)

  const [taskMetrics, setTaskMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      if (!currentTask?.ID) return
      try {
        setMetricsLoading(true)
        setMetricsError(null)
        const response = await fetch(
          `${baseURL}docker/tasks/${currentTask.ID}/metrics`,
        )
        const data = await response.json()
        if (!mounted) return
        if (data.available && data.metrics) {
          setTaskMetrics(data.metrics)
        } else {
          setTaskMetrics(null)
          if (data.message) setMetricsError(data.message)
        }
      } catch (err) {
        console.error('Failed to fetch task metrics:', err)
        setTaskMetrics(null)
        setMetricsError('Failed to fetch metrics from cAdvisor')
      } finally {
        if (mounted) setMetricsLoading(false)
      }
    }

    fetchMetrics()
    return () => {
      mounted = false
    }
  }, [baseURL, currentTask?.ID, view?.timestamp])

  if (!currentTask) return <div>Task doesn&apos;t exist</div>

  return (
    <div>
      <Card className={currentVariantClasses}>
        <Card.Header>
          <FontAwesomeIcon icon="tasks" className="me-2" />
          <strong>Task Details</strong>
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="metrics" className="mb-3">
            <Tab eventKey="metrics" title="Metrics">
              <TaskInfoTable taskObj={currentTask} />
              <TaskMetricsContent
                taskMetrics={taskMetrics}
                metricsLoading={metricsLoading}
                metricsError={metricsError}
              />
            </Tab>
            <Tab eventKey="table" title="Table">
              <JsonTable json={currentTask} />
            </Tab>
            <Tab eventKey="json" title="JSON">
              <pre>{JSON.stringify(currentTask, null, 2)}</pre>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  )
})

export default DetailsTaskComponent

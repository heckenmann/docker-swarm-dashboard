import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { baseUrlAtom } from './foundationAtoms'
import { viewAtom } from './navigationAtoms'
import { defaultLayoutAtom } from './uiAtoms'
import { dashboardHId, dashboardVId } from '../../navigationConstants'

/**
 * Dashboard horizontal layout: fetches dashboard configuration with row-based layout.
 * Revalidates when the current view changes to capture navigation events.
 */
export const dashboardHAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardh')).json()
})

/**
 * Dashboard vertical layout: fetches dashboard configuration with column-based layout.
 * Revalidates when the current view changes to capture navigation events.
 */
export const dashboardVAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardv')).json()
})

/**
 * Stacks list: fetches all Docker stacks from the backend.
 * Revalidates when the current view changes.
 */
export const stacksAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/stacks')).json()
})

/**
 * Ports mapping: fetches exposed ports configuration from the backend.
 * Revalidates when the current view changes.
 */
export const portsAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/ports')).json()
})

/**
 * Nodes list: fetches all Docker swarm nodes from the backend.
 * Revalidates when the current view changes.
 */
export const nodesAtomNew = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/nodes')).json()
})

/**
 * Cluster metrics: fetches aggregated CPU, Memory and Disk metrics for the entire swarm.
 * Revalidates when the current view changes.
 */
export const clusterMetricsAtom = atom(async (get) => {
  get(viewAtom)
  try {
    const response = await fetch(get(baseUrlAtom) + 'docker/nodes/metrics')
    return await response.json()
  } catch {
    return { available: false }
  }
})

/**
 * Node metrics: fetches real-time metrics for a specific node ID.
 * Uses atomFamily to cache the request per node and prevent redundant fetches.
 */
export const nodeMetricsAtomFamily = atomFamily((nodeId) =>
  atom(async (get) => {
    // We don't trigger re-validation on viewAtom changes here because
    // these atoms are usually mounted/unmounted with the components.
    try {
      const response = await fetch(
        `${get(baseUrlAtom)}docker/nodes/${nodeId}/metrics`,
      )
      return await response.json()
    } catch {
      return { available: false }
    }
  }),
)

/**
 * Tasks list: fetches all Docker tasks from the backend.
 * Revalidates when the current view changes.
 */
export const tasksAtomNew = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/tasks')).json()
})

/**
 * Services logs: fetches the list of services available for log retrieval.
 * Revalidates when the current view changes.
 */
export const logsServicesAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/logs/services')).json()
})

/**
 * Timeline view: fetches timeline/event data from the backend.
 * Revalidates when the current view changes.
 */
export const timelineAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/timeline')).json()
})

/**
 * Version refresh trigger: incrementing this atom signals versionAtom to re-fetch version data.
 * Used to implement an explicit "check for updates" button.
 */
export const versionRefreshAtom = atom(0)

/**
 * Version info: fetches current and remote version from the backend.
 * Only re-evaluates when explicitly triggered by versionRefreshAtom (not on navigation).
 * Returns safe fallback on network errors to prevent UI crashes.
 */
export const versionAtom = atom(async (get) => {
  // Only re-fetch when the user explicitly triggers a refresh, not on navigation.
  get(versionRefreshAtom)
  try {
    return await (await fetch(get(baseUrlAtom) + 'ui/version')).json()
  } catch {
    // Return a safe fallback so the UI does not crash on network errors.
    return {
      version: '',
      remoteVersion: '',
      updateAvailable: false,
      lastChecked: '',
    }
  }
})

/**
 * Dashboard settings default layout view ID: determines whether horizontal or vertical
 * dashboard should be shown by default based on the user's saved layout preference.
 */
export const dashboardSettingsDefaultLayoutViewIdAtom = atom(async (get) => {
  const defaultLayout = await get(defaultLayoutAtom)
  return defaultLayout === 'row' ? dashboardHId : dashboardVId
})

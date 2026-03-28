import { atom } from 'jotai'
import { atomWithHash } from 'jotai-location'
import { atomWithReducer } from 'jotai/utils'
import { MessageReducer } from '../reducers'
import {
  servicesDetailId,
  nodesDetailId,
  tasksId,
  tasksDetailId,
} from '../../navigationConstants'
import { baseUrlAtom } from './foundationAtoms'

/**
 * Navigation view state: stores the current view (id and detail params) in URL hash for shareable links.
 */
export const viewAtom = atomWithHash('view', {})

/**
 * Messages/reducer for toast notifications: holds an array of toasts and handles show/hide/remove actions.
 */
export const messagesAtom = atomWithReducer([], MessageReducer)

/**
 * Node detail: fetches details for a specific Docker node when viewing the node detail view.
 * Returns null when not on the node detail page to avoid unnecessary requests.
 */
export const nodeDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch node details when the active view is the nodes detail view
  if (view.id !== nodesDetailId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/nodes/' + id)).json()
})

/**
 * Service detail: fetches details for a specific Docker service when viewing the service detail view.
 * Returns null when not on the service detail page to avoid unnecessary requests.
 */
export const serviceDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch service details when the active view is the services detail view
  if (view.id !== servicesDetailId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/services/' + id)).json()
})

/**
 * Task detail: fetches details for a specific Docker task when viewing the task detail view.
 * Accepts both the legacy tasks id and the explicit tasksDetail id.
 * Returns null when not on the task detail page to avoid unnecessary requests.
 */
export const taskDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch task details when the active view is the tasks detail view
  // Accept both the legacy `tasks` id and the more explicit `tasksDetail`
  if (view.id !== tasksDetailId && view.id !== tasksId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/tasks/' + id)).json()
})

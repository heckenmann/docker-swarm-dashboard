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

// Navigation view state - persisted in URL hash
export const viewAtom = atomWithHash('view', {})

// Messages reducer for toasts/notifications
export const messagesAtom = atomWithReducer([], MessageReducer)

// Detail view atoms - only fetch when their respective detail view is active
export const nodeDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch node details when the active view is the nodes detail view
  if (view.id !== nodesDetailId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/nodes/' + id)).json()
})

export const serviceDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch service details when the active view is the services detail view
  if (view.id !== servicesDetailId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/services/' + id)).json()
})

export const taskDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch task details when the active view is the tasks detail view
  // Accept both the legacy `tasks` id and the more explicit `tasksDetail`
  if (view.id !== tasksDetailId && view.id !== tasksId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/tasks/' + id)).json()
})

/**
 * useEntityActions
 * Centralized hook exposing default handlers for entity actions.
 * Returns `{ onOpen, onFilter }` where:
 * - onOpen(detailId) updates the global `viewAtom` to the appropriate
 *   detail view (nodesDetail or servicesDetail).
 * - onFilter(name) sets `filterTypeAtom` and the corresponding name filter
 *   atom (`serviceNameFilterAtom` or `stackNameFilterAtom`) and clears the
 *   opposite filter.
 *
 * @param {string} [entityType='service']
 * @returns {{ onOpen: function(string):void, onFilter: function(string):void }}
 */
import { useSetAtom } from 'jotai'
import {
  serviceNameFilterAtom,
  stackNameFilterAtom,
  filterTypeAtom,
} from '../store/atoms/uiAtoms'
import { viewAtom } from '../store/atoms/navigationAtoms'
import {
  servicesDetailId,
  nodesDetailId,
  tasksId,
} from '../constants/navigationConstants'

/**
 * Hook implementation for entity actions
 *
 * @param {string} entityType - Type of entity ('service', 'node', 'task', 'stack')
 * @returns {{ onOpen: Function, onFilter: Function }} Action handlers
 */
export function useEntityActions(entityType = 'service') {
  const updateView = useSetAtom(viewAtom)
  const setServiceFilterName = useSetAtom(serviceNameFilterAtom)
  const setStackFilterName = useSetAtom(stackNameFilterAtom)
  const setFilterType = useSetAtom(filterTypeAtom)

  const onOpen = (detailId) => {
    if (!detailId) return
    if (entityType === 'node') {
      updateView((prev) => ({
        ...(prev || {}),
        id: nodesDetailId,
        detail: detailId,
      }))
    } else if (entityType === 'service') {
      updateView((prev) => ({
        ...(prev || {}),
        id: servicesDetailId,
        detail: detailId,
      }))
    } else if (entityType === 'task') {
      updateView((prev) => ({
        ...(prev || {}),
        id: tasksId,
        detail: detailId,
      }))
    }
  }

  const onFilter = (filterName) => {
    if (!filterName) return
    if (entityType === 'stack') {
      setFilterType('stack')
      setStackFilterName(filterName)
      setServiceFilterName('')
    } else if (entityType === 'service') {
      setFilterType('service')
      setServiceFilterName(filterName)
      setStackFilterName('')
    }
  }

  return { onOpen, onFilter }
}

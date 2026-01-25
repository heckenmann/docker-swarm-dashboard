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
import { useAtom } from 'jotai'
import {
  serviceNameFilterAtom,
  stackNameFilterAtom,
  filterTypeAtom,
  viewAtom,
} from '../store/atoms'
import { servicesDetailId, nodesDetailId } from '../navigationConstants'

export function useEntityActions(entityType = 'service') {
  const [, updateView] = useAtom(viewAtom)
  const [, setServiceFilterName] = useAtom(serviceNameFilterAtom)
  const [, setStackFilterName] = useAtom(stackNameFilterAtom)
  const [, setFilterType] = useAtom(filterTypeAtom)

  const onOpen = (detailId) => {
    if (!detailId) return
    if (entityType === 'node') {
      updateView({ id: nodesDetailId, detail: detailId })
    } else {
      updateView({ id: servicesDetailId, detail: detailId })
    }
  }

  const onFilter = (filterName) => {
    if (!filterName) return
    if (entityType === 'stack') {
      setFilterType('stack')
      setStackFilterName(filterName)
  // clear service filter when switching to stack filter
  setServiceFilterName('')
    } else if (entityType === 'service') {
      setFilterType('service')
      setServiceFilterName(filterName)
  // clear stack filter when switching to service filter
  setStackFilterName('')
    }
  }

  return { onOpen, onFilter }
}

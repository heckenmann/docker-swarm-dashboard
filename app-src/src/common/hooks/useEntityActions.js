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
import { startTransition } from 'react'
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

export function useEntityActions(entityType = 'service') {
  const [, updateView] = useAtom(viewAtom)
  const [, setServiceFilterName] = useAtom(serviceNameFilterAtom)
  const [, setStackFilterName] = useAtom(stackNameFilterAtom)
  const [, setFilterType] = useAtom(filterTypeAtom)

  const onOpen = (detailId) => {
    if (!detailId) return
    startTransition(() => {
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
    })
  }

  const onFilter = (filterName) => {
    if (!filterName) return
    startTransition(() => {
      if (entityType === 'stack') {
        setFilterType('stack')
        setStackFilterName(filterName)
        setServiceFilterName('')
      } else if (entityType === 'service') {
        setFilterType('service')
        setServiceFilterName(filterName)
        setStackFilterName('')
      }
    })
  }

  return { onOpen, onFilter }
}

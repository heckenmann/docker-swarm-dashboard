import { atom } from 'jotai'
import { baseUrlAtom } from './foundationAtoms'
import { viewAtom } from './navigationAtoms'
import { defaultLayoutAtom } from './uiAtoms'
import { dashboardHId, dashboardVId } from '../../navigationConstants'

// Dashboard layout atoms
export const dashboardHAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardh')).json()
})

export const dashboardVAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardv')).json()
})

// Data atoms for main views
export const stacksAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/stacks')).json()
})

export const portsAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/ports')).json()
})

export const nodesAtomNew = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/nodes')).json()
})

export const tasksAtomNew = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/tasks')).json()
})

export const logsServicesAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/logs/services')).json()
})

export const timelineAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/timeline')).json()
})

// Version refresh trigger and version atom
export const versionRefreshAtom = atom(0)

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

// Derived atom for dashboard settings default layout view ID
export const dashboardSettingsDefaultLayoutViewIdAtom = atom(async (get) => {
  const defaultLayout = await get(defaultLayoutAtom)
  return defaultLayout === 'row' ? dashboardHId : dashboardVId
})

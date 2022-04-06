import { atom } from 'jotai';
import { atomWithQuery } from 'jotai/query';
import { atomWithDefault, atomWithReducer, atomWithReset } from 'jotai/utils';
import { fetchNodes, fetchServices, fetchTasks } from '../network';
import { MessageReducer, RefreshIntervalToggleReducer } from './reducers';


// Jotai-Atoms
export const refreshIntervalAtom = atomWithReducer(null, RefreshIntervalToggleReducer);
export const nodesAtom = atomWithQuery((get) =>    ({ queryKey: ['nodes'], queryFn: async       () => { return fetchNodes(); } }));
export const servicesAtom = atomWithQuery((get) => ({ queryKey: ['services'], queryFn: async () => { return fetchServices(); } }));
export const tasksAtom = atomWithQuery((get) =>    ({ queryKey: ['tasks'], queryFn: async       () => { return fetchTasks(); } }));
export const logsLinesAtom = atomWithReset([]);
export const logsShowLogs = atom(false);
export const logsNumberOfLines = atomWithReset(20);
export const messagesAtom = atomWithReducer([], MessageReducer);
export const isDarkModeAtom = atom(false);
export const currentVariantAtom = atom((get) => get(isDarkModeAtom) ? 'dark' : 'light');
export const currentVariantClassesAtom = atom((get) => get(isDarkModeAtom) ? 'bg-dark text-light border-secondary' : 'bg-light text-dark');
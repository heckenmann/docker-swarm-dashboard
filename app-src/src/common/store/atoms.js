import { atomWithQuery } from 'jotai/query';
import { atomWithReducer } from 'jotai/utils';
import { fetchNodes, fetchServices, fetchTasks } from '../network';
import { MessageReducer, RefreshIntervalToggleReducer } from './reducers';


// Jotai-Atoms
export const refreshIntervalAtom = atomWithReducer(null, RefreshIntervalToggleReducer);
export const nodesAtom = atomWithQuery((get) =>    ({ queryKey: ['nodes'], queryFn: async       () => { return fetchNodes(); } }));
export const servicesAtom = atomWithQuery((get) => ({ queryKey: ['services'], queryFn: async () => { return fetchServices(); } }));
export const tasksAtom = atomWithQuery((get) =>    ({ queryKey: ['tasks'], queryFn: async       () => { return fetchTasks(); } }));
export const messagesAtom = atomWithReducer([], MessageReducer);

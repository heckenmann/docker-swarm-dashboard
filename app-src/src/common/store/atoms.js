import { atom } from 'jotai';
import { atomWithQuery } from 'jotai/query';
import { atomWithDefault, atomWithReducer, atomWithReset } from 'jotai/utils';
import { fetchNodes, fetchServices, fetchTasks } from '../network';
import { MessageReducer, RefreshIntervalToggleReducer } from './reducers';

import a11yLight from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-light';
import a11yDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';


// Jotai-Atoms
export const refreshIntervalAtom = atomWithReducer(null, RefreshIntervalToggleReducer);
export const nodesAtom = atomWithQuery(() => ({ queryKey: ['nodes'], queryFn: async () => { return fetchNodes(); } }));
export const servicesAtom = atomWithQuery(() => ({ queryKey: ['services'], queryFn: async () => { return fetchServices(); } }));
export const tasksAtom = atomWithQuery(() => ({ queryKey: ['tasks'], queryFn: async () => { return fetchTasks(); } }));

// Logs
export const logsLinesAtom = atomWithReset([]);
export const logsShowLogs = atom(false);
export const logsNumberOfLines = atomWithReset(20);
export const messagesAtom = atomWithReducer([], MessageReducer);

// Theme
export const isDarkModeAtom = atom(false);
export const currentVariantAtom = atom((get) => get(isDarkModeAtom) ? 'dark' : 'light');
export const currentVariantClassesAtom = atom((get) => get(isDarkModeAtom) ? 'bg-dark text-light border-secondary' : 'bg-light text-dark');
export const currentSyntaxHighlighterStyleAtom = atom((get) => get(isDarkModeAtom) ? a11yDark : a11yLight);
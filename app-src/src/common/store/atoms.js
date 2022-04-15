import { atom } from 'jotai';
import { atomWithHash, atomWithReducer, atomWithReset } from 'jotai/utils';
import a11yDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';
import a11yLight from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-light';
import { fetchNodes, fetchServices, fetchTasks } from '../network';
import { MessageReducer, RefreshIntervalToggleReducer } from './reducers';

// Jotai-Atoms
export const refreshIntervalAtom = atomWithReducer(null, RefreshIntervalToggleReducer);
export const nodesAtom = atomWithReducer(fetchNodes(), () => fetchNodes());
export const servicesAtom = atomWithReducer(fetchServices(), () => fetchServices());
export const tasksAtom = atomWithReducer(fetchTasks(), () => fetchTasks());
export const viewAtom = atomWithHash('view');

// Logs
export const logsLinesAtom = atomWithReset([]);
export const logsShowLogs = atom(false);
export const logsNumberOfLines = atomWithReset(20);
export const messagesAtom = atomWithReducer([], MessageReducer);

// Theme
export const isDarkModeAtom = atomWithHash('darkMode', false);
export const currentVariantAtom = atom((get) => get(isDarkModeAtom) ? 'dark' : 'light');
export const currentVariantClassesAtom = atom((get) => get(isDarkModeAtom) ? 'bg-dark text-light border-secondary' : 'bg-light text-dark');
export const currentSyntaxHighlighterStyleAtom = atom((get) => get(isDarkModeAtom) ? a11yDark : a11yLight);
import { atom } from 'jotai';
import { atomWithHash, atomWithReducer, atomWithReset, selectAtom } from 'jotai/utils';
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
export const messagesAtom = atomWithReducer([], MessageReducer);

// Logs
export const logsLinesAtom = atomWithReset([]);
export const logsShowLogsAtom = atom(false);
export const logsNumberOfLinesAtom = atomWithReset(20);
export const logsConfigAtom = atom();
export const logsWebsocketUrlAtom = selectAtom(logsConfigAtom, (logsConfig) =>
    logsConfig ?
        'ws://' + window.location.host + '/docker/logs/'
        + logsConfig.serviceId
        + '?tail=' + logsConfig.tail
        + '&since=' + logsConfig.since
        + '&follow=' + logsConfig.follow
        + '&timestamps=' + logsConfig.timestamps
        + '&stdout=' + logsConfig.stdout
        + '&stderr=' + logsConfig.stderr
        + '&details=' + logsConfig.details
        : null
        );

// Theme
export const isDarkModeAtom = atomWithHash('darkMode', false);
export const currentVariantAtom = atom((get) => get(isDarkModeAtom) ? 'dark' : 'light');
export const currentVariantClassesAtom = atom((get) => get(isDarkModeAtom) ? 'bg-dark text-light border-secondary' : 'bg-light text-dark');
export const currentSyntaxHighlighterStyleAtom = atom((get) => get(isDarkModeAtom) ? a11yDark : a11yLight);
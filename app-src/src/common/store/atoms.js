import {atom} from 'jotai';
import {atomWithReducer, atomWithReset, selectAtom} from 'jotai/utils';
import a11yDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';
import a11yLight from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-light';
import {baseUrl, fetchNodes, fetchServices, fetchTasks} from '../network';
import {MessageReducer, RefreshIntervalToggleReducer} from './reducers';
import {atomWithHash} from "jotai-location";
import {dashboardHId} from "../navigationConstants";

// Jotai-Atoms
export const refreshIntervalAtom = atomWithReducer(null, RefreshIntervalToggleReducer);
export const nodesAtom = atomWithReducer(fetchNodes(), () => fetchNodes());
export const servicesAtom = atomWithReducer(fetchServices(), () => fetchServices());
export const tasksAtom = atomWithReducer(fetchTasks(), () => fetchTasks());
export const viewAtom = atomWithHash('view', {'id': dashboardHId});
export const messagesAtom = atomWithReducer([], MessageReducer);
export const useNewApiToogleAtom = atomWithHash('newapi', false);
export const tableSizeAtom = atomWithHash('tablesize', 'sm');

// New API
export const dashboardHAtom = atom(async (get) => {
    // Reload when view changed
    get(viewAtom);
    return await fetch(baseUrl + 'ui/dashboardh').then(data => data.json());
});
export const dashboardVAtom = atom(async (get) => {
    // Reload when view changed
    get(viewAtom);
    return await fetch(baseUrl + 'ui/dashboardv').then(data => data.json());
});
export const stacksAtom = atom(async (get) => {
    // Reload when view changed
    get(viewAtom);
    return await fetch(baseUrl + 'ui/stacks').then(data => data.json());
});
export const portsAtom = atom(async (get) => {
    // Reload when view changed
    get(viewAtom);
    return await fetch(baseUrl + 'ui/ports').then(data => data.json());
});
export const nodesAtomNew = atom(async (get) => {
    // Reload when view changed
    get(viewAtom);
    return await fetch(baseUrl + 'ui/nodes').then(data => data.json());
});
export const nodeDetailAtom = atom(async (get) => {
    let id = get(viewAtom)['detail'];
    return await fetch(baseUrl + 'docker/nodes/' + id).then(data => data.json());
});
export const serviceDetailAtom = atom(async (get) => {
    let id = get(viewAtom)['detail'];
    return await fetch(baseUrl + 'docker/services/' + id).then(data => data.json());
});
export const taskDetailAtom = atom(async (get) => {
    let id = get(viewAtom)['detail'];
    return await fetch(baseUrl + 'docker/tasks/' + id).then(data => data.json());
});

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
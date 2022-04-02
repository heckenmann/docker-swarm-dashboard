import { atomWithQuery } from 'jotai/query';
import { atom } from 'jotai';
import { atomWithDefault, atomWithReducer } from 'jotai/utils';
import { refreshIntervalToggleReducer } from './reducers';

// Jotai-Atoms
export const baseUrl = "/";
export const refreshIntervalAtom = atomWithReducer(null, refreshIntervalToggleReducer);
export const nodesAtom = atomWithQuery((get) => ({
    queryKey: ["nodes"],
    queryFn: async () => await fetchAndSort("docker/nodes", (a, b) => { return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1; })
}));
export const servicesAtom = atomWithQuery((get) => ({
    queryKey: ["services"],
    queryFn: async () => await fetchAndSort("docker/services", (a, b) => { return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1; })
}));
export const tasksAtom = atomWithQuery((get) => ({
    queryKey: ["tasks"],
    queryFn: async () => await fetchAndSort("docker/tasks", (a, b) => { return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1; })
}));

const fetchAndSort = async (path, comparator) => {
    return fetch(baseUrl + path)
        .then(res => res.json())
        //.then(res => {console.log(res); return res; })
        .then(res => res.sort(comparator))
}
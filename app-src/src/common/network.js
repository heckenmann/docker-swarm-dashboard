export const baseUrl = "/";

export const fetchNodes = async() => fetchAndSort(baseUrl + "docker/nodes", (a, b) => { return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1; });
export const fetchServices = async() => fetchAndSort(baseUrl + "docker/services", (a, b) => { return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1; });
export const fetchTasks = async() => fetchAndSort(baseUrl + "docker/tasks", (a, b) => { return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1; });



const fetchAndSort = async (path, comparator) => {
    return fetch(path)
        .then(res => res.json())
        //.then(res => {console.log(res); return res; })
        .then(res => res.sort(comparator))
}
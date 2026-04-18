/**
 * Flattens a nested JSON object.
 * Source: https://stackoverflow.com/a/49042916
 *
 * @param {object} obj - The JSON object to flatten.
 * @param {string} [path=''] - The base path for the keys.
 * @returns {object} - The flattened JSON object.
 */
export const flatten = (obj, path = '') => {
  if (!(obj instanceof Object)) return { [path.replace(/\.$/g, '')]: obj }

  return Object.keys(obj).reduce((output, key) => {
    return obj instanceof Array
      ? { ...output, ...flatten(obj[key], path + '[' + key + '].') }
      : { ...output, ...flatten(obj[key], path + key + '.') }
  }, {})
}

/**
 * Filters a service based on the provided service name and stack name filters.
 *
 * @param {object} service - The service object to filter.
 * @param {string} [serviceNameFilter] - The service name filter.
 * @param {string} [stackNameFilter] - The stack name filter.
 * @returns {boolean} - Returns true if the service matches the filters, otherwise false.
 */
export const serviceFilter = (service, serviceNameFilter, stackNameFilter) => {
  if (!serviceNameFilter && !stackNameFilter) {
    return true
  }
  const { Name: serviceName, Stack: stackName } = service
  const filterName = serviceNameFilter
    ? serviceName.includes(serviceNameFilter)
    : true
  const filterStack = stackNameFilter
    ? stackName.includes(stackNameFilter)
    : true
  if (serviceNameFilter && !stackNameFilter) {
    return filterName
  }
  if (stackNameFilter && !serviceNameFilter) {
    return filterStack
  }
  if (serviceNameFilter && stackNameFilter) {
    return filterName && filterStack
  }
  return true
}

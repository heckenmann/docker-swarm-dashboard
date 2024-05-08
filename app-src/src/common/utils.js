// Flattens json
// Source: https://stackoverflow.com/a/49042916
export const flatten = (obj, path = '') => {
  if (!(obj instanceof Object)) return { [path.replace(/\.$/g, '')]: obj }

  return Object.keys(obj).reduce((output, key) => {
    return obj instanceof Array
      ? { ...output, ...flatten(obj[key], path + '[' + key + '].') }
      : { ...output, ...flatten(obj[key], path + key + '.') }
  }, {})
}

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

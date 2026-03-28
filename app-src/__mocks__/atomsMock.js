/**
 * Jest mock for all atom files.
 * This ensures tests can mock atoms regardless of which atom file they import from.
 */

const mockAtoms = {
  // foundationAtoms
  parseHashToObj: jest.fn((hash) => {
    const h = typeof hash === 'string' ? hash : ''
    const hashWithoutHash = h.startsWith('#') ? h.substring(1) : h
    if (!hashWithoutHash) return {}
    return hashWithoutHash
      .split('&')
      .map((pair) => pair.split('='))
      .reduce((acc, [key, value]) => {
        try {
          acc[key] = decodeURIComponent(value).replaceAll('"', '')
        } catch {
          acc[key] = (value || '').replaceAll('"', '')
        }
        return acc
      }, {})
  }),
  baseUrlAtom: 'baseUrlAtom',
  baseUrlDefaultAtom: 'baseUrlDefaultAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  createHashAtomWithDefault: jest.fn((key, defaultAtom) => defaultAtom),
  refreshIntervalDefaultAtom: 'refreshIntervalDefaultAtom',
  tableSizeDefaultAtom: 'tableSizeDefaultAtom',
  serviceNameFilterDefaultAtom: 'serviceNameFilterDefaultAtom',
  stackNameFilterDefaultAtom: 'stackNameFilterDefaultAtom',
  filterTypeDefaultAtom: 'filterTypeDefaultAtom',
  logsNumberOfLinesDefaultAtom: 'logsNumberOfLinesDefaultAtom',
  logsMessageMaxLenDefaultAtom: 'logsMessageMaxLenDefaultAtom',
  logsFormTailDefaultAtom: 'logsFormTailDefaultAtom',
  logsFormSinceDefaultAtom: 'logsFormSinceDefaultAtom',
  logsFormSinceAmountDefaultAtom: 'logsFormSinceAmountDefaultAtom',
  logsFormSinceUnitDefaultAtom: 'logsFormSinceUnitDefaultAtom',
  logsFormFollowDefaultAtom: 'logsFormFollowDefaultAtom',
  logsFormTimestampsDefaultAtom: 'logsFormTimestampsDefaultAtom',
  logsFormStdoutDefaultAtom: 'logsFormStdoutDefaultAtom',
  logsFormStderrDefaultAtom: 'logsFormStderrDefaultAtom',
  logsFormDetailsDefaultAtom: 'logsFormDetailsDefaultAtom',
  logsSearchKeywordDefaultAtom: 'logsSearchKeywordDefaultAtom',
  isDarkModeDefaultAtom: 'isDarkModeDefaultAtom',
  showNamesButtonsDefaultAtom: 'showNamesButtonsDefaultAtom',
  showNavLabelsDefaultAtom: 'showNavLabelsDefaultAtom',
  maxContentWidthDefaultAtom: 'maxContentWidthDefaultAtom',
  defaultLayoutDefaultAtom: 'defaultLayoutDefaultAtom',
  hiddenServiceStatesDefaultAtom: 'hiddenServiceStatesDefaultAtom',
  timeZoneDefaultAtom: 'timeZoneDefaultAtom',
  localeDefaultAtom: 'localeDefaultAtom',

  // navigationAtoms
  viewAtom: 'viewAtom',
  messagesAtom: 'messagesAtom',
  nodeDetailAtom: 'nodeDetailAtom',
  serviceDetailAtom: 'serviceDetailAtom',
  taskDetailAtom: 'taskDetailAtom',

  // dashboardAtoms
  dashboardHAtom: 'dashboardHAtom',
  dashboardVAtom: 'dashboardVAtom',
  stacksAtom: 'stacksAtom',
  portsAtom: 'portsAtom',
  nodesAtomNew: 'nodesAtomNew',
  tasksAtomNew: 'tasksAtomNew',
  logsServicesAtom: 'logsServicesAtom',
  timelineAtom: 'timelineAtom',
  dashboardSettingsDefaultLayoutViewIdAtom: 'dashboardSettingsDefaultLayoutViewIdAtom',
  versionRefreshAtom: 'versionRefreshAtom',
  versionAtom: 'versionAtom',

  // themeAtoms
  isDarkModeAtom: 'isDarkModeAtom',
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  currentSyntaxHighlighterStyleAtom: 'currentSyntaxHighlighterStyleAtom',

  // uiAtoms
  refreshIntervalAtom: 'refreshIntervalAtom',
  tableSizeAtom: 'tableSizeAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
  showNavLabelsAtom: 'showNavLabelsAtom',
  maxContentWidthAtom: 'maxContentWidthAtom',
  defaultLayoutAtom: 'defaultLayoutAtom',
  hiddenServiceStatesAtom: 'hiddenServiceStatesAtom',
  timeZoneAtom: 'timeZoneAtom',
  localeAtom: 'localeAtom',
  showWelcomeMessageAtom: 'showWelcomeMessageAtom',
  networkRequestsAtom: 'networkRequestsAtom',

  // logsAtoms
  logsLinesAtom: 'logsLinesAtom',
  logsShowLogsAtom: 'logsShowLogsAtom',
  logsNumberOfLinesAtom: 'logsNumberOfLinesAtom',
  logsConfigAtom: 'logsConfigAtom',
  logsMessageMaxLenAtom: 'logsMessageMaxLenAtom',
  logsFormServiceIdAtom: 'logsFormServiceIdAtom',
  logsFormServiceNameAtom: 'logsFormServiceNameAtom',
  logsFormTailAtom: 'logsFormTailAtom',
  logsFormSinceAtom: 'logsFormSinceAtom',
  logsFormSinceErrorAtom: 'logsFormSinceErrorAtom',
  logsFormShowAdvancedAtom: 'logsFormShowAdvancedAtom',
  logsFormSinceAmountAtom: 'logsFormSinceAmountAtom',
  logsFormSinceUnitAtom: 'logsFormSinceUnitAtom',
  logsFormSinceIsISOAtom: 'logsFormSinceIsISOAtom',
  logsFormFollowAtom: 'logsFormFollowAtom',
  logsFormTimestampsAtom: 'logsFormTimestampsAtom',
  logsFormStdoutAtom: 'logsFormStdoutAtom',
  logsFormStderrAtom: 'logsFormStderrAtom',
  logsFormDetailsAtom: 'logsFormDetailsAtom',
  logsSearchKeywordAtom: 'logsSearchKeywordAtom',
  logsWebsocketUrlAtom: 'logsWebsocketUrlAtom',
}

module.exports = mockAtoms
module.exports.default = mockAtoms

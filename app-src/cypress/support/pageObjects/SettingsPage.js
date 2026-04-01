import { CY_BASE_URL } from '../constants'

/**
 * Page Object Model for Settings interactions
 */
class SettingsPage {
  visit() {
    cy.visit(CY_BASE_URL)
    cy.get('nav', { timeout: 10000 }).should('be.visible')
    cy.get('a[aria-label="Settings"]').click()
    return this
  }
  
  // Dark Mode
  getDarkModeToggle() {
    return cy.get('input[aria-label="Toggle dark mode"]')
  }
  
  toggleDarkMode() {
    this.getDarkModeToggle().check({ force: true })
    return this
  }
  
  toggleDarkModeOff() {
    this.getDarkModeToggle().uncheck({ force: true })
    return this
  }
  
  assertDarkModeIsChecked() {
    this.getDarkModeToggle().should('be.checked')
    return this
  }
  
  assertDarkModeIsNotChecked() {
    this.getDarkModeToggle().should('not.be.checked')
    return this
  }
  
  // Table Size
  getTableSizeSelect() {
    return cy.get('select[aria-label="Table size"]')
  }
  
  selectTableSize(size) {
    this.getTableSizeSelect().select(size)
    return this
  }
  
  // Refresh Interval
  getRefreshIntervalInput() {
    return cy.get('input[aria-label="Refresh interval in milliseconds"]')
  }
  
  setRefreshInterval(interval) {
    this.getRefreshIntervalInput().clear().type(interval)
    return this
  }
  
  // Navigation Labels
  getShowNavLabelsToggle() {
    return cy.get('input[aria-label="Show navigation labels"]')
  }
  
  toggleNavLabels() {
    this.getShowNavLabelsToggle().check({ force: true })
    return this
  }
  
  toggleNavLabelsOff() {
    this.getShowNavLabelsToggle().uncheck({ force: true })
    return this
  }
  
  // Names Buttons
  getShowNamesButtonsToggle() {
    return cy.get('input[aria-label="Show names buttons"]')
  }
  
  toggleNamesButtons() {
    this.getShowNamesButtonsToggle().check({ force: true })
    return this
  }
  
  toggleNamesButtonsOff() {
    this.getShowNamesButtonsToggle().uncheck({ force: true })
    return this
  }
  
  // Layout Settings
  getCenteredLayoutToggle() {
    return cy.get('input[aria-label="Centered layout"]')
  }
  
  toggleCenteredLayout() {
    this.getCenteredLayoutToggle().check({ force: true })
    return this
  }
  
  // Hidden Service States
  getHiddenServiceStatesInput() {
    return cy.get('input[aria-label="Hidden service states"]')
  }
  
  setHiddenServiceStates(states) {
    this.getHiddenServiceStatesInput().clear().type(states)
    return this
  }
  
  // Time Zone
  getTimeZoneInput() {
    return cy.get('input[aria-label="Time zone"]')
  }
  
  setTimeZone(timezone) {
    this.getTimeZoneInput().clear().type(timezone)
    return this
  }
  
  // Locale
  getLocaleInput() {
    return cy.get('input[aria-label="Locale"]')
  }
  
  setLocale(locale) {
    this.getLocaleInput().clear().type(locale)
    return this
  }
  
  // Version Check
  getVersionCheckToggle() {
    return cy.get('input[aria-label="Version check"]')
  }
  
  toggleVersionCheck() {
    this.getVersionCheckToggle().check({ force: true })
    return this
  }
  
  // Welcome Message
  getWelcomeMessageInput() {
    return cy.get('input[aria-label="Welcome message"]')
  }
  
  setWelcomeMessage(message) {
    this.getWelcomeMessageInput().clear().type(message)
    return this
  }
  
  // Reset
  getResetDefaultsButton() {
    return cy.get('button[aria-label="Reset settings to defaults"]')
  }
  
  resetToDefaults() {
    this.getResetDefaultsButton().click()
    return this
  }
  
  // API URL
  getApiUrlInput() {
    return cy.get('input[aria-label="API URL"]')
  }
  
  setApiUrl(url) {
    this.getApiUrlInput().clear().type(url)
    return this
  }
}

export default SettingsPage
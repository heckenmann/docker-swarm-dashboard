import { visitBaseUrlAndTest } from './spec.cy'

describe('Ports Tests', () => {
  it('Load page', () => {
    visitBaseUrlAndTest(() => {
  cy.contains('a', 'Ports').click()
  // ensure the ports table contains at least one published port cell and a service name
  cy.get('#portsTable').should('exist')
  cy.get('#portsTable td').then(($tds) => {
    const texts = $tds.toArray().map((el) => el.innerText.trim()).filter(Boolean)
    // expect at least one numeric port value and one service-like name
    const hasPort = texts.some((t) => /^\d{2,5}$/.test(t))
    const hasSvc = texts.some((t) => /_/.test(t) || /service/.test(t))
    expect(hasPort).to.be.true
    expect(hasSvc).to.be.true
  })
    })
  })
})

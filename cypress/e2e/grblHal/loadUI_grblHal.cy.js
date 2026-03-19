describe('gSender UI Load Test', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  it('should load gSender UI', () => {
    let startTime;

    cy.then(() => {
      startTime = performance.now();
      cy.log(`Load started at: ${new Date().toISOString()}`);
    });

    cy.visit('/', {
      failOnStatusCode: false,
      timeout: 30000
    });

    cy.document().its('readyState').should('eq', 'complete');

    // Only check UI rendered — remove hasCOM
    cy.get('body', { timeout: 20000 }).should(($body) => {
      const hasButton     = $body.find('button').length > 0;
      const hasConnection = $body.text().includes('Connect') ||
                            $body.text().includes('Connection');

      expect(hasButton, 'buttons should exist').to.be.true;
      expect(hasConnection, 'connection text should exist').to.be.true;
    });

    cy.then(() => {
      const endTime  = performance.now();
      const loadTime = ((endTime - startTime) / 1000).toFixed(2);
      const status   = loadTime < 5 ? 'FAST' : loadTime < 10 ? 'ACCEPTABLE' : 'SLOW';

      cy.log(`[${status}] UI load time: ${loadTime}s`);
      cy.task('log', `[${status}] UI Load Time: ${loadTime}s`);
    });
  });
});
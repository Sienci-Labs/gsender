describe('gSender UI Load Test', () => {
  beforeEach(() => {
    cy.viewport(1732, 1305);
  });

  it('should navigate to gSender and verify the UI loads', () => {
    cy.visit('http://localhost:8000/#/', { 
      timeout: 60000,
      failOnStatusCode: false 
    });

    cy.title({ timeout: 30000 }).should('eq', 'gSender');

    cy.get('body', { timeout: 30000 }).should('be.visible');

    // Log the time when Connect to CNC appears
    cy.log('Waiting for Connect to CNC...');
    const start = Date.now();

    cy.contains('Connect to CNC', { timeout: 60000 })
      .should('be.visible')
      .then(() => {
        cy.log(`Connect to CNC appeared after ${Date.now() - start}ms`);
      });
  });
});
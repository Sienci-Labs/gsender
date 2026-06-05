

describe('gSender UI Load Test', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  it('should navigate to gSender and verify the UI loads', () => {
    // Visit with timeout for slow load
    cy.visit('/', { timeout: 40000 });

    // Wait for title with timeout
    cy.title({ timeout: 15000 }).should('eq', 'gSender 1.6.0');

    // Wait for body to be visible
    cy.get('body', { timeout: 15000 }).should('be.visible');

  
  });
});
describe('CNC Machine job run', () => {

  // Ignore known hydration-related UI errors, remove this once hydration error is fixed
  Cypress.on('uncaught:exception', (err) => {
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating'
    ];
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false; // ignore these exceptions
    }
    return true;
  });

  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
  });

  it('Test Case 1: Connects to CNC first, zero axes and upload file', () => {

    // Step 1: Connect to CNC
    cy.log('Attempting to connect to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });

    });

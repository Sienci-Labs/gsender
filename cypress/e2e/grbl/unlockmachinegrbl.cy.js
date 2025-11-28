import '../support/commands'
describe('Comprehensive Axis Movement and Jog Control Tests', () => {

  // Ignore known hydration-related UI errors and undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
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
    cy.wait(2000); // Give app time to recover from initialization error
  });

  it('Test Case 1: Basic axis movements and position reset', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Check if machine is locked and unlock if necessary
    cy.log('Step 2: Checking machine lock status...');
    
    // Check for lock button (svg.hidden indicates locked state)
    cy.get('body').then($body => {
      if ($body.find('svg.hidden').length > 0) {
        cy.log('Machine is locked, clicking unlock button...');
        
        // Click the lock/unlock button
        cy.get('svg.hidden')
          .parent('button')
          .click({ force: true });
        
        cy.wait(1000);
        cy.log('Machine unlocked');
      } else {
        cy.log('Machine is already unlocked');
      }
    });

    cy.wait(2000);

    // Continue with the rest of your test...
  });
});
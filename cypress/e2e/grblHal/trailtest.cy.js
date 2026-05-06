describe('Surfacing Test', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Should complete surfacing workflow successfully', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);
    cy.log('Machine is in idle status');

    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 3: Navigate to Tools
    cy.log('Step 3: Navigating to Tools page...');
    cy.contains('span', 'Tools')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('Tools page opened');

    // Step 4: Click on Surfacing tool - using the link selector
  
  cy.contains('h3', 'Surfacing')
  .closest('div.rounded-lg')
  .should('be.visible')
  .click();

// Step 5: Configure Width
cy.log('Step 5: Setting width to 75mm');
cy.get('#width')
  .should('be.visible')
  .clear()
  .type('75');
cy.wait(300);


  
  });
});
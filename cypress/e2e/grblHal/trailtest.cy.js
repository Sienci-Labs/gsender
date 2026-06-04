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
    // Step 3: Navigate to Tools
   
    cy.log('Zeroing all axis...');
     cy.get('div.relative > div.max-xl\\:scale-95 > div:nth-of-type(1) span')
      .click();
    cy.log("All axes zeroed");


    // Step 4: Click on Surfacing tool - using the link selector



  
  });
});
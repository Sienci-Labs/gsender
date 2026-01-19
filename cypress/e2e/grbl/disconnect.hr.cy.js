describe('Connect and Disconnect from CNC Machine', () => {

  // Handle hydration-related UI errors
  Cypress.on('uncaught:exception', (err) => {
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating'
    ];
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false;
    }
    return true;
  });
 beforeEach(() => {
  cy.viewport(1920, 1080);
  // Use loadUI custom command with dynamic baseUrl
  cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
    maxRetries: 3,
    waitTime: 3000,
    timeout: 5000
  });
});

  it('connects and disconnects the CNC machine if Idle', () => { // Step 1: Connect to CNC using reusable command
    cy.log(' Connecting to CNC machine...');
    cy.connectMachine();
    cy.unlockMachineIfNeeded(); //Unlock if there are any errors 
    
    cy.contains(/^Idle$/i, { timeout: 20000 }) // Step 2: Verify CNC is Idle
      .should('be.visible')
      .then((status) => {
        const machineStatus = status.text().trim();
        cy.log(` Machine is in status: "${machineStatus}"`);

        
        if (machineStatus.toLowerCase() === 'idle') { // Step 3: If Idle, disconnect using force click
          cy.log(' Machine is Idle — disconnecting...');

          cy.get('button.bg-red-600.text-white')
            .contains(/^disconnect$/i)
            .click({ force: true });

          cy.log(' Disconnect clicked — verifying status...');

          
          cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 }) // Step 4: Verify the machine is disconnected
            .should('be.visible')
            .then(() => cy.log(' Machine disconnect verified successfully.'));
        } else {
          cy.log(` Machine not Idle (current status: "${machineStatus}"). Skipping disconnect.`);
        }
      });
  });
});

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
    cy.viewport(2844, 1450);
    cy.visit('http://localhost:8000/');
    cy.title().should('eq', 'gSender');
  });

  it('connects and disconnects the CNC machine if Idle', () => {
    // Step 1: Connect to CNC using reusable command
    cy.log(' Connecting to CNC machine...');
    cy.connectMachine();

    // Step 2: Verify CNC is Idle
    cy.contains(/^Idle$/i, { timeout: 20000 })
      .should('be.visible')
      .then((status) => {
        const machineStatus = status.text().trim();
        cy.log(` Machine is in status: "${machineStatus}"`);

        // Step 3: If Idle, disconnect using force click
        if (machineStatus.toLowerCase() === 'idle') {
          cy.log(' Machine is Idle — disconnecting...');

          cy.get('button.bg-red-600.text-white')
            .contains(/^disconnect$/i)
            .click({ force: true });

          cy.log(' Disconnect clicked — verifying status...');

          // Step 4: Verify the machine is disconnected
          cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 })
            .should('be.visible')
            .then(() => cy.log(' Machine disconnect verified successfully.'));
        } else {
          cy.log(` Machine not Idle (current status: "${machineStatus}"). Skipping disconnect.`);
        }
      });
  });
});

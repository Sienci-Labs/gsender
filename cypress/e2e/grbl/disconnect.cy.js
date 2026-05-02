describe('Connect and Disconnect from CNC Machine', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 3,
      waitTime: 3000,
      timeout: 5000
    });
  });

  it('connects and disconnects the CNC machine if Idle', () => {
    cy.log('Connecting to CNC machine...');
    cy.connectMachine();
    cy.unlockMachineIfNeeded();

    // Step 2: Verify CNC is Idle
    cy.contains(/^Idle$/i, { timeout: 20000 })
      .should('be.visible')
      .then((status) => {
        const machineStatus = status.text().trim();
        cy.log(`Machine is in status: "${machineStatus}"`);

        if (machineStatus.toLowerCase() === 'idle') {
          cy.log('Machine is Idle — disconnecting...');

          // Hover the button group to reveal the disconnect div, then click it
          cy.get('div.group')
            .first()
            .trigger('mouseover', { force: true });

          cy.get('div.group div.w-full')
            .contains(/^disconnect$/i)
            .click({ force: true });

          cy.log('Disconnect clicked — verifying status...');

          // Step 4: Verify disconnected
          cy.contains(/Connect to CNC/i, { timeout: 30000 })
            .should('be.visible')
            .then(() => cy.log('Machine disconnect verified successfully.'));

        } else {
          cy.log(`Machine not Idle (current status: "${machineStatus}"). Skipping disconnect.`);
        }
      });
  });
});
// ***********************************************
// cypress/support/commands.js
// Custom commands for CNC machine
// ***********************************************

// ----------------------
// Connect to CNC machine
// ----------------------
Cypress.Commands.add('connectMachine', () => {
  cy.wait(5000); // wait 5 secs for UI to load 

  // Log all page text (for debugging)
  cy.get('body').then(($body) => {
    cy.log('Page Text: ', $body.text());
  });

  // Find the Connect button (case-insensitive)
  cy.contains(/^connect to CNC$/i, { timeout: 20000 })
    .should('exist')
    .scrollIntoView()
    .should('be.visible')
    .trigger('mouseover');

  // Click the first COM port (e.g., COM5)
  cy.get('div.absolute', { timeout: 20000 })
    .should('be.visible')
    .find('button')
    .first()
    .should('contain.text', 'COM')
    .click({ force: true });

  cy.log('Successfully selected the first COM port and connected to CNC');
});

// ----------------------
// Disconnect if Idle
// ----------------------
Cypress.Commands.add('disconnectIfIdle', () => {
  cy.wait(5000); // wait 5 secs for UI to load 

  // Check if status is Idle
  cy.contains(/^Idle$/i, { timeout: 20000 })
    .then((status) => {
      const machineStatus = status.text().trim();
      cy.log(`Machine status: "${machineStatus}"`);

      if (machineStatus.toLowerCase() === 'idle') {
        cy.log('Machine is Idle — disconnecting...');

        // Click the Disconnect button
        cy.get('button.bg-red-600.text-white')
          .contains(/^disconnect$/i)
          .click({ force: true });

        // Verify disconnect succeeded
        cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 })
          .should('be.visible')
          .then(() => cy.log('Machine disconnect verified successfully.'));
      } else {
        cy.log('Machine is not Idle — skipping disconnect.');
      }
    });
});

// ----------------------
// Upload G-code file
// ----------------------
Cypress.Commands.add('uploadGcodeFile', (fileName = 'sample.gcode') => {
  cy.wait(5000);

  cy.contains('Load File')
    .should('be.visible')
    .click({ force: true });

  cy.get('#fileInput')
    .selectFile(`cypress/fixtures/${fileName}`, { force: true });

  cy.wait(5000);
});

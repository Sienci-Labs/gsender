describe('gSender SD Card Manager test', () => {

  beforeEach(() => {
    cy.viewport(2844, 1450);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000
    });
  });

  it('It should check SD Card Mounting and other operations', () => {

    // --- Connect to Machine ---
    cy.log('Connect to Machine');
    cy.connectMachine();
    cy.wait(600);
    cy.log('Machine is connected');

    // --- Verify Machine is Idle ---
    cy.log('Checking Machine is in Idle');
    cy.verifyMachineStatus('Idle');

    // --- Navigate to SD Card Manager ---
    cy.goToTools();
    cy.contains('h3', 'SD Card Manager').click({ force: true });
    cy.wait(1000);

    // --- Check SD Card Mount Status ---
    cy.log('Checking SD card mount status...');

    cy.get('div.inline-flex.items-center.rounded-full')
      .filter(':has(span)')
      .filter((i, el) => {
        const text = Cypress.$(el).find('span').text().trim();
        return text === 'Mounted' || text === 'Unmounted';
      })
      .first()
      .find('span')
      .then(($span) => {
        const statusText = $span.text().trim();
        cy.log(`SD Card status: "${statusText}"`);

        if (statusText === 'Unmounted') {
          cy.log(' No SD card mounted');
          throw new Error('No SD card mounted — test failed');
        } else if (statusText === 'Mounted') {
          cy.log(' SD card is mounted — continuing test...');
        } else {
          throw new Error(`Unknown SD card status: "${statusText}" : test failed`);
        }
      });

      //Find refresh button and click 
      cy.contains('button', 'Refresh Files').click({ force: true });
      //Checking gcode uplaod 
      cy.log('Clicking Upload button...');
    cy.contains('button', 'Upload').click({ force: true });

// Click browse in the dialog
cy.log('Clicking browse...');
cy.get('div.space-y-4 button').contains('browse').click({ force: true });

// Attach the file — target the input inside the dialog specifically
cy.log('Attaching file...');
cy.get('div[role="dialog"] input[type="file"]')
  .first()
  .selectFile('cypress/fixtures/sample.gcode', { force: true });

// Click Upload button in dialog to confirm
cy.log('Confirming upload...');
cy.get('div[role="dialog"] button.text-white')
  .contains(/upload/i)
  .click({ force: true });

cy.wait(2000);
cy.log('File uploaded successfully');

// --- Click Run on first file in the list ---
cy.log('Clicking Run on first file...');
cy.get('tr:nth-of-type(1) button.bg-blue-500 > span')
  .click({ force: true });

cy.wait(1000);

// --- Wait for Running status ---
cy.log('Waiting for machine to start running...');      //Custom command is not used because of wait time is high
cy.contains(/^Running$/i, { timeout: 30000 })
  .should('be.visible')
  .then(() => {
    cy.log(' File is running');
  });

// --- Wait for job to finish (Idle) ---
cy.log('Waiting for job to complete...');
cy.contains(/^Idle$/i, { timeout: 300000 }) // 5 min timeout for job completion
  .should('be.visible')
  .then(() => {
    cy.log(' Job finished — machine is back to Idle');
  });

  //Delete file test
cy.log('Clicking Delete button...');
cy.get('tr:nth-of-type(1) button.bg-red-500 > span')
  .click({ force: true });

cy.wait(1000);

// Click Confirm button in the dialog
cy.log('Confirming delete...');
cy.get('button.bg-blue-500')
  .contains(/confirm/i)
  .should('be.visible')
  .click({ force: true });

cy.wait(1000);
cy.log(' File deleted successfully');
});
});
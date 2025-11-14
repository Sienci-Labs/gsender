describe('CNC Machine Tests', () => {

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

  it('Test Case 1: Connects to CNC first, uploads file, then disconnects', () => {

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

    // Step 3: Upload file
    cy.wait(5000);
    cy.contains('Load File')
      .should('be.visible')
      .click({ force: true });

    cy.get('#fileInput')
      .selectFile('cypress/fixtures/sample.gcode', { force: true });

    cy.wait(5000);

    // Step 4: Verify uploaded file name
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((fileName) => {
        const trimmedName = fileName.trim();
        cy.log(`Uploaded file name displayed on UI: "${trimmedName}"`);
        expect(trimmedName).to.contain('.gcode');
      });

    // Step 5: Disconnect from CNC
    cy.log('Machine is Idle — disconnecting...');

    cy.get('button.bg-red-600.text-white')
      .contains(/^disconnect$/i)
      .click({ force: true });

    cy.log('Disconnect clicked — verifying status...');

    // Step 6: Verify the machine is disconnected
    cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log('Machine disconnect verified successfully.'));
  });

  it('Test Case 2: Uploads a file first, then connects to CNC and checks status', () => {

    // Step 1: Upload file
    cy.wait(5000);
    cy.contains('Load File')
      .should('be.visible')
      .click({ force: true });

    cy.get('#fileInput')
      .selectFile('cypress/fixtures/sample.gcode', { force: true });

    cy.wait(5000);

    // Step 2: Verify uploaded file name
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((fileName) => {
        const trimmedName = fileName.trim();
        cy.log(`Uploaded file name displayed on UI: "${trimmedName}"`);
        expect(trimmedName).to.contain('.gcode');
      });

    // Step 3: Now connect to CNC
    cy.log('Attempting to connect to CNC...');
    cy.connectMachine();
    cy.wait(5000);
    cy.log('Connected to CNC');

    // Step 4: Verify CNC machine status is Idle
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });
  });

});
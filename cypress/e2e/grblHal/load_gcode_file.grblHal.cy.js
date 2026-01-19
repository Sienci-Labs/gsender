describe('Load file testing in grblHal', () => {

  beforeEach(() => {
    cy.viewport(1689, 810);
    cy.visit('http://localhost:8000/#/');
    cy.wait(2000);
  });
  it('Complete workflow: Connect-> Upload-> Disconnect->Upload-> Connect->Disconnect', () => {

    // ========== STEP 1: Connect to CNC ==========
    cy.log('STEP 1: Connecting to CNC...');
    cy.connectToGrblHAL();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Verify CNC machine status is Idle
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });

    // ========== STEP 2: Upload file (while connected) ==========
    cy.log('STEP 2: Uploading file while connected...');
    cy.wait(5000);
    cy.contains('Load File')
      .should('be.visible')
      .click({ force: true });

    cy.get('#fileInput')
      .selectFile('cypress/fixtures/sample.gcode', { force: true });

    cy.wait(5000);

    // Verify uploaded file name
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((fileName) => {
        const trimmedName = fileName.trim();
        cy.log(`Uploaded file name: "${trimmedName}"`);
        expect(trimmedName).to.contain('.gcode');
      });

    // ========== STEP 3: Disconnect from CNC ==========
    cy.log('STEP 3: Disconnecting from CNC...');

    cy.get('button.bg-red-600.text-white')
      .contains(/^disconnect$/i)
      .click({ force: true });

    cy.log('Disconnect clicked — verifying status...');

    // Verify the machine is disconnected
    cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log('Machine disconnected successfully'));

    // ========== STEP 4: Upload file (while disconnected) ==========
    cy.log('STEP 4: Uploading file while disconnected...');
    cy.wait(5000);
    cy.contains('Load File')
      .should('be.visible')
      .click({ force: true });

    cy.get('#fileInput')
      .selectFile('cypress/fixtures/sample.gcode', { force: true });

    cy.wait(5000);

    // Verify uploaded file name
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((fileName) => {
        const trimmedName = fileName.trim();
        cy.log(`Uploaded file name: "${trimmedName}"`);
        expect(trimmedName).to.contain('.gcode');
      });

    // ========== STEP 5: Connect to CNC again ==========
    cy.log('STEP 5: Connecting to CNC again...');
    cy.connectToGrblHAL();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Verify CNC machine status is Idle
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });

    // ========== STEP 6: Final disconnect ==========
    cy.log('STEP 6: Final disconnect from CNC...');

    cy.get('button.bg-red-600.text-white')
      .contains(/^disconnect$/i)
      .click({ force: true });

    cy.log('Disconnect clicked — verifying status...');

    // Verify the machine is disconnected
    cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log('Test completed successfully!'));
  });

});
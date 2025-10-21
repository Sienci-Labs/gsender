describe('File Upload in connected and disconnected status', () => {

  // Ignore known hydration-related UI errors
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
    cy.viewport(1280, 800);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
  });

  it('Connects, uploads file, closes, disconnects, and re-uploads', () => {

    // Step 1: Connect to CNC
    cy.log('Connecting to CNC...');
    cy.connectMachine();
    cy.wait(3000);
    cy.contains(/^Idle$/i, { timeout: 20000 }).should('be.visible');
    cy.log('CNC Connected and Idle.');

    // Step 2: Upload file
    cy.log('Uploading G-code file...');
    cy.contains('Load File', { timeout: 15000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('input[type="file"]', { timeout: 10000 })
      .should('exist')
      .first()
      .selectFile('cypress/fixtures/sample.gcode', { force: true });

    cy.wait(6000);

    // Step 3: Verify uploaded file name (handles split <h2>)
    cy.log('Verifying uploaded file name...');
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('have.length.at.least', 2)
      .then(($els) => {
        const combinedName = [...$els].map(el => el.innerText.trim()).join('');
        cy.log(`Uploaded file name: "${combinedName}"`);
        expect(combinedName.toLowerCase()).to.include('sample.gcode');
      });

    // Step 4: Close uploaded file
    cy.log('Closing uploaded file...');
    cy.get('button.inline-flex.items-center.justify-center.whitespace-nowrap.rounded-md.text-base.font-medium')
      .filter(':visible')
      .first()
      .click({ force: true });

    cy.wait(3000);

    // Step 5: Disconnect CNC
    cy.log('Disconnecting CNC...');
    cy.contains(/^disconnect/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(5000);
    cy.log('Machine Disconnected.');

    // Step 6: Upload same file again (after disconnect)
    cy.log('Re-uploading same G-code file after disconnect...');
    cy.contains('Load File', { timeout: 15000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('input[type="file"]', { timeout: 10000 })
      .should('exist')
      .first()
      .selectFile('cypress/fixtures/sample.gcode', { force: true });

    cy.wait(6000);

    // Step 7: Verify file name again (split <h2>)
    cy.log('Verifying re-uploaded file name...');
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('have.length.at.least', 2)
      .then(($els) => {
        const combinedName = [...$els].map(el => el.innerText.trim()).join('');
        cy.log(`Re-uploaded file name: "${combinedName}"`);
        expect(combinedName.toLowerCase()).to.include('sample.gcode');
      });

    cy.log('File upload verified for both connected and disconnected states.');
  });

});

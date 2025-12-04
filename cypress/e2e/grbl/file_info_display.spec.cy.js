
describe('CNC Machine File Info Test', () => {

  // Ignore known hydration-related UI errors and the undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
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
    cy.wait(2000); // Give app time to recover from initialization error
  });

  it('Uploads file, toggles, and prints file info', () => {
    const fileName = 'sample.gcode';

    // Step 1: Upload file
    cy.uploadGcodeFile(fileName);

    // Step 2: Verify uploaded file name and print
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const trimmedName = text.trim();
        cy.log(`Uploaded file: ${trimmedName}`);
        expect(trimmedName).to.contain('.gcode');
      });

    // Step 3: Click the toggle button
    cy.get('button[role="switch"]')
      .should('exist')
      .click({ force: true })
      .then(() => cy.log('Toggle button clicked'));

    // Step 4: Print Estimated Time
    cy.contains('span.font-bold', 'Estimated Time')
      .parent()
      .invoke('text')
      .then((val) => cy.log(`Estimated Time: ${val.trim()}`));

    // Step 5: Print Feed
    cy.contains('span.font-bold', 'Feed')
      .parent()
      .invoke('text')
      .then((val) => cy.log(`Feed: ${val.trim()}`));

    // Step 6: Print Speed
    cy.contains('span.font-bold', 'Speed')
      .parent()
      .invoke('text')
      .then((val) => cy.log(`Speed: ${val.trim()}`));

    // Step 7: Print Tools
    cy.contains('span.font-bold', 'Tools')
      .parent()
      .invoke('text')
      .then((val) => cy.log(`Tools: ${val.trim()}`));

    // Step 8: Log full result
    cy.log(`Test Result: Uploaded file "${fileName}" and file information retrieved successfully`);
  });

});
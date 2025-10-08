describe('Connect machine and change Firmware Fallback', () => {
  // Ignore irrelevant UI errors
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

  it('connects machine and changes firmware fallback to Grbl', () => {
    // Step 1: Visit the app
    cy.visit('http://localhost:8000/');
    cy.title().should('eq', 'gSender');
    cy.log('Step 1: App loaded successfully');

    // Step 2: Connect the CNC machine using custom command
    cy.log('Connecting to CNC machine...');
    cy.connectMachine();
    cy.log('Step 2: Machine connected');

    // Step 3: Navigate to Config page
    cy.contains('span', 'Config').parent('div').should('be.visible').click();
    cy.log('Step 3: Config page opened');

    // Step 4: Open Basics section
    cy.contains('button', 'Basics').should('be.visible').click();
    cy.log('Step 4: Basics section opened');

    // Step 5: Locate Firmware Fallback section
    cy.contains('span', 'Firmware fallback')
      .should('be.visible')
      .parent() // parent contains the dropdown
      .within(() => {
        // Step 6: Click dropdown
        cy.get('button[role="combobox"]').click();
        cy.log('Dropdown clicked');

        // Step 7: Select "Grbl" option
        cy.contains('div[role="option"]', 'Grbl').click();
        cy.log('Selected Grbl in firmware fallback');
      });

    // Step 8: Click Apply Settings button
    cy.contains('button', 'Apply Settings')
      .should('not.be.disabled')
      .click();
    cy.log('Step 8: Apply Settings clicked successfully');
  });
});

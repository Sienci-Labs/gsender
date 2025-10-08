describe('Connect machine and change Carve Screen Units', () => {
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

  it('connects machine and changes units from mm to inches', () => {
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

    // Step 5: Locate Carve Screen Units section
    cy.contains('span', 'Carve screen units')
      .should('be.visible')
      .parent() // assuming parent contains the radio buttons
      .within(() => {
        // Step 6: Check if "mm" is selected
        cy.get('button[value="mm"]')
          .should('exist')
          .then(($mmButton) => {
            if ($mmButton.attr('aria-checked') === 'true') {
              // Click "in" button if mm is checked
              cy.get('button[value="in"]').click();
              cy.log('Changed units from mm to inches');
            } else {
              cy.log('Units are already in inches, no change needed');
            }
          });
      });

    // Step 7: Click Apply Settings
    cy.contains('button', 'Apply Settings')
      .should('not.be.disabled')
      .click();
    cy.log('Step 7: Apply Settings clicked successfully');
  });
});

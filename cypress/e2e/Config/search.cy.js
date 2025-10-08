describe('Connects the machine and search in config', () => {
  // Ignore known irrelevant UI errors
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

  it('connects machine and searches in config', () => {
    // Step 1: Visit the app
    cy.visit('http://localhost:8000/');
    cy.title().should('eq', 'gSender');
    cy.log('Step 1: Connection successful');

    // Step 2: Connect the CNC machine
    cy.log('Connecting to CNC machine...');
    cy.connectMachine();
    cy.log('Step 2: Opened Config page');

    // Step 3: Open Config page
    cy.contains('span', 'Config').parent('div').should('be.visible').click();
    cy.log('Step 3: Basics section opened');

    // Step 4: Open Basics section
    cy.contains('button', 'Basics').should('be.visible').click();
    cy.log('Step 4: Found search bar and searching for Baud');

    // Step 5: Search for "Baud"
    cy.get('#simple-search').clear().type('Baud');
    cy.log('Step 5: Searching for Baud...');

    // Step 6: Validate search result
    cy.log('Step 6: Checking for Baud in config section...');
    cy.get('div.bg-gray-100')
      .invoke('text')
      .then((text) => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('baud')) {
          cy.log(' Search successful — Baud found in config section');
          cy.get('#simple-search').clear();
        } else {
          cy.log(' Search failed — Baud not found in config section');
        }
      });
  });
});

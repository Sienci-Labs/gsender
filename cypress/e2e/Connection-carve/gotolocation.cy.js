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

  it('Test Case: Connect to CNC and open Go to Location dialog', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log(' Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(` Machine status: "${status.text().trim()}"`);
      });

    cy.wait(2000);

    // Step 3: Open Go To Location popup
    cy.log('Step 3: Opening Go to Location popup...');
    cy.get('div.min-h-10 button')
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);
    cy.log(' "Go to Location" button clicked');

    // Step 4: Enter 0 in all input fields
    cy.log('Step 4: Entering values...');

    // Get all number inputs in the dialog
    cy.get('body > div:nth-of-type(2) input[type="number"]').then(($inputs) => {
      cy.log(`Found ${$inputs.length} number inputs`);
      
      // X input
      cy.wrap($inputs[0])
        .clear({ force: true })
        .type('0', { force: true })
        .should('have.value', '0');
      cy.log(' X coordinate: 0');

      // Y input  
      cy.wrap($inputs[1])
        .clear({ force: true })
        .type('0', { force: true })
        .should('have.value', '0');
      cy.log('Y coordinate: 0');

      // Z input - triple click to select all, then type
      cy.wrap($inputs[2])
        .focus()
        .clear({ force: true })
        .invoke('val', '')
        .type('0', { force: true })
        .blur()
        .should('have.value', '0');
      cy.log(' Z coordinate: 0');
    });

    cy.wait(500);

    // Step 5: Click Go button
    cy.log('Step 5: Clicking Go button...');
    cy.get('body > div:nth-of-type(2) button')
      .contains('Go!')
      .click({ force: true });
    
    cy.wait(2000);
    cy.log(' Go button clicked');

    // Step 6: Click outside popup to close
    cy.log('Step 6: Closing popup...');
    cy.get('body').click(50, 50, { force: true });

    cy.wait(500);
    cy.log(' Popup closed');

    cy.log('Go To Location flow completed successfully');
  });

});
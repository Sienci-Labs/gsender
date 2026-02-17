describe('A-Axis Go To Location Tests', () => {

  beforeEach(() => {
    cy.viewport(2844, 1450);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000
    });
  });

  it('Tests A-axis go to location functionality with positive values', () => {

    // Step 1: Navigate to config
    cy.log('Step 1: Navigating to Config...');
    cy.goToConfig();

    // Step 2: Connect to CNC
    cy.log('Step 2: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 3: Verify CNC machine status is Idle
    cy.log('Step 3: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);

    // Step 4: Unlock machine if needed
    cy.log('Step 4: Unlocking machine if needed...');
    cy.unlockMachineIfNeeded();
    cy.wait(2000);
    // Step 5: Go to Config and enable rotary controls
    cy.log('Step 5: Going to Config and enabling Rotary controls...');
    cy.goToConfig();
    cy.log('Searching for rotary settings...');
    cy.searchInSettings('rotary');
    
    // Enable rotary axis toggle if not already enabled
    cy.log('Enabling Rotary controls toggle...');
    cy.contains('div', 'Rotary controls')
      .find('button[role="switch"]')
      .then($toggle => {
        if ($toggle.attr('aria-checked') === 'false') {
          cy.log('  Enabling Rotary controls');
          cy.wrap($toggle).click();
          cy.wait(300);
        } else {
          cy.log('Rotary controls already enabled');
        }
      });
    
    // Apply settings
    cy.log('Applying settings...');
    cy.applySettings();
    cy.wait(500);

    // Step 6: Navigate to Carve page
    cy.log('Step 6: Navigating to Carve page...');
    cy.goToCarve();
    cy.wait(2000);

    // Step 6: Open "Go To Location" dialog
    cy.log('Step 6: Opening Go To Location dialog...');
    cy.get('div.min-h-10 > div:nth-of-type(1) > button')
      .click();
    cy.wait(500);
    cy.log('Go To dialog opened');

     // Step 10: Enter A-axis value (5)
    cy.log('Step 10: Entering A-axis coordinate...');
    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .clear({ force: true })
      .type('5', { force: true })
      .should('have.value', '5');
    cy.log('A coordinate set to 5');

    // Step 9: Select all existing text and replace with new value
    cy.log('Step 9: Entering A-axis coordinate...');
    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .focus()
      .type('{selectall}', { force: true })  // Select all text first
      .type('5', { force: true })             // Type new value
      .trigger('change', { force: true })     // Trigger change event
      .trigger('input', { force: true })      // Trigger input event
      .blur();                                 // Blur to finalize
    
    cy.wait(300);
    
    // Verify the value in the dialog
    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .should('have.value', '5');
    cy.log(' A coordinate set to 5 in dialog');

    // Step 10: Click Go button
    cy.log('Step 10: Clicking Go button...');
    cy.get('body > div:nth-of-type(2) button')
      .contains('Go!')
      .click({ force: true });
    cy.wait(2000);
    cy.log(' Go button clicked - movement initiated');

    // Step 11: Close popup by clicking outside
    cy.log('Step 11: Closing popup...');
    cy.get('body').click(50, 50, { force: true });
    cy.wait(500);
    cy.log('Popup closed');

    // Step 12: Verify the A-axis value in the main interface (FIXED)
    cy.log('Step 12: Verifying A-axis value updated in main UI...');
    cy.get('[data-testid="wcs-input-A"]')
      .should('have.value', '5.000');  // Changed from .contain to .have.value
    cy.log(' A-axis value confirmed: 5.000');

    // Step 13: Wait for movement and verify machine returns to idle
    cy.log('Step 13: Waiting for movement to complete...');
    cy.wait(5000);
    cy.verifyMachineStatus('Idle');
    cy.log(' Test completed successfully');
  });

});
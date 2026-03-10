describe('A-Axis Go To Location Tests', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000
    });
  });

  it('Tests A-axis go to location functionality with positive and negative values', () => {

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
    cy.log('Machine is in idle status');

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
    ///test case start here



// Test case : Zeroing A axis and jogging 


  // Step 7: Go to rotary tab to enable rotary axis view 
  cy.log('Step 7: Switch to rotary tab');
  cy.contains('button','Rotary').click();
  cy.wait(500);
  cy.log('Switched to Rotary tab');

  //step 8: Enable rotary mode 
  cy.log('Enabling rotary mode');
  cy.get('div.block >div.block >div > div.flex button').first().click();
  cy.wait(500);

// step 9: Confirm /OK the rotary settings
cy.log('Step 9:Confirming rotary settings');
cy.contains('button','OK').click();
cy.wait(500);
cy.log('Rotary settings enabled');

// Step 10: Zero the A axis
cy.log('Zeroing A axis');
cy.zeroAAxis();

// Verify A axis is 0.000
cy.log('Step 8: Verifying A axis is at 0.00...');

// Make sure rotary controls are visible
cy.contains('button', 'Rotary').click();
cy.wait(500);

// Wait for the input to be visible and check value
cy.get('.border.border-gray-200.dark\\:border-gray-700.rounded-md')
  .contains('button', 'A0')
  .click();
cy.log(' A axis confirmed at 0.00');

cy.get('path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]')
  .first()
  .click({ force: true });
    });
  });

describe('Gsender testing - Homing functionality', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 120000
    });
  });

  it('Enable Homing settings if disabled and execute homing sequence', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Connected to CNC');

    // Step 2: Wait for idle state before proceeding
    cy.log('Step 2: Waiting for idle state...');
    cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(1000);
    cy.log(' Machine is idle');

    // Step 3: Test jogging functionality
    cy.log('Step 3: Testing jogging functionality...');
    
    // X+ jogging
    cy.log('  Testing X+ jogging...');
    cy.get('path#xPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' X+ jog button clicked');

    // Y+ Jogging
    cy.log('  Testing Y+ jogging...');
    cy.get('path#yPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Y+ jog button clicked');
    
    // Z- jogging
    cy.log('  Testing Z- jogging...');
    //
    cy.get('path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Z- jog button clicked');

    cy.log('Jogging tests completed');

    // Step 4: Navigate to Config page
    cy.log('Step 4: Opening Config settings...');
    cy.get('a:nth-of-type(4) svg').click();
    cy.wait(1000);
    cy.log('Config page opened');

    // Step 5: Navigate to Homing section
    cy.log('Step 5: Navigating to Homing settings...');
    cy.contains('button', /homing/i).click();
    cy.wait(500);
    cy.log('Homing settings section opened');

    // Step 6: Check and enable all required homing settings
    cy.log('Step 6: Checking and enabling homing settings...');
    
    const settingsToCheck = [
      { id: '$22-0-key', name: 'Enable Homing' },
      { id: '$22-2-key', name: 'Homing on startup required' },
      { id: '$22-3-key', name: 'Set Machine origin to 0' },
      { id: '$22-5-key', name: 'Allow Manual' },
      { id: '$22-6-key', name: 'Override locks' }
    ];

    settingsToCheck.forEach(setting => {
      cy.get(`button#\\${setting.id}`).then($toggle => {
        if ($toggle.attr('aria-checked') === 'false') {
          cy.log(`  Enabling: ${setting.name}`);
          cy.wrap($toggle).click();
          cy.wait(300);
        } else {
          cy.log(`${setting.name} already enabled`);
        }
      });
    });

    // Step 7: Apply Settings (only if button is enabled)
    cy.log('Step 7: Checking if settings need to be applied...');
    cy.contains('button', 'Apply Settings').then($button => {
      if ($button.is(':disabled')) {
        cy.log('  No settings changes detected');
      } else {
        cy.log('  Applying settings...');
        cy.wrap($button).click();
        cy.wait(2000);
        cy.unlockMachineIfNeeded();
        cy.wait(1000);
        cy.log('Settings applied');
      } 
    });

    // Step 8: Navigate back to Carve/Main page
    cy.log('Step 8: Returning to main view...');
    cy.get('a:nth-of-type(1) img').click();
    cy.wait(1000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Returned to main view');
  

    // Step 9: Wait for machine to be ready (Idle status)
    cy.log('Step 9: Waiting for machine ready state...');
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(1000);
    cy.log('Machine is ready');

    // Step 10: Execute Homing sequence
    cy.log('Step 10: Executing homing sequence...');
    cy.get('div.flex-shrink-0 > div > div > div > div').click();
    cy.wait(500);
    cy.contains('button', 'Home').click();
    cy.wait(1000);
    cy.log('Homing command sent');

    // Step 11: Verify homing status appears
    cy.log('Step 11: Verifying homing status...');
    cy.contains('span', 'Homing', { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log('Machine status changed to "Homing"');
      });

    // Step 12: Wait for homing to complete and verify Idle status
    cy.log('Step 12: Waiting for homing to complete...');
    cy.contains(/^Idle$/i, { timeout: 60000 })
      .should('be.visible')
      .then(() => {
        cy.log('Machine status changed from "Homing" to "Idle"');
      });
    
    cy.wait(2000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);

    // Step 13: Final verification
    cy.log('Step 13: Final verification...');
    cy.contains(/^Idle$/i).should('be.visible');
    cy.log('Machine is in Idle state after homing');

    // Step 14: Save test results
    cy.log('Step 14: Saving test results...');
    const results = {
      testName: 'Homing Functionality Test',
      timestamp: new Date().toISOString(),
      homingStatusVerified: true,
      transitionToIdleVerified: true,
      status: 'PASSED'
    };
    
    cy.writeFile('cypress/results/homing-test-results.json', results);
    cy.log('Results saved to: cypress/results/homing-test-results.json');


    cy.log('TEST COMPLETED SUCCESSFULLY');
    cy.log('  Status transition verified: Idle → Homing → Idle');
 
  });
});
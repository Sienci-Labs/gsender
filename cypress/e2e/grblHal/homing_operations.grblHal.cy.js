describe('Gsender testing - Homing functionality', () => {

  // Ignore known hydration-related UI errors
 Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
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
    cy.wait(2000);
  });

  it('Enable Homing settings if disabled and execute homing sequence', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(3000);
    cy.autoUnlock(); // Use the existing autoUnlock command
    cy.log('Connected to CNC');

    // Step 2: Navigate to Config page
    cy.log('Step 2: Opening Config settings...');
    cy.get('a:nth-of-type(4) svg').click();
    cy.wait(1000);
    cy.log(' Config page opened');

    // Step 3: Navigate to Homing section
    cy.log('Step 3: Navigating to Homing settings...');
    cy.contains('button', /homing/i).click();
    cy.wait(500);
    cy.log(' Homing settings section opened');

    // Step 4: Check and enable all required homing settings
    cy.log('Step 4: Checking and enabling homing settings...');
    
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
          cy.log(`Enabling: ${setting.name}`);
          cy.wrap($toggle).click();
          cy.wait(300);
        } else {
          cy.log(` ${setting.name} already enabled`);
        }
      });
    });

    // Step 5: Apply Settings
    cy.log('Step 5: Applying settings...');
    cy.contains('button', 'Apply Settings').click();
    cy.wait(2000);
    cy.autoUnlock();
    cy.log('Settings applied');

    // Step 6: Navigate back to Carve/Main page
    cy.log('Step 6: Returning to main view...');
    cy.get('a:nth-of-type(1) img').click();
    cy.wait(1000);
    cy.autoUnlock();
    cy.log(' Returned to main view');

    // Step 7: Wait for machine to be ready (Idle status)
    cy.log('Step 7: Waiting for machine ready state...');
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(1000);
    cy.autoUnlock();
    cy.log(' Machine is ready');

    // Step 8: Execute Homing sequence
    cy.log('Step 8: Executing homing sequence...');
    cy.get('div.flex-shrink-0 > div > div > div > div').click();
    cy.wait(500);
    cy.contains('button', 'Home').click();
    cy.wait(1000);
    cy.autoUnlock();
    cy.log(' Homing command sent');

    // Step 9: Verify homing in progress
    cy.log('Step 9: Verifying homing process...');
    cy.contains('span', 'Homing', { timeout: 10000 }).should('be.visible');
    cy.log(' Homing status displayed');

    // Step 10: Wait for homing to complete
    cy.log('Step 10: Waiting for homing to complete...');
    cy.contains(/^Idle$/i, { timeout: 60000 }).should('be.visible');
    cy.wait(2000);
    cy.autoUnlock();
    cy.log('Homing completed successfully');

    // Step 11: Verify machine returned to Idle state
    cy.log('Step 11: Verifying final machine state...');
    cy.contains(/^Idle$/i).should('be.visible');
    cy.log(' Machine is in Idle state after homing');

    // Step 12: Verify final position is (0, 0, 0)
    cy.log('Step 12: Checking final position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .then(($inputs) => {
        const xValue = parseFloat($inputs.eq(0).val());
        const yValue = parseFloat($inputs.eq(1).val());
        const zValue = parseFloat($inputs.eq(2).val());
        
        cy.log(`Final position: X=${xValue}, Y=${yValue}, Z=${zValue}`);
        
        expect(xValue).to.equal(0);
        expect(yValue).to.equal(0);
        expect(zValue).to.equal(0);
        
        cy.log(' Machine is at home position (0.00, 0.00, 0.00)');
        cy.log(' Test completed successfully - All homing checks passed');
      });
  });
});
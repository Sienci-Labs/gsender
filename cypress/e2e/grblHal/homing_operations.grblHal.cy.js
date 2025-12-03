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
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Connected to CNC');

    // Step 2: Wait for idle state before proceeding
    cy.log('Step 2: Waiting for idle state...');
    cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(1000);

    //X+jogging
    cy.log(' Testing X+ jogging...');
    cy.get('path#xPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' X+ jog button clicked');

    //Y+ Jogging
    cy.log(' Testing Y+ jogging...');
    cy.get('path#yPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Y+ jog button clicked');
    //Z- jogging
    cy.log('Step 10: Testing Z- jogging...');
    cy.get('path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Z- jog button clicked');



    // Step 3: Navigate to Config page
    cy.log('Step 3: Opening Config settings...');
    cy.get('a:nth-of-type(4) svg').click();
    cy.wait(1000);
    cy.log('Config page opened');

    // Step 4: Navigate to Homing section
    cy.log('Step 4: Navigating to Homing settings...');
    cy.contains('button', /homing/i).click();
    cy.wait(500);
    cy.log('Homing settings section opened');

    // Step 5: Check and enable all required homing settings
    cy.log('Step 5: Checking and enabling homing settings...');
    
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
          cy.log(`${setting.name} already enabled`);
        }
      });
    });

    // Step 6: Apply Settings (only if button is enabled)
    cy.log('Step 6: Checking if settings need to be applied...');
    cy.contains('button', 'Apply Settings').then($button => {
      if ($button.is(':disabled')) {
        cy.log('No settings changes detected - Apply Settings button is disabled, continuing...');
      } else {
        cy.log('Applying settings...');
        cy.wrap($button).click();
        cy.wait(2000);
        cy.unlockMachineIfNeeded();
        cy.wait(1000);
        cy.log('Settings applied');
      }
    });

    // Step 7: Navigate back to Carve/Main page
    cy.log('Step 7: Returning to main view...');
    cy.get('a:nth-of-type(1) img').click();
    cy.wait(1000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Returned to main view');

    // Step 8: Wait for machine to be ready (Idle status)
    cy.log('Step 8: Waiting for machine ready state...');
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(1000);
    cy.log('Machine is ready');

    // Step 9: Execute Homing sequence
    cy.log('Step 9: Executing homing sequence...');
    cy.get('div.flex-shrink-0 > div > div > div > div').click();
    cy.wait(500);
    cy.contains('button', 'Home').click();
    cy.wait(1000);
    cy.log('Homing command sent');

    // Step 10: Verify homing in progress
    cy.log('Step 10: Verifying homing process...');
    cy.contains('span', 'Homing', { timeout: 10000 }).should('be.visible');
    cy.log('Homing status displayed');

    // Step 11: Wait for homing to complete
    cy.log('Step 11: Waiting for homing to complete...');
    cy.contains(/^Idle$/i, { timeout: 60000 }).should('be.visible');
    cy.wait(2000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Homing completed successfully');

    // Step 12: Verify machine returned to Idle state
    cy.log('Step 12: Verifying final machine state...');
    cy.contains(/^Idle$/i).should('be.visible');
    cy.log('Machine is in Idle state after homing');

    // Step 13: Verify final position is (0, 0, 0)
    cy.log('Step 13: Checking final position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .then(($inputs) => {
        const xValue = parseFloat($inputs.eq(0).val());
        const yValue = parseFloat($inputs.eq(1).val());
        const zValue = parseFloat($inputs.eq(2).val());
        
        cy.log(`Final position: X=${xValue}, Y=${yValue}, Z=${zValue}`);
        
        expect(xValue).to.equal(0);
        expect(yValue).to.equal(0);
        expect(zValue).to.equal(0);
        
        cy.log('Machine is at home position (0.00, 0.00, 0.00)');
      });

  
    cy.log('Test completed successfully - All homing checks passed');
  });
});
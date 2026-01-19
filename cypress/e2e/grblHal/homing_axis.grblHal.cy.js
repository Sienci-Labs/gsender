describe('Gsender testing - AXIS Homing functionality', () => {

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
  cy.viewport(1920, 1080);
  // Use loadUI custom command with dynamic baseUrl
  cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
    maxRetries: 3,
    waitTime: 3000,
    timeout: 5000
  });
});

  it('Enable axis Homing settings if disabled and execute homing sequence', () => {

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

    //X+ jogging
    cy.log('Testing X+ jogging...');
    cy.get('path#xPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log('X+ jog button clicked');

    //Y+ Jogging
    cy.log('Testing Y+ jogging...');
    cy.get('path#yPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log('Y+ jog button clicked');
    
    //Z- jogging
    cy.log('Testing Z- jogging...');
    cy.get('path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log('Z- jog button clicked');

    // Step 3: Navigate to Config page
    cy.log('Step 3: Opening Config settings...');
    cy.get('a:nth-of-type(4) span').click();
    cy.wait(1000);
    cy.log('Config page opened');

    // Step 4: Navigate to Homing section
    cy.log('Step 4: Navigating to Homing settings...');
    cy.get('button:nth-of-type(6) > span:nth-of-type(2)').click();
    cy.wait(500);
    cy.log('Homing settings section opened');

    // Step 5: Check and enable all required homing settings
    cy.log('Step 5: Checking and enabling homing settings...');
    
    const settingsToCheck = [
      { id: '$22-0-key', name: 'Enable Homing' },
      { id: '$22-1-key', name: 'Enable single axis commands'},
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
    cy.get('#app > div > div.h-full > div.flex img').click();
    cy.wait(1000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Returned to main view');

    // Step 8: Zero out X, Y, Z axes
    cy.log('Step 8: Zeroing out axes...');
    
    cy.log('Setting X to zero...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
      .should('contain.text', 'X0')
      .click();
    cy.wait(1000);

    cy.log('Setting Y to zero...');
    cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
      .should('contain.text', 'Y0')
      .click();
    cy.wait(1000);

    cy.log('Setting Z to zero...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
      .should('contain.text', 'Z0')
      .click();
    cy.wait(1000);
    cy.log('All axes zeroed');

    // Step 9: Enable Homing Toggle
    cy.log('Step 9: Enabling homing toggle...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button')
      .click();
    cy.wait(1000);
    cy.log('Homing toggle enabled');

    // Step 10: Verify axes changed to HX, HY, HZ
    cy.log('Step 10: Verifying axes changed to homing mode...');
    
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
      .should('contain.text', 'HX');
    cy.log('X axis changed to HX');

    cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
      .should('contain.text', 'HY');
    cy.log('Y axis changed to HY');

    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
      .should('contain.text', 'HZ');
    cy.log('Z axis changed to HZ');

    // Step 11: Execute Z-axis homing first to block the unnecessary errors or crashes 
    cy.log('Step 13: Executing Z-axis homing...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
      .contains('HZ')
      .click();
    cy.wait(2000);
    
    cy.log('Waiting for Z-axis homing to complete...');
    cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('Z-axis homing completed - Machine is Idle');
    cy.wait(1000);


    // Step 12: Execute X-axis homing
    cy.log('Step 11: Executing X-axis homing...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
      .contains('HX')
      .click();
    cy.wait(2000);
    
    cy.log('Waiting for X-axis homing to complete...');
    cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('X-axis homing completed - Machine is Idle');
    cy.wait(1000);

    // Step 13: Execute Y-axis homing
    cy.log('Step 12: Executing Y-axis homing...');
    cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
      .contains('HY')
      .click();
    cy.wait(2000);
    
    cy.log('Waiting for Y-axis homing to complete...');
    cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('Y-axis homing completed - Machine is Idle');
    cy.wait(1000);
    
    cy.log('Axis homing test completed successfully!');
  });
});
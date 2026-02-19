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

    // Step 1: Navigate to Config
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
          cy.log('  Rotary controls already enabled');
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

    // Step 7: Click the Rotary tab on the Carve page
    cy.log('Step 7: Clicking Rotary tab...');
    cy.contains('button', 'Rotary')
      .filter(':visible')
      .click();
    cy.wait(500);
    cy.log('Rotary tab opened');

    // Probe Rotary Axis 

    // Step 8: Click the "Probe Rotary Z-Axis" button
    cy.log('Step 8: Opening Probe Rotary Z-Axis dialog...');
    cy.get('div.block > div.block div:nth-of-type(3) > button')
      .filter(':visible')
      .contains('Probe Rotary')
      .click();
    cy.wait(500);
    cy.log('Probe Rotary dialog opened');

    // Step 9: Confirm the probe routine by clicking Run
    cy.log('Step 9: Clicking Run to start probe routine...');
    cy.get('[id^="radix-"] button.bg-blue-500')
      .filter(':visible')
      .contains('Run')
      .click();
    cy.wait(500);
    cy.log('Probe Rotary routine started');

    // Step 10: Wait for probe routine to complete and verify machine is Idle
    cy.log('Step 10: Waiting for probe routine to complete...');
    cy.wait(15000);
    cy.unlockMachineIfNeeded();
    cy.wait(3000);
    cy.verifyMachineStatus('Idle');
    cy.log('Probe Rotary routine completed — machine back to Idle');

  // Mounting Setup 
    // Step 11: Disable Rotary axis before Mounting Setup
    cy.log('Step 11: Disabling Rotary axis...');
    cy.get('button[role="switch"]')
      .then(($toggle) => {
        if ($toggle.attr('aria-checked') === 'true') {
          cy.wrap($toggle).click();
        }
      });

    // Verify it is now disabled (unchecked)
    cy.get('button[role="switch"]')
      .should('have.attr', 'aria-checked', 'false');
    cy.log('Rotary axis disabled');

    // Step 12: Click "Mounting Setup" button
    cy.log('Step 12: Clicking Mounting Setup...');
    cy.contains('button', 'Mounting Setup')
      .filter(':visible')
      .click();
    cy.wait(500);
    cy.log('Mounting Setup dialog opened');

    // Step 13: Select the first mounting position (top-left quadrant)
    cy.log('Step 13: Selecting first mounting position...');
    cy.get('[id^="radix-"] > div.justify-between > div:nth-of-type(1) div:nth-of-type(1) > button')
      .filter(':visible')
      .click();
    cy.wait(300);
    cy.log('First mounting position selected');

    // Step 14: Select the second mounting position (bottom-right quadrant)
    cy.log('Step 14: Selecting second mounting position...');
    cy.get('[id^="radix-"] > div.justify-between > div:nth-of-type(2) div:nth-of-type(2) > button')
      .filter(':visible')
      .click();
    cy.wait(300);
    cy.log('Second mounting position selected');

    // Step 15: Click "Load G-Code to Visualizer"
    cy.log('Step 15: Loading G-Code to Visualizer...');
    cy.contains('button', 'Load G-Code to')
      .filter(':visible')
      .click();
    cy.wait(1000);
    cy.log('G-Code loaded to Visualizer');

    // Step 16: Click the "Start" button to begin the job
    cy.log('Step 16: Starting the job...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .filter(':visible')
      .contains('Start')
      .click();
    cy.wait(500);
    cy.log('Job started');

    // Step 17: Wait for job to complete and verify machine returns to Idle
    cy.log('Step 17: Waiting for mounting job to complete...');
    cy.wait(150000);
    cy.unlockMachineIfNeeded();
    cy.wait(5000);
    cy.verifyMachineStatus('Idle');
    cy.log('Mounting Setup job completed — machine back to Idle');

      cy.log('Closing job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log(' Popup closed');

    // ─── A-Axis Go To Location 

    // Step 18: Toggle Rotary axis back on and confirm dialog
    cy.log('Step 18: Toggling Rotary axis on...');
    cy.get('div.block > div.block > div > div.flex button')
      .first()
      .then($toggle => {
        cy.log(`  Rotary toggle current state: ${$toggle.attr('aria-checked') ?? 'unknown'}`);
        if ($toggle.attr('aria-checked') === 'false' || $toggle.attr('aria-checked') === undefined) {
          cy.wrap($toggle).click();
          cy.wait(300);
          cy.log('  Rotary toggled — confirming dialog...');
          cy.get('button.bg-blue-500')
            .filter(':visible')
            .contains('OK')
            .click();
          cy.wait(500);
          cy.log('  Rotary enabled and dialog confirmed');
        } else {
          cy.log('  Rotary already enabled');
        }
      });

    cy.wait(1000);
    cy.unlockMachineIfNeeded();

    // Step 19: Open "Go To Location" dialog
    cy.log('Step 19: Opening Go To Location dialog...');
    cy.get('div.min-h-10 > div:nth-of-type(1) > button')
      .click();
    cy.wait(500);
    cy.log('Go To dialog opened');

    // Step 20: Enter A-axis value (5)
    cy.log('Step 20: Entering A-axis coordinate...');
    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .focus()
      .type('{selectall}', { force: true })
      .type('5', { force: true })
      .trigger('change', { force: true })
      .trigger('input', { force: true })
      .blur();
    cy.wait(300);

    // Verify the value in the dialog
    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .should('have.value', '5');
    cy.log('A coordinate set to 5 in dialog');

    // Step 21: Click Go button
    cy.log('Step 21: Clicking Go button...');
    cy.get('body > div:nth-of-type(2) button')
      .contains('Go!')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Go button clicked - movement initiated');

    // Step 22: Close popup by clicking outside
    cy.log('Step 22: Closing popup...');
    cy.get('body').click(50, 50, { force: true });
    cy.wait(500);
    cy.log('Popup closed');

    // Step 23: Verify the A-axis value in the main interface
    cy.log('Step 23: Verifying A-axis value updated in main UI...');
    cy.get('[data-testid="wcs-input-Y"]:not([disabled])')
      .should('have.value', '5.00');
    cy.log('A-axis value confirmed: 5.00');

    // Step 24: Wait for movement and verify machine returns to Idle
    cy.log('Step 24: Waiting for movement to complete...');
    cy.wait(5000);
    cy.verifyMachineStatus('Idle');
    cy.log('Go To Location test completed successfully');

    cy.log('All tests completed successfully');
  });

});
describe('Rotary surfacing', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);

    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Rotary surfacing', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');

    cy.wait(2000);

    cy.unlockMachineIfNeeded();

    //Go to Config and turn on rotary surfacing 
    cy.goToConfig();
    cy.log('Search for rotary and enable');
    cy.searchInSettings('rotary');
    cy.log('Enabling Rotary controls toggle...');
    //Enabling rotary axis

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

  //Apply setting 
  cy.applySettings();

  // Go to carve and do rotary surfacing 
  cy.goToCarve();


    cy.log('Select Rotary tab ');
    cy.contains('button', 'Rotary')
      .should('be.visible')
      .click();
    cy.wait(500);
    cy.log('Rotary tab opened');

    cy.log('Click on rotary surfacing...');
    cy.contains('button', 'Rotary Surfacing')
      .should('be.visible')
      .click();
    cy.wait(500);
    cy.log('Rotary Surfacing opened');

    // Run rotary surfacing here
    
    // Step 3: Configure Stock Length
    cy.log('Step 3: Setting stock length to 100mm');
    cy.get('#stockLength')
      .should('be.visible')
      .clear()
      .type('100');
    
    // Step 4: Configure Start Height
    cy.log('Step 4: Setting start height to 50mm');
    cy.get('#startHeight')
      .should('be.visible')
      .clear()
      .type('50');
    
    // Step 5: Configure Final Height
    cy.log('Step 5: Setting final height to 47mm');
    cy.get('#finalHeight')
      .should('be.visible')
      .clear()
      .type('47');
    
    // Step 6: Configure Stepdown (first value)
    cy.log('Step 6: Setting stepdown to 0.75mm');
    cy.get('#stepdown')
      .should('be.visible')
      .clear()
      .type('0.75');
    cy.wait(300);
    
    // Step 7: Configure Bit Diameter
    cy.log('Step 7: Setting bit diameter to 6.35mm');
    cy.get('#bitDiameter')
      .should('be.visible')
      .clear()
      .type('6.35');
    
    // Step 8: Configure Stepover
    cy.log('Step 8: Setting stepover to 15%');
    cy.get('#stepover')
      .should('be.visible')
      .clear()
      .type('15');
    
    // Step 9: Configure Feedrate
    cy.log('Step 9: Setting feedrate to 3000 mm/min');
    cy.get('#feedrate')
      .should('be.visible')
      .clear()
      .type('3000');
    
    // Step 10: Configure Spindle RPM
    cy.log('Step 10: Setting spindle RPM to 17000');
    cy.get('#spindleRPM')
      .should('be.visible')
      .clear()
      .type('17000');
    // Step 12: Generate G-Code
    cy.log('Step 12: Generating G-Code');
    cy.contains('button', 'Generate G-Code')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('G-Code generated successfully');
    
    // Step 13: Load to Main Visualizer
    cy.log('Step 13: Loading to main visualizer');
    cy.contains('button', 'Load to Main')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Loaded to main visualizer');
    
    // Step 14: Toggle info panel
    cy.log('Step 14: Opening info panel');
    cy.get('[data-testid="toggle-info"]')
      .should('be.visible')
      .click();
    cy.wait(500);
    
    // Step 15: Start the job
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    //Wait for 10 seconds 
    cy.log('Step 16: Waiting 10 seconds before pausing...');
    cy.wait(10000);
    
    // Step 16: Stop the job
    cy.log('Step 16: Stopping the job');
    cy.contains('button', 'Stop')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Job stopped');
    
    // Step 17: Close the dialog
    cy.log('Step 17: Closing dialog');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click();
    cy.wait(500);
    cy.log('Test completed successfully');

  });

});
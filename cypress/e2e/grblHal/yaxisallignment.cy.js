describe('Rotary surfacing, Y axis allignment', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);

    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Does probing for Y Z and A axis before rotary operations', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');

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

  //Go to Tools 
  cy.goToCarve();
  cy.log('Select Rotary tab ');
  cy.contains('button', 'Rotary')
  .should('be.visible')
  .click();
cy.wait(500);
cy.log(' Rotary tab opened');

cy.log('Clicking on Y-Axis Alignment button...');
cy.contains('button.border-blue-500', 'Y-Axis Alignment')
  .should('be.visible')
  .click();
cy.wait(500);
cy.log('Y-Axis Alignment clicked');

// Run Y axis allignment 

cy.log('Clicking Run button in Y-Axis Alignment dialog...');
cy.get('div[role="alertdialog"]')
  .contains('button', 'Run')
  .click();
cy.wait(500);
cy.log(' Run button clicked - Y-Axis Alignment probing started');

cy.log('Waiting for machine to complete probing...');

// Verify machine is running
cy.wait(3000); // ADD THIS - give time to start
cy.verifyMachineStatus('Running');
cy.log('Machine status: Running');

// Wait for minimum probing time
cy.wait(10000); 
cy.unlockMachineIfNeeded();
// Wait for machine to return to Idle
cy.verifyMachineStatus('Idle', { timeout: 60000 });
cy.unlockMachineIfNeeded();
cy.wait(2000); // ADD THIS - ensure fully settled
cy.log(' Machine status: Idle - Probing completed');
// Verify Y axis value is 0
cy.get('input[data-testid="wcs-input-Y"]')
  .should('have.value', '0.00')
  .then(($input) => {
    const yValue = parseFloat($input.val());
    cy.log(`Y axis value: ${yValue}`);
    expect(yValue).to.equal(0, 'Y axis should be 0');
  });

// Verify A axis value is 0
cy.get('input[data-testid="wcs-input-A"]')
  .should('have.value', '0.000')
  .then(($input) => {
    const aValue = parseFloat($input.val());
    cy.log(`A axis value: ${aValue}`);
    expect(aValue).to.equal(0, 'A axis should be 0');
  });

cy.log('Y and A axis values verified as 0');

  });

});

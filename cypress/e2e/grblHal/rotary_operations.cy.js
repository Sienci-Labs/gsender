describe('Config features tests', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Checks all config functionalities including reset, export, import, changes, and navigation', () => {

    // go to config
    cy.goToConfig();

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);
    cy.log('Machine is in idle status');

    cy.unlockMachineIfNeeded();
    cy.wait(2000);

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
  // Apply settings 
  cy.log('Applying settings');
  cy.applySettings();
  cy.wait(500);

  //Go to carve 
  cy.goToCarve();
// Test case 1: A axis zeroing  


  //A axis jogging 
  cy.log('A axis jogging check ');


  // Click A-axis button to zero axis
  cy.log('Selecting A-axis...');
  cy.get('button[aria-label="A"], button').contains('A').click();
  cy.wait(1000);

  //Test Case 2: A axis jogging 

  // Jog positive (clockwise)
  cy.log('Jogging A+ (clockwise)...');
  cy.jogAPlusTimes(1);
  cy.wait(1000);

  // Jog negative (counter-clockwise)
  cy.log('Jogging A- (counter-clockwise)...');
  cy.jogAMinusTimes(1);
  cy.wait(1000);

  cy.log('A-axis jogging completed');

  //Test case 3: A axis go to 




  });

});
describe('Console commands testing ', () => { 

  //Ignoring known hydration error
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

  it('Connects machine and sets axes to zero', () => {

    //Connection
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(3000);
    cy.autoUnlock();
    cy.log('Connected to CNC');

    //Waiting until idle status 
    cy.log('Step 2: Waiting for idle state...');
    cy.contains(/^idle$/i, {timeout : 30000}).should('be.visible');
    cy.wait(1000);

    //Go to console and clear 
    cy.log('Step 3: Clearing console...');
    cy.clearConsole();
    cy.log('Console cleared successfully');
    cy.wait(1000);

    //Input G-code commands to set axes to 0
    cy.log('Step 4: Setting axes to zero...');
    
    // Set X axis to 0
    cy.sendConsoleCommand('G10 L20 P0 X0');
    cy.wait(1500);

    // Set Y axis to 0
    cy.sendConsoleCommand('G10 L20 P0 Y0');
    cy.wait(1500);

    // Set Z axis to 0
    cy.sendConsoleCommand('G10 L20 P0 Z0');
    cy.wait(1500);

    cy.log('All axes set to zero commands sent');

    //Verify axes are at 0
    cy.log('Step 5: Verifying axes positions...');
    cy.verifyAxes(0, 0, 0);
    cy.log('Test completed successfully - all axes verified at zero');

    //Disconnect machine 
    cy.disconnectIfIdle();
    cy.log('Machine is disconnected');

  });

  it.only('Connects machine and moves to position 5,5,5', () => {
    
    //Connects machine 
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(3000);
    cy.autoUnlock();
    cy.log('Connected to CNC');

    //Waiting until idle status 
    cy.log('Step 2: Waiting for idle state...');
    cy.contains(/^idle$/i, {timeout : 30000}).should('be.visible');
    cy.wait(1000);

    //Go to console and clear 
    cy.log('Step 3: Clearing console...');
    cy.clearConsole();
    cy.log('Console cleared successfully');
    cy.wait(1000);

    //Makes axes 0,0,0
    cy.goToLocation(0,0,0);

    // Go to axis 5,5,5
    cy.log('Step 4: Moving to position X5 Y5 Z5...');
    cy.sendConsoleCommand('G0 X5 Y5 Z5');
    cy.wait(5000); // Wait longer for machine to move

    //Verify axes are at 5,5,5
    cy.log('Step 5: Verifying axes positions...');
    cy.verifyAxes(5, 5, 5);
    cy.log('Test completed successfully - all axes verified at 5,5,5');

    //Disconnect machine 
    cy.disconnectIfIdle();
    cy.log('Machine is disconnected');

  });

});
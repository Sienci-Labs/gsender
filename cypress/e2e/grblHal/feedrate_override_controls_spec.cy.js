describe('Job run in grblHal', () => {

  // Ignore known hydration-related UI errors and undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false; // ignore these exceptions
    }
    return true;
  });

  beforeEach(() => {
    cy.viewport(1280, 800);
    
    // Use custom loadUI command
    cy.loadUI('http://localhost:8000/#/', {
      maxRetries: 3,
      waitTime: 2000,
      timeout: 20000
    });
  });

  it('Test Case: job run', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });

    cy.wait(2000);

  
    cy.log("Enabling single axis homing.....!!!");
    cy.enableAxisHomingAndHome();
    cy.unlockMachineIfNeeded();
    cy.log("All axes homed");
    //Click on Toggle button to disable axis homing now ( because the button now is HX not X) 
      cy.log('Enabling homing toggle button...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button')
    .click();
  cy.wait(1000);
  
    cy.log("Make all axes 0");
    
    cy.zeroAllAxes();
    cy.log("All axes are zero now..!!!")


    });

  });
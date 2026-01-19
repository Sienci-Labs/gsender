describe('CNC Machine Tests GrblHal', () => {

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
    cy.viewport(1920, 1080);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000); // Give app time to recover from initialization error
  });

  it('Test Case: Connect to CNC and determine the firmware', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(` Machine status: "${status.text().trim()}"`);
      });

    cy.wait(2000);
    
    // Check firmware type
    cy.log('Step 3: Checking the firmware connected...');
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();

      if (text.includes('grblhal')) {
        cy.log('Firmware Detected: GrblHAL');
      } else if (text.includes('grbl')) {
        cy.log(' Firmware Detected: Grbl');
      } else {
        cy.log(' Firmware information not found.');
      }
    });

    // Step 3: Open Go To Location popup
    cy.log('Step 4: Opening Go to Location popup...');
    cy.get('button[aria-controls="radix-:rn:"]').click(); //to find the excat button 
    ({ force: true });

    cy.wait(1000);
    cy.log('"Go to Location" button clicked');

    // Step 4: Enter 0 in all input fields
    cy.log('Step 4: Entering values...');

    // Get all number inputs in the dialog
    cy.get('body > div:nth-of-type(2) input[type="number"]').then(($inputs) => {
      cy.log(`Found ${$inputs.length} number inputs`);
      
      // X input
      cy.wrap($inputs[0])
        .clear({ force: true })
        .type('0', { force: true })
        .should('have.value', '0');
      cy.log('X coordinate: 0');

      // Y input  
      cy.wrap($inputs[1])
        .clear({ force: true })
        .type('0', { force: true })
        .should('have.value', '0');
      cy.log('Y coordinate: 0');

      // Z input
      cy.wrap($inputs[2])
        .focus()
        .clear({ force: true })
        .invoke('val', '')
        .type('0', { force: true })
        .blur()
        .should('have.value', '0');
      cy.log('Z coordinate: 0');
    });

    cy.wait(500);

    // Step 5: Click Go button
    cy.log('Step 5: Clicking Go button...');
    cy.get('body > div:nth-of-type(2) button')
      .contains('Go!')
      .click({ force: true });
    
    cy.wait(2000);
    cy.log('Go button clicked');

    // Step 6: Click outside popup to close
    cy.log('Step 6: Closing popup...');
    cy.get('body').click(50, 50, { force: true });
    cy.wait(500);
    cy.log('Popup closed');

    // Step 7: Wait for machine to reach position
    cy.log('Step 7: Waiting for machine to reach position...');
    cy.wait(3000);

    // Step 8: Verify position values are 0.00
    cy.log('Step 8: Verifying machine position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .should('have.length', 3)
      .then(($inputs) => {
        const xValue = $inputs.eq(0).val();
        const yValue = $inputs.eq(1).val();
        const zValue = $inputs.eq(2).val();
        
        cy.log(`Current position: X=${xValue}, Y=${yValue}, Z=${zValue}`);
        
        // Verify all values are 0.00
        cy.wrap($inputs.eq(0)).should('have.value', '0.00');
        cy.wrap($inputs.eq(1)).should('have.value', '0.00');
        cy.wrap($inputs.eq(2)).should('have.value', '0.00');
        
        // Check if all are 0.00
        if (xValue === '0.00' && yValue === '0.00' && zValue === '0.00') {
          cy.log('TEST PASSED: Machine is at home position (0.00, 0.00, 0.00)');
        } else {
          cy.log('TEST FAILED: Machine is not at home position');
          throw new Error(`Expected position (0.00, 0.00, 0.00) but got (${xValue}, ${yValue}, ${zValue})`);
        }
      });

    cy.log(' Go To Location flow completed successfully');
  });

});
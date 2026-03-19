describe('gSender XY Squaring Test', () => {

  beforeEach(() => {
    cy.viewport(2844, 1450);
    // Load the UI
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000
    });
  });

  it('Should complete XY Squaring wizard with measurements and adjustments', () => {
    
    // ========== POSITIVE TEST CASE ==========
    
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

    // Step 3: Unlock machine if needed
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 4: Navigate to Tools page
    cy.log('Step 4: Navigating to Tools page...');
    cy.goToTools();
    cy.log('Tools page opened');

    // Step 5: Click on XY Squaring tool
    cy.log('Step 5: Opening XY Squaring tool...');
   cy.contains('div.rounded-lg', 'XY Squaring')
  .should('be.visible')
  .click();

    // Step 6: Click "Start XY Squaring" button
    cy.log('Step 6: Starting XY Squaring wizard...');
    cy.get('button')
      .contains('Start XY Squaring')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('XY Squaring wizard started');

    // Step 7: Open Jog Controls
    cy.log('Step 7: Opening Jog Controls...');
    cy.get('div.justify-start > div:nth-of-type(1) > div:nth-of-type(2) span')
      .contains('Jog Controls')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Jog Controls opened');

    // Step 8: Set jog distance to 10mm
    cy.log('Step 8: Setting jog distance to 10mm...');
    cy.get('body > div:nth-of-type(2) div.gap-1 > div.items-center > div > div:nth-of-type(1) > div')
      .should('be.visible')
      .click();
    cy.wait(500);
    
    cy.get('body > div:nth-of-type(2) div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .clear()
      .type('10');
    cy.wait(500);
    cy.log('✓ Jog distance set to 10mm');

    // Jogging x axis one time 
    cy.get('#xPlus').click({ force: true });
    cy.log("X axis jogged one time");

    // Step 10: Mark Point 1
    cy.log('Step 10: Marking Point 1...');
    cy.get('button')
      .contains('Mark Point 1')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Point 1 marked');

    // Step 11: Move X-axis
    cy.log('Step 11: Moving X-axis...');
    cy.get('button')
      .contains('Move X-axis')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('X-axis moved');

    // Step 12: Mark Point 2
    cy.log('Step 12: Marking Point 2...');
    cy.get('button')
      .contains('Mark Point 2')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Point 2 marked');

    // Step 13: Move Y-axis
    cy.log('Step 13: Moving Y-axis...');
    cy.get('button')
      .contains('Move Y-axis')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Y-axis moved');

    // Step 14: Mark Point 3
    cy.log('Step 14: Marking Point 3...');
    cy.get('button')
      .contains('Mark Point 3')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Point 3 marked');

    // Click on Next Step
    cy.log('Clicking next step');
    cy.contains('button', 'Next Step').click({ force: true });

    // Step 15: Enter Point 1 Y measurement
    cy.log('Step 15: Entering Point 1 Y measurement (300)...');
    cy.get('div.bg-blue-50 input')
      .first()
      .should('be.visible')
      .clear()
      .type('300{enter}');
    cy.wait(1000);
    cy.log('Point 1 Y measurement entered: 300mm');

    // Step 16: Enter X-axis movement distance
    cy.log('Step 16: Entering X-axis movement distance (300mm)...');
    cy.get('div.space-y-6 > div:nth-of-type(2) input')
      .should('be.visible')
      .clear()
      .type('300{enter}');
    cy.wait(1000);
    cy.log('X-axis movement distance entered: 300mm');

    // Step 17: Enter Point 2 Y measurement
    cy.log('Step 17: Entering Point 2 Y measurement (424.26mm)...');
    cy.get('div.space-y-6 > div:nth-of-type(3) input')
      .should('be.visible')
      .clear()
      .type('424.26');
    cy.wait(1000);
    cy.log('Point 2 Y measurement entered: 424.26mm');

   
    // Step 19-21: Click all three Confirm buttons in sequence
    cy.log('Step 19-21: Clicking all three Confirm buttons...');

    // First confirm
    cy.get('[testid="confirm 1-2"]')
      .should('be.visible')
      .click();
    cy.wait(500);
    cy.log('Confirm button 1-2 clicked');

    // Second confirm  
    cy.get('[testid="confirm 2-3"]')
      .should('be.visible')
      .click();
    cy.wait(500);
    cy.log('Confirm button 2-3 clicked');

    // Third confirm
    cy.get('[testid="confirm 1-3"]')
      .should('be.visible')
      .click();
    cy.wait(500);
    cy.log('Confirm button 1-3 clicked');

    // Step 23: Click "Next Step" to proceed
    cy.log('Step 23: Proceeding to next step...');
    cy.get('button')
      .contains('Next Step')
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    cy.wait(1500);
    cy.log('Proceeded to next step');

    // Step 24: Verify success message
    cy.log('Step 24: Verifying machine is properly squared...');
    cy.contains('Your machine is properly squared!')
      .should('be.visible');
    cy.log('Machine is properly squared - Positive test completed!');

    // Find button Restart Wizard and click 

    cy.contains('button','Restart Wizard').click();

    // ========== NEGATIVE TEST CASE ==========
    
    cy.log('STARTING NEGATIVE TEST CASE');

    // Step 25: Restart Wizard for negative testing
   
    
    // Step 6: Click "Start XY Squaring" button
    cy.log('Step 6: Starting XY Squaring wizard...');
    cy.get('button')
      .contains('Start XY Squaring')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('XY Squaring wizard started');

    // Repeat steps to mark points
    cy.log('Marking Point 1...');
    cy.get('button')
      .contains('Mark Point 1')
      .should('be.visible')
      .click();
    cy.wait(1000);

    cy.log('Moving X-axis...');
    cy.get('button')
      .contains('Move X-axis')
      .should('be.visible')
      .click();
    cy.wait(2000);

    cy.log('Marking Point 2...');
    cy.get('button')
      .contains('Mark Point 2')
      .should('be.visible')
      .click();
    cy.wait(1000);

    cy.log('Moving Y-axis...');
    cy.get('button')
      .contains('Move Y-axis')
      .should('be.visible')
      .click();
    cy.wait(2000);

    cy.log('Marking Point 3...');
    cy.get('button')
      .contains('Mark Point 3')
      .should('be.visible')
      .click();
    cy.wait(1000);

    cy.log('Clicking Next Step...');
    cy.contains('button', 'Next Step').click({ force: true });
    cy.wait(1000);

    // Enter measurements with incorrect Point 2 value
    cy.log('NEGATIVE TEST: Entering Point 1 Y measurement (300mm)...');
    cy.get('div.bg-blue-50 input')
      .first()
      .should('be.visible')
      .clear()
      .type('300{enter}');
    cy.wait(1000);

    cy.log('NEGATIVE TEST: Entering X-axis movement distance (300mm)...');
    cy.get('div.space-y-6 > div:nth-of-type(2) input')
      .should('be.visible')
      .clear()
      .type('300{enter}');
    cy.wait(1000);

    // Enter incorrect Point 2 value (300 instead of 424.26)
    cy.log('NEGATIVE TEST: Entering incorrect Point 2 Y measurement (300mm instead of 424.26mm)...');
    cy.get('div.space-y-6 > div:nth-of-type(3) input')
      .should('be.visible')
      .clear()
      .type('300');
    cy.wait(1000);
    cy.log('Incorrect Point 2 Y measurement entered: 300mm');


    // Click all confirm buttons
    cy.get('[testid="confirm 1-2"]')
      .should('be.visible')
      .click();
    cy.wait(500);

    cy.get('[testid="confirm 2-3"]')
      .should('be.visible')
      .click();
    cy.wait(500);

    cy.get('[testid="confirm 1-3"]')
      .should('be.visible')
      .click();
    cy.wait(500);

    // Click Next Step
    cy.get('button')
      .contains('Next Step')
      .should('be.visible')
      .click();
    cy.wait(1500);

    // Verify "Your machine needs adjustment" message
    cy.log('NEGATIVE TEST: Verifying adjustment needed message...');
    cy.contains('Your machine needs adjustment')
      .should('be.visible');
    cy.log('Machine needs adjustment message confirmed - Negative test passed!');

    cy.log(' ALL TESTS COMPLETED SUCCESSFULLY');

  });

});
describe('gSender Movement tuning test', () => {

  beforeEach(() => {
    cy.viewport(2844, 1450);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000
    });
  });

  it('Should complete movement tuning for x axis and y axis', () => {
    
    // ========== X-AXIS TESTING ==========
    
    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('✓ Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);
    cy.log('✓ Machine is in idle status');

    // Step 3: Unlock machine if needed
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 4: Navigate to Tools page
    cy.log('Step 4: Navigating to Tools page...');
    cy.goToTools();
    cy.wait(1000);
    cy.log('✓ Tools page opened');

    // Step 5: Click on Movement Tuning tool
    cy.log('Step 5: Opening Movement Tuning tool...');
    cy.get('a:nth-of-type(3) p')
      .contains('Ensure that each')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('✓ Movement Tuning tool opened');

    // Step 6: Select X-axis from dropdown
    cy.log('Step 6: Selecting X-axis from dropdown...');
    cy.get('div.css-1hwfws3')
      .should('be.visible')
      .click();
    cy.wait(500);
    
    cy.get('#react-select-2-option-0')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('✓ X-axis selected');

    // Step 7: Click "Start Movement Tuning" button
    cy.log('Step 7: Starting Movement Tuning wizard...');
    cy.get('button')
      .contains('Start Movement Tuning')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('✓ Movement Tuning wizard started');

    // Step 8: Mark First Location
    cy.log('Step 8: Marking first location...');
    cy.get('button')
      .contains('Mark First Location')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('✓ First location marked');

    // Step 9: Enter distance value
    cy.log('Step 9: Entering distance value: 100mm...');
    cy.get('input.text-robin-500[value="100"]')
      .first()
      .should('be.visible')
      .clear()
      .type('100');
    cy.wait(500);
    cy.log('✓ Distance value entered: 100mm');

    // Step 10: Click "Move X-axis" button
    cy.log('Step 10: Clicking Move X-axis button...');
    cy.get('button.bg-robin-500')
      .contains('Move X-axis')
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    cy.wait(2000);
    cy.log('✓ Move X-axis button clicked');

    // Step 11: Wait for machine to reach idle status after movement
    cy.log('Step 11: Waiting for machine to reach idle status...');
    cy.verifyMachineStatus('Idle', { timeout: 30000 });
    cy.wait(1000);
    cy.log('✓ Machine is idle after X-axis movement');

    // Step 12: Enter distance travelled (100mm)
    cy.log('Step 12: Entering distance travelled (100mm)...');
    cy.get('div.bg-blue-50 input')
      .should('be.visible')
      .clear()
      .type('100');
    cy.wait(500);
    cy.log('✓ Distance entered: 100mm');

    // Step 13: Click "Set Distance Travelled" button to confirm
    cy.log('Step 13: Confirming distance travelled...');
    cy.get('button')
      .contains('Set Distance Travelled')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('✓ Distance confirmed');

    // Step 14: Verify X-axis accuracy success message
    cy.log('Step 14: Verifying X-axis accuracy message...');
    cy.get('div.text-green-800.bg-green-100')
      .should('be.visible')
      .should('contain.text', 'Your')
      .should('contain.text', 'X')
      .should('contain.text', '-axis looks accurate, so you should be good to go!');
    cy.log('✓ X-axis accuracy message confirmed');
    cy.log('✓ Movement Tuning test for X-axis completed successfully');

    // Restart wizard for Y-axis testing
    cy.log('Restarting wizard for Y-axis testing...');
    cy.contains('button', 'Restart Wizard')
      .should('be.visible')
      .click();
    cy.wait(2000);

    // ========== Y-AXIS TESTING ==========

    // Step 6: Select Y-axis from dropdown
    cy.log('Step 6: Selecting Y-axis...');
    cy.get('.css-1hwfws3')
      .should('be.visible')
      .click();
    cy.wait(500);

    cy.get('[id^="react-select-"][id$="-option-1"]')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('✓ Y-axis selected');

    // Step 7: Click "Start Movement Tuning" button
    cy.log('Step 7: Starting Movement Tuning wizard...');
    cy.get('button')
      .contains('Start Movement Tuning')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('✓ Movement Tuning wizard started');

    // Step 8: Mark First Location
    cy.log('Step 8: Marking first location...');
    cy.get('button')
      .contains('Mark First Location')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('✓ First location marked');

    // Step 9: Enter distance value
    cy.log('Step 9: Entering distance value: 50mm...');
    cy.get('input.text-robin-500[value="100"]')
      .first()
      .should('be.visible')
      .clear()
      .type('50');
    cy.wait(500);
    cy.log('✓ Distance value entered: 50mm');

    // Step 10: Move Y-axis
    cy.log('Step 10: Moving Y-axis...');
    cy.contains('button', 'Move Y-axis')
      .should('be.visible')
      .click();
    cy.log('✓ Y-axis movement initiated');

    // Step 11: Monitor status transition from Jogging to Idle
    cy.log('Step 11: Monitoring machine status transition...');
    cy.wait(500);

    cy.window().then((win) => {
      cy.log('Waiting for Jogging status...');
      cy.verifyMachineStatus('Jogging', { timeout: 5000 }).then(() => {
        cy.log('✓ Machine is jogging');
        
        cy.log('Waiting for machine to return to Idle...');
        cy.verifyMachineStatus('Idle', { timeout: 30000 }).then(() => {
          cy.wait(1000);
          cy.log('✓ Machine status changed: Jogging → Idle');
        });
      });
    });

    // Step 12: Enter distance travelled (100mm)
    cy.log('Step 12: Entering distance travelled (100mm)...');
    cy.get('div.bg-blue-50 input')
      .should('be.visible')
      .clear()
      .type('100');
    cy.wait(500);
    cy.log('✓ Distance entered: 100mm');

    // Step 13: Click "Set Distance Travelled" button to confirm
    cy.log('Step 13: Confirming distance travelled...');
    cy.get('button')
      .contains('Set Distance Travelled')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('✓ Distance confirmed');

    // Step 14: Verify Y-axis inaccuracy message
    cy.log('Step 14: Verifying Y-axis inaccuracy message...');
    cy.contains('button', 'Update step/mm')
      .should('be.visible').click();
    cy.log('✓ Y-axis inaccuracy message confirmed');
    cy.log('✓ Movement Tuning test for Y-axis completed successfully');

  });

});
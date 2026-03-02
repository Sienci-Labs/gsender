describe('CNC Machine Tests Grbl', () => {

  beforeEach(() => {
    cy.viewport(2844, 1450);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000
    });
  });

  it('Test Case: Connect to CNC and verify go to location', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(($status) => {
        cy.log(`Machine status: "${$status.text().trim()}"`);
      });

    cy.wait(2000);

    // Step 3: Open Go To Location popup — selector confirmed from recording
cy.log('Step 3: Opening Go To Location popup...');
cy.get('div.min-h-10 > div:nth-of-type(1) > button', { timeout: 10000 })
  .filter(':visible')
  .first()
  .click({ force: true });
cy.wait(1500);
cy.log('"Go to Location" button clicked');

// Step 4: Wait for dialog then enter 0 in all inputs
cy.log('Step 4: Entering 0 in all axes...');
cy.get('[id^="radix-"]', { timeout: 10000 })
  .should('exist')
  .last()
  .within(() => {

    // X axis
    cy.get('div:nth-of-type(2) input')
      .filter(':visible')
      .clear({ force: true })
      .type('0', { force: true });
    cy.log('X coordinate: 0');

    // Y axis
    cy.get('div:nth-of-type(3) input')
      .filter(':visible')
      .clear({ force: true })
      .type('0', { force: true });
    cy.log('Y coordinate: 0');

   // Z axis — force value update with multiple triggers
cy.get('div:nth-of-type(4) input')
  .filter(':visible')
  .focus()
  .clear({ force: true })
  .type('{selectall}', { force: true })
  .type('0', { force: true })
  .trigger('input', { force: true })
  .trigger('change', { force: true })
  .blur();
cy.log('Z coordinate: 0');
    // Step 5: Click Go button
    cy.log('Step 5: Clicking Go button...');
    cy.contains('button', 'Go!').click({ force: true });
    cy.log('Go button clicked');
  });

    // Step 6: Close popup
    cy.log('Step 6: Closing popup...');
    cy.get('body').click(50, 50, { force: true });
    cy.wait(500);
    cy.log('Popup closed');

    // Step 7: Wait for machine to reach position
    cy.log('Step 7: Waiting for machine to reach position...');
    cy.wait(3000);

    // Step 8: Verify position is 0.00
    cy.log('Step 8: Verifying machine position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .should('have.length', 3)
      .then(($inputs) => {
        const xValue = $inputs.eq(0).val();
        const yValue = $inputs.eq(1).val();
        const zValue = $inputs.eq(2).val();

        cy.log(`Current position: X=${xValue}, Y=${yValue}, Z=${zValue}`);

        cy.wrap($inputs.eq(0)).should('have.value', '0.00');
        cy.wrap($inputs.eq(1)).should('have.value', '0.00');
        cy.wrap($inputs.eq(2)).should('have.value', '0.00');

        if (xValue === '0.00' && yValue === '0.00' && zValue === '0.00') {
          cy.log('TEST PASSED: Machine is at home position (0.00, 0.00, 0.00)');
        } else {
          throw new Error(`Expected (0.00, 0.00, 0.00) but got (${xValue}, ${yValue}, ${zValue})`);
        }
      });

    // Step 9: Test different axis values using custom command
    cy.log('Step 9: Testing different axis values...');

    cy.log('Testing positive values...');
    cy.goToLocation({ x: 5, y: 5, z: 5, waitTime: 5000 });
    cy.log('Positive values tested');

    cy.log('Testing negative values...');
    cy.goToLocation({ x: -5, y: -5, z: -5, waitTime: 5000 });
    cy.log('Negative values tested');

    cy.log('Testing float values...');
    cy.goToLocation({ x: 0.5, y: 2.5, z: -5.5, waitTime: 5000 });
    cy.log('Float values tested');

    // Return to home — fixed: pass as object not positional args
    cy.log('Returning to home position...');
    cy.goToLocation({ x: 0, y: 0, z: 0, waitTime: 5000 });
    cy.log('Returned to home position');

    // Step 10: Verify final position is 0.00
    cy.log('Step 10: Verifying final machine position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .should('have.length', 3)
      .then(($inputs) => {
        const xValue = $inputs.eq(0).val();
        const yValue = $inputs.eq(1).val();
        const zValue = $inputs.eq(2).val();

        cy.log(`Final position: X=${xValue}, Y=${yValue}, Z=${zValue}`);

        cy.wrap($inputs.eq(0)).should('have.value', '0.00');
        cy.wrap($inputs.eq(1)).should('have.value', '0.00');
        cy.wrap($inputs.eq(2)).should('have.value', '0.00');

        if (xValue === '0.00' && yValue === '0.00' && zValue === '0.00') {
          cy.log('TEST PASSED: Machine is at home position (0.00, 0.00, 0.00)');
        } else {
          throw new Error(`Expected (0.00, 0.00, 0.00) but got (${xValue}, ${yValue}, ${zValue})`);
        }
      });

    cy.log('ALL TESTS COMPLETED SUCCESSFULLY');
  });

});
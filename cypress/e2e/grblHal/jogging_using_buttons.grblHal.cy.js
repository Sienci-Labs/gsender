describe('Gsender testing jogging using buttons', () => {

 beforeEach(() => {
  cy.viewport(1920, 1080);
  // Use loadUI custom command with dynamic baseUrl
  cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
    maxRetries: 3,
    waitTime: 3000,
    timeout: 5000
  });
});


  it('Test Case: jogging using buttons', () => {
    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected');

    // Step 2: Wait for Idle status
    cy.log('Step 2: Waiting for Idle status...');
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(2000);
    cy.log(' Machine is Idle');

    // Step 3: Move to position (0, 0, 0)
    cy.log('Step 3: Moving to position (0, 0, 0)...');
    cy.goToLocation({ x: 0, y: 0, z: 0 });

    // Step 4: Check initial position
    cy.log('Step 4: Checking initial position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .then(($inputs) => {
        const xValue = $inputs.eq(0).val();
        const yValue = $inputs.eq(1).val();
        const zValue = $inputs.eq(2).val();
        cy.log(`Initial position: X=${xValue}, Y=${yValue}, Z=${zValue}`);
        
        if (xValue === '0.00' && yValue === '0.00' && zValue === '0.00') {
          cy.log(' Machine is at home position (0.00, 0.00, 0.00)');
        }
      });

    cy.wait(2000);

    // Step 5: Test Y+ jogging
    cy.log('Step 5: Testing Y+ jogging...');
    cy.get('path#yPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Y+ jog button clicked');

    // Step 6: Test Y- jogging
    cy.log('Step 6: Testing Y- jogging...');
    cy.get('path#yMinus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Y- jog button clicked');
  
    // Step 7: Test X+ jogging
    cy.log('Step 7: Testing X+ jogging...');
    cy.get('path#xPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log('X+ jog button clicked');

    // Step 8: Test X- jogging
    cy.log('Step 8: Testing X- jogging...');
    cy.get('path#xMinus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' X- jog button clicked');

    // Step 9: Test Z+ jogging
    cy.log('Step 9: Testing Z+ jogging...');
    cy.get('path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Z+ jog button clicked');

    // Step 10: Test Z- jogging
    cy.log('Step 10: Testing Z- jogging...');
    cy.get('path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Z- jog button clicked');

    // Step 11: Test X+Y+ jogging
    cy.log('Step 11: Testing X+Y+ jogging...');
    cy.get('path#xPlusYPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' X+Y+ jog button clicked');

    // Step 12: Test X+Y- jogging
    cy.log('Step 12: Testing X+Y- jogging...');
    cy.get('path#xPlusYMinus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' X+Y- jog button clicked');

    // Step 13: Test X-Y- jogging
    cy.log('Step 13: Testing X-Y- jogging...');
    cy.get('path#xMinusYMinus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' X-Y- jog button clicked');

    // Step 14: Test X-Y+ jogging
    cy.log('Step 14: Testing X-Y+ jogging...');
    cy.get('path#xMinusYPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' X-Y+ jog button clicked');

    // Step 15: Check final position
    cy.log('Step 15: Checking final position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .then(($inputs) => {
        const xValue = $inputs.eq(0).val();
        const yValue = $inputs.eq(1).val();
        const zValue = $inputs.eq(2).val();
        cy.log(`Final position: X=${xValue}, Y=${yValue}, Z=${zValue}`);
        
        if (xValue === '0.00' && yValue === '0.00' && zValue === '0.00') {
          cy.log(' Machine is back at home position (0.00, 0.00, 0.00) ');
        } else {
          cy.log(` Machine position after jogging: (${xValue}, ${yValue}, ${zValue})`);
        }
      });

    cy.log(' ALL JOGGING TESTS COMPLETED SUCCESSFULLY ');
  });

});
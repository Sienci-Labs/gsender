describe('Preset Movements by Updating Values Test', () => {

  // Ignore known hydration-related UI errors and undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
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

  it('Test Case 1: Precise Mode - Preset Movement by Updating Value', () => {
    
    cy.log('=== PRECISE MODE: Preset Movement Value Update Test ===');

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(7000);

    // Unlock machine if needed
    cy.unlockMachineIfNeeded();

    // Verify machine status is Idle
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    // Step 2: Reset all axes to zero
    cy.zeroAllAxes();

    // Step 2a: Verify all axes are at 0.00
    cy.verifyAxes(0, 0, 0);

    // Step 3: Switch to Precise mode
    cy.contains('button', 'Precise').click();
    cy.wait(500);

    // Step 4: Update XY preset value to 0.6
    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(1) input', '0.6');

    // Step 5: Click diagonal jog button (X+Y+)
    cy.get('#xPlusYPlus').click();
    cy.wait(2000);

    // Step 6: Verify X and Y axis positions updated to 0.6
    cy.verifyAxes(0.6, 0.6, 0);

    // Step 7: Update Z preset value to 0.2
    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(2) input', '0.2');

    // Step 8: Click Z+ jog button
    cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
    cy.wait(2000);

    // Step 9: Verify Z axis position updated to 0.2
    cy.verifyAxes(0.6, 0.6, 0.2);

    // Step 10: Update feed rate to 1500
    cy.forceInput('div.items-center > div > div:nth-of-type(3) input', '1500');

    // Step 11: Click diagonal jog button (X-Y-)
    cy.get('#xMinusYMinus').click();
    cy.wait(2000);

    // Step 12: Verify X and Y axes returned to 0
    cy.verifyAxes(0, 0, 0.2);

    // Step 13: Click Z- jog button
    cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
    cy.wait(2000);

    // Step 14: Verify Z axis returned to 0
    cy.verifyAxes(0, 0, 0);

    cy.log('=== TEST COMPLETED SUCCESSFULLY ===');
  });

  it('Test Case 2: Normal Mode - Preset Movement by Updating Value', () => {
    
    cy.log('=== NORMAL MODE: Preset Movement Value Update Test ===');

    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(7000);

    cy.unlockMachineIfNeeded();
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.zeroAllAxes();
    cy.verifyAxes(0, 0, 0);

    cy.contains('button', 'Normal').click();
    cy.wait(500);

    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(1) input', '10');
    cy.wait(500);

    cy.get('#xPlusYPlus').click();
    cy.wait(3000);

    cy.verifyAxes(10, 10, 0);

    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(2) input', '5');
    cy.wait(500);

    cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
    cy.wait(3000);

    cy.verifyAxes(10, 10, 5);

    cy.forceInput('div.items-center > div > div:nth-of-type(3) input', '4500');
    cy.wait(500);

    cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
    cy.wait(3000);

    cy.verifyAxes(10, 10, 0);

    cy.get('#xMinus').click();
    cy.wait(3000);

    cy.verifyAxes(0, 10, 0);

    cy.get('#yMinus').click();
    cy.wait(3000);

    cy.verifyAxes(0, 0, 0);

    cy.log('=== TEST COMPLETED SUCCESSFULLY ===');
  });

  it('Test Case 3: Rapid Mode - Preset Movement by Updating Value', () => {
    
    cy.log('=== RAPID MODE: Preset Movement Value Update Test ===');

    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(7000);

    cy.unlockMachineIfNeeded();
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.zeroAllAxes();
    cy.verifyAxes(0, 0, 0);

    cy.contains('button', 'Rapid').click();
    cy.wait(500);

    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(1) input', '25');
    cy.wait(500);

    cy.get('#xPlusYPlus').click();
    cy.wait(4000);

    cy.verifyAxes(25, 25, 0);

    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(2) input', '15');
    cy.wait(500);

    cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
    cy.wait(4000);

    cy.verifyAxes(25, 25, 15);

    cy.forceInput('div.items-center > div > div:nth-of-type(3) input', '10000');
    cy.wait(500);

    cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
    cy.wait(4000);

    cy.verifyAxes(25, 25, 0);

    cy.get('#yMinus').click();
    cy.wait(4000);

    cy.verifyAxes(25, 0, 0);

    cy.get('#xMinus').click();
    cy.wait(4000);

    cy.verifyAxes(0, 0, 0);

    cy.log('=== TEST COMPLETED SUCCESSFULLY ===');
  });

});
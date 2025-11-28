describe('Go to axis  Movements by Adding and  Values Test', () => {

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

  it('Test Case 1: Precise Mode - Adding and Subtracting Preset Values', () => {
    
    cy.log('=== PRECISE MODE: Adding and Subtracting Preset Values Test ===');

    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(7000);

    cy.unlockMachineIfNeeded();
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.log('Step 2: Zeroing all axes...');
    
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
      .contains(/^X/i).click();
    cy.wait(500);

    cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
      .contains(/^Y/i).click();
    cy.wait(500);

    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
      .contains(/^Z/i).click();
    cy.wait(500);

    cy.verifyAxes(0, 0, 0);

    cy.log('Step 3: Switching to Precise mode...');
    cy.contains('button', 'Precise').click();
    cy.wait(500);

    cy.log('Step 4: Incrementing XY preset value...');
    cy.get('div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(3) path').click();
    cy.wait(500);

    cy.log('Step 5: Moving X+Y+ with incremented value...');
    cy.get('#xPlusYPlus').click();
    cy.wait(2000);

    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .invoke('val')
      .then((xyValue) => {
        const expectedXY = parseFloat(xyValue);
        cy.log(`XY moved to: ${expectedXY}`);
        cy.verifyAxes(expectedXY, expectedXY, 0);

        cy.log('Step 7: Incrementing Z preset value...');
        cy.get('div.h-\\[75\\%\\] div:nth-of-type(2) > div > div:nth-of-type(3) svg').click();
        cy.wait(500);

        cy.log('Step 8: Moving Z+ with incremented value...');
        cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
        cy.wait(2000);

        cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
          .invoke('val')
          .then((zValue) => {
            const expectedZ = parseFloat(zValue);
            cy.log(`Z moved to: ${expectedZ}`);
            cy.verifyAxes(expectedXY, expectedXY, expectedZ);

            cy.log('Step 10: Incrementing feed rate...');
            cy.get('div:nth-of-type(3) > div > div:nth-of-type(3) path').click();
            cy.wait(500);

            cy.log('Step 11: Moving X- to return...');
            cy.get('#xMinus').click();
            cy.wait(2000);
            cy.verifyAxes(0, expectedXY, expectedZ);

            cy.log('Step 13: Moving Y- to return...');
            cy.get('#yMinus').click();
            cy.wait(2000);
            cy.verifyAxes(0, 0, expectedZ);

            cy.log('Step 15: Moving Z- to return...');
            cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
            cy.wait(2000);
            cy.verifyAxes(0, 0, 0);

            cy.log('Step 17: Testing decrement - clicking XY decrement button...');
            cy.get('div.h-\\[75\\%\\] div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(1) svg').click();
            cy.wait(500);

            cy.log('Step 18: Moving X+Y+ with decremented value...');
            cy.get('#xPlusYPlus').click();
            cy.wait(2000);

            cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
              .invoke('val')
              .then((newXYValue) => {
                const newXY = parseFloat(newXYValue);
                cy.log(`XY moved to: ${newXY} (after decrement)`);
                cy.verifyAxes(newXY, newXY, 0);

                cy.log('Step 20: Decrementing Z preset value...');
                cy.get('#app > div > div.h-full div.items-center > div > div:nth-of-type(2) > div > div:nth-of-type(1) svg').click();
                cy.wait(500);

                cy.log('Step 21: Moving Z+ with decremented value...');
                cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
                cy.wait(2000);

                cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
                  .invoke('val')
                  .then((newZValue) => {
                    const newZ = parseFloat(newZValue);
                    cy.log(`Z moved to: ${newZ} (after decrement)`);
                    cy.verifyAxes(newXY, newXY, newZ);

                    cy.log('Step 23: Decrementing feed rate...');
                    cy.get('div.items-center > div > div:nth-of-type(3) > div > div:nth-of-type(1) svg').click();
                    cy.wait(500);

                    cy.log('Step 24: Moving Y- to return...');
                    cy.get('#yMinus').click();
                    cy.wait(2000);
                    cy.verifyAxes(newXY, 0, newZ);

                    cy.log('Step 26: Moving X- to return...');
                    cy.get('#xMinus').click();
                    cy.wait(2000);
                    cy.verifyAxes(0, 0, newZ);

                    cy.log('Step 28: Moving Z- to return...');
                    cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
                    cy.wait(2000);
                    cy.verifyAxes(0, 0, 0);

                    cy.log('=== TEST COMPLETED SUCCESSFULLY ===');
                  });
              });
          });
      });
  });

  it('Test Case 2: Normal Mode - Adding and Subtracting Go to axis  Values', () => {
    
    cy.log('=== NORMAL MODE: Adding and Subtracting Preset Values Test ===');

    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(7000);

    cy.unlockMachineIfNeeded();
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.log('Step 2: Zeroing all axes...');
    
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
      .contains(/^X/i).click();
    cy.wait(500);

    cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
      .contains(/^Y/i).click();
    cy.wait(500);

    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
      .contains(/^Z/i).click();
    cy.wait(500);

    cy.verifyAxes(0, 0, 0);

    cy.log('Step 3: Switching to Normal mode...');
    cy.get('div.flex-shrink-0 button:nth-of-type(2)').contains(/^Normal$/i).click();
    cy.wait(500);

    cy.log('Step 4: Incrementing XY preset value...');
    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) div:nth-of-type(3) > button').click();
    cy.wait(500);

    cy.log('Step 5: Moving X+Y+ with incremented value...');
    cy.get('#xPlusYPlus').click();
    cy.wait(3000);

    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .invoke('val')
      .then((xyValue) => {
        const expectedXY = parseFloat(xyValue);
        cy.log(`XY moved to: ${expectedXY}`);
        cy.verifyAxes(expectedXY, expectedXY, 0);

        cy.log('Step 7: Incrementing Z preset value...');
        cy.get('div.h-\\[75\\%\\] div:nth-of-type(2) > div > div:nth-of-type(3) svg').click();
        cy.wait(500);

        cy.log('Step 8: Moving Z+ with incremented value...');
        cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
        cy.wait(3000);

        cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
          .invoke('val')
          .then((zValue) => {
            const expectedZ = parseFloat(zValue);
            cy.log(`Z moved to: ${expectedZ}`);
            cy.verifyAxes(expectedXY, expectedXY, expectedZ);

            cy.log('Step 10: Incrementing feed rate...');
            cy.get('div:nth-of-type(3) > div > div:nth-of-type(3) svg').click();
            cy.wait(500);

            cy.log('Step 11: Moving Y- to return...');
            cy.get('#yMinus').click();
            cy.wait(3000);
            cy.verifyAxes(expectedXY, 0, expectedZ);

            cy.log('Step 13: Moving X- to return...');
            cy.get('#xMinus').click();
            cy.wait(3000);
            cy.verifyAxes(0, 0, expectedZ);

            cy.log('Step 15: Moving Z- to return...');
            cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
            cy.wait(3000);
            cy.verifyAxes(0, 0, 0);

            cy.log('Step 17: Testing decrement - clicking XY decrement button...');
            cy.get('div.h-\\[75\\%\\] div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(1) path').click();
            cy.wait(500);

            cy.log('Step 18: Moving X+Y+ with decremented value...');
            cy.get('#xPlusYPlus').click();
            cy.wait(3000);

            cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
              .invoke('val')
              .then((newXYValue) => {
                const newXY = parseFloat(newXYValue);
                cy.log(`XY moved to: ${newXY} (after decrement)`);
                cy.verifyAxes(newXY, newXY, 0);

                cy.log('Step 20: Decrementing Z preset value...');
                cy.get('#app > div > div.h-full div.items-center > div > div:nth-of-type(2) > div > div:nth-of-type(1) path').click();
                cy.wait(500);

                cy.log('Step 21: Moving Z+ with decremented value...');
                cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
                cy.wait(3000);

                cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
                  .invoke('val')
                  .then((newZValue) => {
                    const newZ = parseFloat(newZValue);
                    cy.log(`Z moved to: ${newZ} (after decrement)`);
                    cy.verifyAxes(newXY, newXY, newZ);

                    cy.log('Step 23: Decrementing feed rate...');
                    cy.get('div.items-center > div > div:nth-of-type(3) > div > div:nth-of-type(1) svg').click();
                    cy.wait(500);

                    cy.log('Step 24: Moving Y- to return...');
                    cy.get('#yMinus').click();
                    cy.wait(3000);
                    cy.verifyAxes(newXY, 0, newZ);

                    cy.log('Step 26: Moving X- to return...');
                    cy.get('#xMinus').click();
                    cy.wait(3000);
                    cy.verifyAxes(0, 0, newZ);

                    cy.log('Step 28: Moving Z- to return...');
                    cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
                    cy.wait(3000);
                    cy.verifyAxes(0, 0, 0);

                    cy.log('=== TEST COMPLETED SUCCESSFULLY ===');
                  });
              });
          });
      });
  });

  it('Test Case 3: Rapid Mode - Adding and Subtracting Go to axis Values', () => {
    
    cy.log('=== RAPID MODE: Adding and Subtracting Preset Values Test ===');
        
    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(7000);

    cy.unlockMachineIfNeeded();
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.log('Step 2: Zeroing all axes...');
    
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
      .contains(/^X/i).click();
    cy.wait(500);

    cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
      .contains(/^Y/i).click();
    cy.wait(500);

    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
      .contains(/^Z/i).click();
    cy.wait(500);

    cy.verifyAxes(0, 0, 0);

    cy.log('Step 3: Switching to Rapid mode...');
    cy.contains('button', 'Rapid').click();
    cy.wait(500);

    cy.log('Step 4: Incrementing XY preset value...');
    cy.get('div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(3) svg').click();
    cy.wait(500);

    cy.log('Step 5: Moving X+Y+ with incremented value...');
    cy.get('#xPlusYPlus').click();
    cy.wait(4000);

    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .invoke('val')
      .then((xyValue) => {
        const expectedXY = parseFloat(xyValue);
        cy.log(`XY moved to: ${expectedXY}`);
        cy.verifyAxes(expectedXY, expectedXY, 0);

        cy.log('Step 7: Incrementing Z preset value...');
        cy.get('div.h-\\[75\\%\\] div:nth-of-type(2) > div > div:nth-of-type(3) svg').click();
        cy.wait(500);

        cy.log('Step 8: Moving Z+ with incremented value...');
        cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
        cy.wait(4000);

        cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
          .invoke('val')
          .then((zValue) => {
            const expectedZ = parseFloat(zValue);
            cy.log(`Z moved to: ${expectedZ}`);
            cy.verifyAxes(expectedXY, expectedXY, expectedZ);

            cy.log('Step 10: Incrementing feed rate...');
            cy.get('div:nth-of-type(3) > div > div:nth-of-type(3) svg').click();
            cy.wait(500);

            cy.log('Step 11: Moving Y- to return...');
            cy.get('#yMinus').click();
            cy.wait(4000);
            cy.verifyAxes(expectedXY, 0, expectedZ);

            cy.log('Step 13: Moving X- to return...');
            cy.get('#xMinus').click();
            cy.wait(4000);
            cy.verifyAxes(0, 0, expectedZ);

            cy.log('Step 15: Moving Z- to return...');
            cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
            cy.wait(4000);
            cy.verifyAxes(0, 0, 0);

            cy.log('Step 17: Testing decrement - clicking XY decrement button...');
            cy.get('div.h-\\[75\\%\\] div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(1) svg').click();
            cy.wait(500);

            cy.log('Step 18: Moving X+Y+ with decremented value...');
            cy.get('#xPlusYPlus').click();
            cy.wait(4000);

            cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
              .invoke('val')
              .then((newXYValue) => {
                const newXY = parseFloat(newXYValue);
                cy.log(`XY moved to: ${newXY} (after decrement)`);
                cy.verifyAxes(newXY, newXY, 0);

                cy.log('Step 20: Decrementing Z preset value...');
                cy.get('#app > div > div.h-full div.items-center > div > div:nth-of-type(2) > div > div:nth-of-type(1) svg').click();
                cy.wait(500);

                cy.log('Step 21: Moving Z+ with decremented value...');
                cy.get('div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)').click();
                cy.wait(4000);

                cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
                  .invoke('val')
                  .then((newZValue) => {
                    const newZ = parseFloat(newZValue);
                    cy.log(`Z moved to: ${newZ} (after decrement)`);
                    cy.verifyAxes(newXY, newXY, newZ);

                    cy.log('Step 23: Decrementing feed rate...');
                    cy.get('div.items-center > div > div:nth-of-type(3) > div > div:nth-of-type(1) svg').click();
                    cy.wait(500);

                    cy.log('Step 24: Moving Y- to return...');
                    cy.get('#yMinus').click();
                    cy.wait(4000);
                    cy.verifyAxes(newXY, 0, newZ);

                    cy.log('Step 26: Moving X- to return...');
                    cy.get('#xMinus').click();
                    cy.wait(4000);
                    cy.verifyAxes(0, 0, newZ);

                    cy.log('Step 28: Moving Z- to return...');
                    cy.get('div.flex-row > div.flex path:nth-of-type(2)').click();
                    cy.wait(4000);
                    cy.verifyAxes(0, 0, 0);

                    cy.log('=== RAPID MODE TEST COMPLETED SUCCESSFULLY ===');
                  });
              });
          });
      });
    });
});

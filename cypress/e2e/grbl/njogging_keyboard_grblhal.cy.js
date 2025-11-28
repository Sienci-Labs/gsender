describe('Keyboard Jog Test - Shift + Right Arrow', () => {

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
    cy.viewport(2327, 1186);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000);
  });

  it('Test Case: Verify and Use Keyboard Shortcut for Jog X+ (right)', () => {
    
    cy.log('=== KEYBOARD JOG TEST: Shift + Right Arrow ===');

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(7000);

    // Unlock machine if needed
    cy.unlockMachineIfNeeded();

    // Verify machine status is Idle
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    // Step 2: Zero all axes
    cy.log('Step 2: Zeroing all axes...');
    cy.zeroAllAxes();
    cy.verifyAxes(0, 0, 0);

    // Step 3: Switch to Normal mode (as shown in JSON)
    cy.log('Step 3: Switching to Normal mode...');
    cy.get('div.h-\\[75\\%\\] button.bg-blue-400').contains('Normal').click();
    cy.wait(500);

    // Step 4: Navigate to Tools page
    cy.log('Step 4: Navigating to Tools page...');
    cy.get('a:nth-of-type(3) path').click(); // Click Tools icon
    cy.wait(2000);

    // Step 5: Click on Keyboard Shortcuts
    cy.log('Step 5: Opening Keyboard Shortcuts settings...');
    cy.contains('Keyboard Shortcuts').parent().click();
    cy.wait(1000);

    // Step 6: Find Jog X+ (right) row and click to open edit dialog
    cy.log('Step 6: Finding Jog X+ (right) keyboard shortcut...');
    cy.contains('tr', 'Jog X+ (right)').within(() => {
      // Click on the edit button (SVG icon)
      cy.get('td:nth-of-type(2) > div > div:nth-of-type(2) > div:nth-of-type(2) svg').click();
    });
    cy.wait(1000);

    // Step 7: Verify the current shortcut
    cy.log('Step 7: Verifying current keyboard shortcut...');
    
    // Check if the shortcut is "shift + right"
    cy.get('body').then($body => {
      if ($body.find('h4.text-lg:contains("shift + right")').length > 0) {
        cy.log('✓ Correct shortcut found: shift + right');
        
        // Close the dialog by clicking Cancel
        cy.contains('button', 'Cancel').click();
        cy.wait(500);
        
        // Step 8: Navigate back to home/config page
        cy.log('Step 8: Navigating back to Carve page...');
        cy.get('#app > div > div.h-full > div.flex img').first().click(); // Click Carve icon
        cy.wait(2000);

        // Verify we're back on the main page
        cy.contains(/^Idle$/i, { timeout: 10000 }).should('be.visible');

        // Step 9: Get current X position before keyboard jog
        cy.log('Step 9: Getting current X position...');
        cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) input')
          .invoke('val')
          .then((initialX) => {
            const startX = parseFloat(initialX);
            cy.log(`Initial X position: ${startX}`);

            // Get the XY preset value to know expected movement
            cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
              .invoke('val')
              .then((xyPreset) => {
                const moveAmount = parseFloat(xyPreset);
                cy.log(`XY preset value: ${moveAmount}`);
                const expectedX = startX + moveAmount;

                // Step 10: Execute keyboard shortcut (Shift + Right Arrow)
                cy.log('Step 10: Executing keyboard shortcut: Shift + Right Arrow...');
                cy.get('body').type('{shift}{rightarrow}', { release: false });
                cy.wait(3000); // Wait for movement to complete

                // Step 11: Verify X position changed
                cy.log('Step 11: Verifying X position after keyboard jog...');
                cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) input')
                  .invoke('val')
                  .then((finalX) => {
                    const endX = parseFloat(finalX);
                    cy.log(`Final X position: ${endX}, Expected: ${expectedX}`);
                    
                    // Allow small tolerance for floating point comparison
                    expect(Math.abs(endX - expectedX)).to.be.lessThan(0.01);
                    cy.log('✓ X position updated correctly via keyboard shortcut!');
                  });

                // Step 12: Return X to zero using X- button
                cy.log('Step 12: Returning X to zero position...');
                cy.get('#xMinus').click();
                cy.wait(3000);
                
                cy.verifyAxes(0, 0, 0);
                cy.log('✓ Returned to zero position');
              });
          });

        cy.log('=== TEST COMPLETED SUCCESSFULLY ===');
        
      } else {
        // If different shortcut found
        cy.get('h4.text-lg').eq(1).invoke('text').then((shortcutText) => {
          cy.log(` Different shortcut found: ${shortcutText}`);
          cy.log(' Please update the shortcut to "shift + right" to pass this test');
          
          // Close the dialog
          cy.contains('button', 'Cancel').click();
          
          // Fail the test with a clear message
          throw new Error(`Expected shortcut "shift + right" but found "${shortcutText}". Please update the keyboard shortcut.`);
        });
      }
    });
  });

});
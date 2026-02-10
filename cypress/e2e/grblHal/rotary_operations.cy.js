describe('A-Axis Go To Location Tests', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Tests A-axis go to location functionality with positive and negative values', () => {

    // Step 1: Navigate to config
    cy.log('Step 1: Navigating to Config...');
    cy.goToConfig();

    // Step 2: Connect to CNC
    cy.log('Step 2: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 3: Verify CNC machine status is Idle
    cy.log('Step 3: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);
    cy.log('Machine is in idle status');

    // Step 4: Unlock machine if needed
    cy.log('Step 4: Unlocking machine if needed...');
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 5: Go to Config and enable rotary controls
    cy.log('Step 5: Going to Config and enabling Rotary controls...');
    cy.goToConfig();
    cy.log('Searching for rotary settings...');
    cy.searchInSettings('rotary');
    
    // Enable rotary axis toggle if not already enabled
    cy.log('Enabling Rotary controls toggle...');
    cy.contains('div', 'Rotary controls')
      .find('button[role="switch"]')
      .then($toggle => {
        if ($toggle.attr('aria-checked') === 'false') {
          cy.log('  Enabling Rotary controls');
          cy.wrap($toggle).click();
          cy.wait(300);
        } else {
          cy.log('Rotary controls already enabled');
        }
      });
    
    // Apply settings
    cy.log('Applying settings...');
    cy.applySettings();
    cy.wait(500);

    // Step 6: Navigate to Carve page
    cy.log('Step 6: Navigating to Carve page...');
    cy.goToCarve();
    cy.wait(2000);

    // Step 7: Open A-axis go to location dialog (first click on A-axis jog button)
    cy.log('Step 7: Opening A-axis Go To Location dialog...');
    cy.get('div.min-h-10 > div:nth-of-type(1)')
      .find('button')
      .first()
      .click();
    cy.wait(500);

    // Step 8: Test positive A-axis movement (10 degrees)
    cy.log('Step 8: Testing positive A-axis movement to 10 degrees...');
    
    // Verify the go to location dialog is visible
    cy.get('body > div:nth-of-type(2)').should('be.visible');
    
    // Clear and enter positive value
    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .should('be.visible')
      .clear()
      .type('10', { delay: 100 });
    
    cy.wait(500);
    
    // Click the "Go!" button to move to position
    cy.log('Clicking Go! button to move A-axis to 10 degrees...');
    cy.contains('button', 'Go!').click();
    cy.wait(2000);

    // Step 9: Verify A-axis position shows 10 (or close to it)
    cy.log('Step 9: Verifying A-axis position...');
    cy.get('[data-testid="wcs-input-A"]')
      .should('be.visible')
      .invoke('val')
      .then((value) => {
        const numValue = parseFloat(value);
        cy.log(`Current A-axis position: ${numValue}`);
        // Allow small tolerance for position verification
        expect(numValue).to.be.closeTo(10, 0.5);
      });

    cy.wait(1000);

    // Step 10: Open A-axis go to location dialog again
    cy.log('Step 10: Opening A-axis Go To Location dialog again...');
    cy.get('div.min-h-10 > div:nth-of-type(1)')
      .find('button')
      .first()
      .click();
    cy.wait(500);

    // Step 11: Test negative A-axis movement (-10 degrees)
    cy.log('Step 11: Testing negative A-axis movement to -10 degrees...');
    
    // Clear and enter negative value
    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .should('be.visible')
      .clear()
      .type('-10', { delay: 100 });
    
    cy.wait(500);
    
    // Click the "Go!" button to move to negative position
    cy.log('Clicking Go! button to move A-axis to -10 degrees...');
    cy.contains('button', 'Go!').click();
    cy.wait(2000);

    // Step 12: Verify A-axis position shows -10 (or close to it)
    cy.log('Step 12: Verifying negative A-axis position...');
    cy.get('[data-testid="wcs-input-A"]')
      .should('be.visible')
      .invoke('val')
      .then((value) => {
        const numValue = parseFloat(value);
        cy.log(`Current A-axis position: ${numValue}`);
        // Allow small tolerance for position verification
        expect(numValue).to.be.closeTo(-10, 0.5);
      });

    cy.wait(1000);

    // Step 13: Return to zero position
    cy.log('Step 13: Returning A-axis to zero position...');
    cy.get('div.min-h-10 > div:nth-of-type(1)')
      .find('button')
      .first()
      .click();
    cy.wait(500);

    cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
      .should('be.visible')
      .clear()
      .type('0', { delay: 100 });
    
    cy.wait(500);
    
    cy.contains('button', 'Go!').click();
    cy.wait(2000);

    // Step 14: Final verification at zero
    cy.log('Step 14: Verifying A-axis returned to zero...');
    cy.get('[data-testid="wcs-input-A"]')
      .should('be.visible')
      .invoke('val')
      .then((value) => {
        const numValue = parseFloat(value);
        cy.log(`Final A-axis position: ${numValue}`);
        expect(numValue).to.be.closeTo(0, 0.5);
      });

    cy.log('A-axis Go To Location test completed successfully!');
  });

  // Additional test case for edge values
  it('Tests A-axis go to location with various angles', () => {

    // Setup steps (similar to above)
    cy.log('Setting up test environment...');
    cy.goToConfig();
    cy.connectMachine();
    cy.wait(6000);
    cy.verifyMachineStatus('Idle');
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Enable rotary controls
    cy.goToConfig();
    cy.searchInSettings('rotary');
    cy.contains('div', 'Rotary controls')
      .find('button[role="switch"]')
      .then($toggle => {
        if ($toggle.attr('aria-checked') === 'false') {
          cy.wrap($toggle).click();
          cy.wait(300);
        }
      });
    cy.applySettings();
    cy.wait(500);

    cy.goToCarve();
    cy.wait(2000);

    // Test array of different angles
    const testAngles = [45, 90, 180, -45, -90, 0];

    testAngles.forEach((angle, index) => {
      cy.log(`Test ${index + 1}: Moving A-axis to ${angle} degrees`);

      // Open go to location dialog
      cy.get('div.min-h-10 > div:nth-of-type(1)')
        .find('button')
        .first()
        .click();
      cy.wait(500);

      // Enter angle value
      cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
        .should('be.visible')
        .clear()
        .type(angle.toString(), { delay: 100 });
      
      cy.wait(300);
      
      // Click Go! button
      cy.contains('button', 'Go!').click();
      cy.wait(2000);

      // Verify position
      cy.get('[data-testid="wcs-input-A"]')
        .invoke('val')
        .then((value) => {
          const numValue = parseFloat(value);
          cy.log(`Position verified: ${numValue} (expected: ${angle})`);
          expect(numValue).to.be.closeTo(angle, 0.5);
        });

      cy.wait(1000);
    });

    cy.log('Multiple angle test completed successfully!');
  });

  // Test case for decimal values
  it('Tests A-axis go to location with decimal values', () => {

    // Setup
    cy.goToConfig();
    cy.connectMachine();
    cy.wait(6000);
    cy.verifyMachineStatus('Idle');
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    cy.goToConfig();
    cy.searchInSettings('rotary');
    cy.contains('div', 'Rotary controls')
      .find('button[role="switch"]')
      .then($toggle => {
        if ($toggle.attr('aria-checked') === 'false') {
          cy.wrap($toggle).click();
          cy.wait(300);
        }
      });
    cy.applySettings();
    cy.wait(500);

    cy.goToCarve();
    cy.wait(2000);

    // Test decimal angle values
    const decimalAngles = [5.5, 12.75, -8.25, 0.5];

    decimalAngles.forEach((angle, index) => {
      cy.log(`Test ${index + 1}: Moving A-axis to ${angle} degrees (decimal)`);

      cy.get('div.min-h-10 > div:nth-of-type(1)')
        .find('button')
        .first()
        .click();
      cy.wait(500);

      cy.get('body > div:nth-of-type(2) div:nth-of-type(5) input')
        .should('be.visible')
        .clear()
        .type(angle.toString(), { delay: 100 });
      
      cy.wait(300);
      
      cy.contains('button', 'Go!').click();
      cy.wait(2000);

      cy.get('[data-testid="wcs-input-A"]')
        .invoke('val')
        .then((value) => {
          const numValue = parseFloat(value);
          cy.log(`Decimal position verified: ${numValue} (expected: ${angle})`);
          expect(numValue).to.be.closeTo(angle, 0.1);
        });

      cy.wait(1000);
    });

    cy.log('Decimal value test completed successfully!');
  });

});
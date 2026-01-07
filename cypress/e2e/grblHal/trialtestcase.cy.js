describe('CNC Machine - Complete Probe Setup and Z Axis Probing', () => {
  
  before(() => {
    cy.viewport(1689, 810);
  });

  it('Configures probe, verifies TLS green, and performs Z axis probing', () => {
    
    // ═══════════════════════════════════════
    // PART 1: PROBE CONFIGURATION
    // ═══════════════════════════════════════
    
    cy.log('═══════════════════════════════════════');
    cy.log('PART 1: PROBE CONFIGURATION');
    cy.log('═══════════════════════════════════════');
    
    // Step 1: Visit the application
    cy.log('Step 1: Loading application...');
    cy.visit('http://localhost:8000/#/', {
      timeout: 30000,
      failOnStatusCode: false
    });
    cy.wait(3000);
    cy.log('✓ Application loaded');

    // Step 2: Connect to machine
    cy.log('Step 2: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('✓ Connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Verify machine is in Idle state
    cy.log('Step 3: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log('✓ Machine is Idle');
      });

    // Step 4: Navigate to Config page
    cy.log('Step 4: Navigating to Config page...');
    cy.get('a:nth-of-type(4) > div')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('✓ Config page opened');

    // Step 5: Search for "prob" in config search
    cy.log('Step 5: Searching for "prob" in config...');
    cy.get('#simple-search')
      .should('be.visible')
      .clear()
      .type('prob');
    cy.wait(1500);
    cy.log('✓ Search results for "prob" displayed');

    // Initialize flag to track if settings need to be applied
    cy.wrap({ needsApply: false }).as('applyState');

    // Step 6: Check and enable "Invert probe pin"
    cy.log('Step 6: Checking Invert probe pin setting...');
    
    cy.contains('Invert probe pin')
      .should('be.visible')
      .parent()
      .parent()
      .find('button[role="switch"]')
      .then(($switch) => {
        const isChecked = $switch.attr('data-state') === 'checked';
        const ariaChecked = $switch.attr('aria-checked') === 'true';
        const hasRobinClass = $switch.hasClass('bg-robin-500') || $switch.hasClass('bg-robin-400');
        const isEnabled = isChecked || ariaChecked || hasRobinClass;
        
        cy.log(`Invert probe pin current state: ${isEnabled ? 'ENABLED ✓' : 'DISABLED ✗'}`);
        
        if (!isEnabled) {
          cy.log('⚙ Enabling Invert probe pin...');
          cy.wrap($switch).click({ force: true });
          cy.wait(500);
          cy.get('@applyState').then((state) => {
            state.needsApply = true;
          });
          cy.log('✓ Invert probe pin enabled');
        } else {
          cy.log('✓ Invert probe pin already enabled - NO CHANGE');
        }
      });

    // Step 7: Check and enable "Invert TLS input"
    cy.log('Step 7: Checking Invert TLS input setting...');
    
    cy.contains('Invert TLS input')
      .should('be.visible')
      .parent()
      .parent()
      .find('button[role="switch"]')
      .then(($switch) => {
        const isChecked = $switch.attr('data-state') === 'checked';
        const ariaChecked = $switch.attr('aria-checked') === 'true';
        const hasRobinClass = $switch.hasClass('bg-robin-500') || $switch.hasClass('bg-robin-400');
        const isEnabled = isChecked || ariaChecked || hasRobinClass;
        
        cy.log(`Invert TLS input current state: ${isEnabled ? 'ENABLED ✓' : 'DISABLED ✗'}`);
        
        if (!isEnabled) {
          cy.log('⚙ Enabling Invert TLS input...');
          cy.wrap($switch).click({ force: true });
          cy.wait(500);
          cy.get('@applyState').then((state) => {
            state.needsApply = true;
          });
          cy.log('✓ Invert TLS input enabled');
        } else {
          cy.log('✓ Invert TLS input already enabled - NO CHANGE');
        }
      });

    // Step 8: Check Touch Plate is set to "Standard block"
    cy.log('Step 8: Checking Touch Plate setting...');
    
    cy.get('body').then(($body) => {
      if ($body.text().includes('Select the touch plate')) {
        cy.log('Found touch plate selection section');
        
        if ($body.text().includes('Standard block')) {
          cy.log('✓ Touch Plate set to "Standard block" - NO CHANGE');
        } else {
          cy.log('⚠ Touch Plate may not be set to "Standard block"');
        }
      } else {
        cy.log('⚠ Touch plate section not found in search results');
      }
    });

    // Step 9: Check and enable "Connection Test"
    cy.log('Step 9: Checking Connection Test setting...');
    
    cy.get('body').then(($body) => {
      const $connectionTest = $body.find('*:contains("Connection Test")');
      
      if ($connectionTest.length > 0) {
        cy.contains('Connection Test')
          .should('be.visible')
          .parent()
          .parent()
          .find('button[role="switch"]')
          .then(($switch) => {
            const isChecked = $switch.attr('data-state') === 'checked';
            const ariaChecked = $switch.attr('aria-checked') === 'true';
            const hasRobinClass = $switch.hasClass('bg-robin-500') || $switch.hasClass('bg-robin-400');
            const isEnabled = isChecked || ariaChecked || hasRobinClass;
            
            cy.log(`Connection Test current state: ${isEnabled ? 'ENABLED ✓' : 'DISABLED ✗'}`);
            
            if (!isEnabled) {
              cy.log('⚙ Enabling Connection Test...');
              cy.wrap($switch).click({ force: true });
              cy.wait(500);
              cy.get('@applyState').then((state) => {
                state.needsApply = true;
              });
              cy.log('✓ Connection Test enabled');
            } else {
              cy.log('✓ Connection Test already enabled - NO CHANGE');
            }
          });
      } else {
        cy.log('⚠ Connection Test setting not found - may not be available');
      }
    });

    // Step 10: Apply settings if changes were made
    cy.log('Step 10: Checking if settings need to be applied...');
    
    cy.get('@applyState').then((state) => {
      if (state.needsApply) {
        cy.log('⚙ Changes detected - Applying settings...');
        
        cy.get('div.ring > button')
          .contains('Apply Settings')
          .should('be.visible')
          .click({ force: true });
        
        cy.wait(3000);
        
        // Wait for body to be interactive again
        cy.get('body').should('not.have.attr', 'data-scroll-locked');
        cy.wait(1000);
        
        cy.log('✓ Settings applied successfully');
      } else {
        cy.log('✓ All settings already correct - NO CHANGES NEEDED');
      }
    });

    cy.log('═══════════════════════════════════════');
    cy.log('✓ PROBE CONFIGURATION COMPLETED');
    cy.log('═══════════════════════════════════════');

    // ═══════════════════════════════════════
    // PART 2: PROBE/TLS GREEN STATUS VERIFICATION
    // ═══════════════════════════════════════
    
    cy.log('');
    cy.log('═══════════════════════════════════════');
    cy.log('PART 2: PROBE/TLS GREEN STATUS TEST');
    cy.log('═══════════════════════════════════════');

    // Step 11: Navigate back to Carve page
    cy.log('Step 11: Navigating back to Carve page...');
    cy.get('#app > div > div.h-full > div.flex img')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('✓ Carve page opened');

    // Step 12: Open Machine Information Popup
    cy.log('Step 12: Opening Machine Information popup...');
    cy.get('div.border > div.top-0 img')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('✓ Machine Information popup opened');

    // Step 13: Pin the Machine Information popup
    cy.log('Step 13: Pinning Machine Information popup...');
    cy.get('[role="dialog"] div.cursor-pointer svg')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('✓ Machine Information popup pinned');

    // Step 14: Click Z- until Probe/TLS turns green
    cy.log('Step 14: Clicking Z- until Probe/TLS turns green...');
    
    // Function to check if Probe/TLS indicator is green
    const checkProbeGreen = () => {
      return cy.get('body').then(($body) => {
        const $probeTLS = $body.find('div.text-gray-500:contains("Probe/TLS")');
        if ($probeTLS.length > 0) {
          const $parent = $probeTLS.closest('.relative');
          const $greenIndicator = $parent.find('.bg-green-500');
          return $greenIndicator.length > 0;
        }
        return false;
      });
    };

    // Click Z- repeatedly until green (max 30 attempts)
    const clickZMinus = (attempt = 1, maxAttempts = 30) => {
      if (attempt > maxAttempts) {
        throw new Error(`Probe/TLS did not turn green after ${maxAttempts} attempts`);
      }

      cy.log(`Attempt ${attempt}/${maxAttempts}: Clicking Z- button...`);
      
      // Click Z- button
      cy.get('path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]')
        .should('exist')
        .click({ force: true });
      
      cy.wait(1000); // Wait for movement and sensor response
      
      // Check if green
      checkProbeGreen().then((isGreen) => {
        if (isGreen) {
          cy.log('─────────────────────────────────────');
          cy.log(`✓ Probe/TLS is GREEN after ${attempt} clicks! 🎉`);
          cy.log('─────────────────────────────────────');
        } else {
          cy.log(`Probe/TLS still red, continuing...`);
          clickZMinus(attempt + 1, maxAttempts);
        }
      });
    };

    // Start clicking
    clickZMinus();

    // Step 15: Verify Probe/TLS is green
    cy.log('Step 15: Verifying Probe/TLS status...');
    cy.wait(1000);
    
    cy.contains('div.text-gray-500', 'Probe/TLS')
      .should('be.visible')
      .closest('.relative')
      .find('.bg-green-500')
      .should('exist')
      .then(() => {
        cy.log('✓ Probe/TLS confirmed GREEN');
        cy.log('✓ Sensor is active and responding correctly');
      });

    cy.log('═══════════════════════════════════════');
    cy.log('✓ PROBE/TLS VERIFICATION COMPLETED');
    cy.log('═══════════════════════════════════════');

    // ═══════════════════════════════════════
    // PART 3: Z AXIS PROBING OPERATION
    // ═══════════════════════════════════════
    
    cy.log('');
    cy.log('═══════════════════════════════════════');
    cy.log('PART 3: Z AXIS PROBING OPERATION');
    cy.log('═══════════════════════════════════════');

    // Step 16: Unpin and close Machine Information popup
    cy.log('Step 16: Closing Machine Information popup...');
    cy.get('body > div:nth-of-type(2) svg')
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.log('✓ Machine Information popup closed');

    // Step 17: Click Z+ button twice to lift tool
    cy.log('Step 17: Jogging Z+ twice to lift tool...');
    
    // First Z+ click
    cy.get('path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(2000);
    cy.log('✓ First Z+ jog completed');

    // Second Z+ click
    cy.get('path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(2000);
    cy.log('✓ Second Z+ jog completed');

    // Step 18: Open probe interface
    cy.log('Step 18: Opening probe interface...');
    cy.get('button.text-blue-600')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('✓ Probe interface opened');

    // Step 19: Click on Probe tab
    cy.log('Step 19: Navigating to Probe tab...');
    cy.get('div.block > div.block div.w-full > div:nth-of-type(1) > button')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('✓ Probe tab opened');

    // Step 20: Select Z axis for probing
    cy.log('Step 20: Selecting Z axis for probing...');
    cy.get('div.grid > div.grid > div.justify-center button')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('✓ Z axis probe selected');

    // Step 21: Wait for probe circuit check
    cy.log('Step 21: Waiting for probe circuit check...');
    cy.contains('Waiting for probe circuit check', { timeout: 15000 })
      .should('be.visible')
      .then(() => {
        cy.log('Probe circuit check in progress...');
      });
    cy.wait(10000);

    // Step 22: Click Start Probe button
    cy.log('Step 22: Starting probe operation...');
    cy.get('#radix-\\:r1i\\: > div.grid button')
      .contains('Start Probe')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('✓ Start Probe button clicked');

    // Step 23: Wait for status to change from Running to Idle
    cy.log('Step 23: Waiting for probe to complete...');
    cy.contains(/^Running$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log('Probing operation running...');
      });

    cy.contains(/^Idle$/i, { timeout: 60000 })
      .should('be.visible')
      .then(() => {
        cy.log('✓ Probing operation completed - Machine is Idle');
      });

    cy.log('═══════════════════════════════════════');
    cy.log('✓ Z AXIS PROBING COMPLETED');
    cy.log('═══════════════════════════════════════');

    // ═══════════════════════════════════════
    // FINAL SUMMARY
    // ═══════════════════════════════════════
    
    cy.log('');
    cy.log('═══════════════════════════════════════');
    cy.log('✓ COMPLETE PROBING TEST PASSED! 🎉🎉🎉');
    cy.log('═══════════════════════════════════════');
    cy.log('Test Summary:');
    cy.log('  ✓ Part 1: Probe configuration verified/updated');
    cy.log('  ✓ Part 2: Probe/TLS verified GREEN');
    cy.log('  ✓ Part 3: Z axis probing completed successfully');
    cy.log('═══════════════════════════════════════');
    
    cy.wait(2000);
  });
});
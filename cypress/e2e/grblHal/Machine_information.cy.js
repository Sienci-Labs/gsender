describe('Invert and Check Pins Test with Stepper Motor Lock/Unlock', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Checks machine information, verifies pin inversion, and tests stepper motor lock/unlock', () => {

    // Step 1: Connect to CNC machine
    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(6000);
    cy.unlockMachineIfNeeded();
    cy.wait(2000);
    cy.log('Connected to CNC');

    // Step 2: Verify machine status
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
    cy.log('Machine is Idle');

    // Step 3: Open and pin Machine Info
    cy.log('Step 3: Opening Machine Information popup...');
    cy.get('div.border > div.hidden img').should('be.visible').click();
    cy.wait(2000);
    
    cy.log('Step 4: Pinning popup...');
    cy.get('body > div:nth-of-type(2) svg').first().click({ force: true });
    cy.wait(1000);
    cy.log('Machine Info popup pinned');

    // Step 5: Navigate to Configuration
    cy.log('Step 5: Navigating to Configuration page...');
    cy.goToConfig();
    cy.wait(3000);
    cy.log('Configuration page opened');

    // Step 6: Search for "invert"
    cy.log('Step 6: Searching for "invert" settings...');
    cy.get('#simple-search')
      .should('be.visible')
      .clear()
      .type('invert');
    cy.wait(1500);
    cy.log('Search results displayed for "invert"');

    // Helper function to disable axis if enabled (toggle off if on)
    const disableAxisIfEnabled = (axisId, axisName) => {
      cy.log(`Step: Checking ${axisName} axis invert limit pin...`);
      cy.get(`#${axisId}`)
        .scrollIntoView()
        .should('exist')
        .then(($switch) => {
          const isEnabled = $switch.attr('data-state') === 'checked' || 
                           $switch.attr('aria-checked') === 'true';
          
          if (isEnabled) {
            cy.log(`${axisName} axis is ENABLED - Disabling...`);
            cy.wrap($switch).click({ force: true });
            cy.wait(500);
            cy.log(`${axisName} axis toggled to DISABLED `);
          } else {
            cy.log(`${axisName} axis already DISABLED  - Skipping toggle`);
          }
        });
    };

    // Helper function to enable axis if disabled (toggle on if off)
    const enableAxisIfDisabled = (axisId, axisName) => {
      cy.log(`Step: Checking ${axisName} axis invert limit pin...`);
      cy.get(`#${axisId}`)
        .scrollIntoView()
        .should('exist')
        .then(($switch) => {
          const isEnabled = $switch.attr('data-state') === 'checked' || 
                           $switch.attr('aria-checked') === 'true';
          
          if (!isEnabled) {
            cy.log(`${axisName} axis is DISABLED - Enabling...`);
            cy.wrap($switch).click({ force: true });
            cy.wait(500);
            cy.log(`${axisName} axis toggled to ENABLED `);
          } else {
            cy.log(`${axisName} axis already ENABLED - Skipping toggle`);
          }
        });
    };

    // Disable X axis invert limit pin if enabled
    disableAxisIfEnabled('\\$5-0-key', 'X');

    // Disable Y axis invert limit pin if enabled
    disableAxisIfEnabled('\\$5-1-key', 'Y');

    // Disable Z axis invert limit pin if enabled
    disableAxisIfEnabled('\\$5-2-key', 'Z');

    // Disable A axis invert limit pin if enabled
    disableAxisIfEnabled('\\$5-3-key', 'A');

    // Apply settings
    cy.log('Step 7: Applying settings...');
    cy.contains('button', 'Apply Settings')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Settings applied');

    // Helper function to check if a specific limit is green
    const checkLimitGreen = (limitName) => {
      return cy.get('body').then(($body) => {
        const $limit = $body.find(`div.text-gray-500:contains("${limitName}")`);
        if ($limit.length > 0) {
          return $limit.closest('.relative').find('.bg-green-500').length > 0;
        }
        return false;
      });
    };

    // Check all limits are green
    cy.log('Verifying all limit pins turned green...');

    checkLimitGreen('X limit').then((isGreen) => {
      expect(isGreen, 'X limit should be green').to.be.true;
    });

    checkLimitGreen('Y limit').then((isGreen) => {
      expect(isGreen, 'Y limit should be green').to.be.true;
    });

    checkLimitGreen('Z limit').then((isGreen) => {
      expect(isGreen, 'Z limit should be green').to.be.true;
    });

    checkLimitGreen('A limit').then((isGreen) => {
      expect(isGreen, 'A limit should be green').to.be.true;
    });

    cy.log('All limit pins verified as green');

    // ===== RE-ENABLE ALL AXES =====
    cy.log('Step 8: Re-enabling all axis invert limit pins...');

    // Enable X axis invert limit pin if disabled
    enableAxisIfDisabled('\\$5-0-key', 'X');

    // Enable Y axis invert limit pin if disabled
    enableAxisIfDisabled('\\$5-1-key', 'Y');

    // Enable Z axis invert limit pin if disabled
    enableAxisIfDisabled('\\$5-2-key', 'Z');

    // Enable A axis invert limit pin if disabled
    enableAxisIfDisabled('\\$5-3-key', 'A');

    // Apply settings again
    cy.log('Step 9: Applying settings after re-enabling axes...');
    cy.contains('button', 'Apply Settings')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Settings applied - All axes re-enabled');

    // ===== STEPPER MOTOR LOCK/UNLOCK TEST =====
    cy.log('Step 10: Testing Stepper Motor Lock/Unlock...');
    
    // Navigate back to machine info popup
    cy.log('Opening Machine Info popup...');
    cy.get('div.border > div.hidden img').should('be.visible').click();
    cy.wait(1500);

    // Get the stepper motor toggle button
    cy.get('body > div:nth-of-type(2) button[role="switch"]')
      .should('be.visible')
      .as('stepperToggle');

    // Test Lock (Enable stepper motor)
    cy.log('Step 10a: Locking Stepper Motors...');
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' || 
                       $toggle.attr('aria-checked') === 'true';
      
      if (!isLocked) {
        cy.log('Stepper motors currently UNLOCKED - Locking now...');
        cy.get('@stepperToggle').click({ force: true });
        cy.wait(1000);
      } else {
        cy.log('Stepper motors already LOCKED - Skipping lock');
      }
    });

    // Verify motors are locked
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' || 
                       $toggle.attr('aria-checked') === 'true';
      expect(isLocked, 'Stepper motors should be LOCKED').to.be.true;
    });
    cy.log('Stepper motors LOCKED ');
    cy.wait(2000);

    // Test Unlock (Disable stepper motor)
    cy.log('Step 10b: Unlocking Stepper Motors...');
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' || 
                       $toggle.attr('aria-checked') === 'true';
      
      if (isLocked) {
        cy.log('Stepper motors currently LOCKED - Unlocking now...');
        cy.get('@stepperToggle').click({ force: true });
        cy.wait(1000);
      } else {
        cy.log('Stepper motors already UNLOCKED - Skipping unlock');
      }
    });

    // Verify motors are unlocked
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' || 
                       $toggle.attr('aria-checked') === 'true';
      expect(isLocked, 'Stepper motors should be UNLOCKED').to.be.false;
    });
    cy.log('Stepper motors UNLOCKED ');
    cy.wait(1000);

    // Final verification: Ensure motor is NOT locked at the end
    cy.log('Step 11: Final verification - Ensuring stepper motor is unlocked...');
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' || 
                       $toggle.attr('aria-checked') === 'true';
      
      expect(isLocked, 'Stepper motor should be UNLOCKED at test end').to.be.false;
      cy.log('Final state confirmed: Stepper motor is UNLOCKED');
    });

    cy.log('Test completed successfully - All checks passed ');

  });
});
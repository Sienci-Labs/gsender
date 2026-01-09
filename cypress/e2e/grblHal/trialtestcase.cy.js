describe('CNC Machine - XY Axis Probing', () => {
  
  before(() => {
    cy.viewport(2844, 1450);
  });

  it('Configures probe and performs XY axis probing', () => {
    
    // ═══════════════════════════════════════
    // PART 1: PROBE CONFIGURATION
    // ═══════════════════════════════════════
    
    cy.log('═══════════════════════════════════════');
    cy.log('PART 1: PROBE CONFIGURATION');
    cy.log('═══════════════════════════════════════');
    
    // Step 1: Load application and connect
    cy.log('Step 1: Loading application...');
    cy.loadUI('http://localhost:8000/#/');
    cy.log('✓ Application loaded');

    cy.log('Step 2: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(6000);
    cy.unlockMachineIfNeeded();
    cy.wait(2000);
    cy.log('✓ Connected to CNC');

    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('✓ Machine is Idle');

    // Step 2: Configure probe settings
    cy.log('Step 3: Navigating to Config page...');
    cy.get('a:nth-of-type(4) > div').should('be.visible').click();
    cy.wait(2000);

    cy.log('Step 4: Searching for "prob" in config...');
    cy.get('#simple-search').should('be.visible').clear().type('prob');
    cy.wait(1500);

    cy.wrap({ needsApply: false }).as('applyState');

    // Enable probe settings
    const enableSetting = (settingName) => {
      cy.contains(settingName)
        .should('be.visible')
        .parent()
        .parent()
        .find('button[role="switch"]')
        .then(($switch) => {
          const isEnabled = $switch.attr('data-state') === 'checked' || 
                          $switch.attr('aria-checked') === 'true' || 
                          $switch.hasClass('bg-robin-500');
          
          cy.log(`${settingName}: ${isEnabled ? 'ENABLED ✓' : 'DISABLED ✗'}`);
          
          if (!isEnabled) {
            cy.wrap($switch).click({ force: true });
            cy.wait(500);
            cy.get('@applyState').then((state) => { state.needsApply = true; });
            cy.log(`✓ ${settingName} enabled`);
          }
        });
    };

    enableSetting('Invert probe pin');
    enableSetting('Invert TLS input');

    // Apply settings if needed
    cy.get('@applyState').then((state) => {
      if (state.needsApply) {
        cy.log('⚙ Applying settings...');
        cy.get('div.ring > button').contains('Apply Settings').click({ force: true });
        cy.wait(3000);
        cy.get('body').should('not.have.attr', 'data-scroll-locked');
        cy.wait(1000);
        cy.log('✓ Settings applied');
      } else {
        cy.log('✓ All settings correct');
      }
    });

    cy.log('✓ PROBE CONFIGURATION COMPLETED');

    // Navigate back to Carve
    cy.get('#app > div > div.h-full > div.flex img').should('be.visible').click();
    cy.wait(2000);
    cy.log('✓ Carve page opened');


    // ═══════════════════════════════════════
    // PART 2: POSITION SETUP FOR XY PROBING
    // ═══════════════════════════════════════

    cy.log('═══════════════════════════════════════');
    cy.log('PART 2: POSITION SETUP FOR XY PROBING');
    cy.log('═══════════════════════════════════════');

    // Open Machine Information
    cy.log('Step 5: Opening Machine Information popup...');
    cy.get('div.border > div.top-0 img').should('be.visible').click();
    cy.wait(2000);
    
    cy.log('Step 6: Pinning popup...');
    cy.get('body > div:nth-of-type(2) svg').first().click({ force: true });
    cy.wait(1000);
    cy.log('✓ Machine Information pinned');

    // Jog Z- until TLS green
    cy.log('Step 7: Jogging Z- until Probe/TLS turns green...');
    
    const checkProbeGreen = () => {
      return cy.get('body').then(($body) => {
        const $probeTLS = $body.find('div.text-gray-500:contains("Probe/TLS")');
        if ($probeTLS.length > 0) {
          return $probeTLS.closest('.relative').find('.bg-green-500').length > 0;
        }
        return false;
      });
    };

    const clickZMinus = (attempt = 1, maxAttempts = 30) => {
      if (attempt > maxAttempts) {
        throw new Error(`Probe/TLS did not turn green after ${maxAttempts} attempts`);
      }
      
      cy.log(`Attempt ${attempt}/${maxAttempts}: Clicking Z-...`);
      cy.get('div.flex-row > div.flex path:nth-of-type(2)').should('exist').click({ force: true });
      cy.wait(1000);
      
      checkProbeGreen().then((isGreen) => {
        if (isGreen) {
          cy.log(`✓ Probe/TLS GREEN after ${attempt} clicks!`);
        } else {
          cy.log(`Probe/TLS still red, continuing...`);
          clickZMinus(attempt + 1, maxAttempts);
        }
      });
    };

    clickZMinus();

    // Verify TLS is green
    cy.wait(1000);
    cy.contains('div.text-gray-500', 'Probe/TLS')
      .should('be.visible')
      .closest('.relative')
      .find('.bg-green-500')
      .should('exist');
    cy.log('✓ Probe/TLS confirmed GREEN');

    // Set Z jog distance to 5 and move Z+ once
    // Click Z0 and go to Z=5
cy.log('Step 8: Clicking Z0 button...');
cy.contains('button', 'Z0').should('be.visible').click();
cy.wait(1000);
cy.log('Z0 button clicked');

cy.log('Step 9: Moving to Z=5 position...');
cy.goToLocation({ z: 5 });
cy.wait(2000);
cy.log('Moved to Z=5');

    // Set XY jog distance to 14 and move X- once
    cy.log('Step 10: Setting XY jog distance to 14...');
    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .should('be.visible')
      .clear()
      .type('14');
    cy.wait(500);
    cy.log(' XY jog distance set to 14');

    cy.log('Step 11: Jogging X- one time...');
    cy.jogXMinusTimes(1);
    cy.log(' X- jog completed');

    // Set Z jog distance to 20 and move Z- once
    cy.log('Step 12: Setting Z jog distance to 20...');
    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
      .should('be.visible')
      .clear()
      .type('20');
    cy.wait(500);
    cy.log('Z jog distance set to 20');

    cy.log('Step 13: Jogging Z- one time...');
    cy.jogZMinusTimes(1);
    cy.log('Z- jog completed');

    // Set Y jog distance to 10 and move Y- once
    cy.log('Step 14: Setting Y jog distance to 10...');
    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .should('be.visible')
      .clear()
      .type('10');
    cy.wait(500);
    cy.log(' Y jog distance set to 10');

    cy.log('Step 15: Jogging Y- one time...');
    cy.jogYMinusTimes(1);
    cy.log('Y- jog completed');

    cy.log('POSITION SETUP COMPLETED');


    // ═══════════════════════════════════════
    // PART 3: XY AXIS PROBING
    // ═══════════════════════════════════════

    cy.log('═══════════════════════════════════════');
    cy.log('PART 3: XY AXIS PROBING OPERATION');
    cy.log('═══════════════════════════════════════');

    // Open probe dialog
    cy.log('Step 16: Opening probe dialog...');
    cy.get('div.grid > div.grid > div.justify-center button').should('be.visible').click();
    cy.wait(2000);
    cy.log(' Probe dialog opened');

    // Close probe dialog
    cy.log('Step 17: Closing probe dialog...');
    cy.get('#radix-\\:r1i\\: svg').should('be.visible').click();
    cy.wait(1500);
    cy.log('✓ Probe dialog closed');

    // Click XY probe button
    cy.log('Step 18: Opening XY probe interface...');
    cy.get('div.block > div.block div:nth-of-type(3) > button').should('be.visible').click();
    cy.wait(1500);
    cy.log('XY probe interface opened');

    // Open probe dialog again and start probing
    cy.log('Step 19: Opening probe dialog for XY probing...');
    cy.get('div.grid > div.grid > div.justify-center button').should('be.visible').click();
    cy.wait(2000);

    cy.log('Step 20: Starting XY probe...');
    cy.get('#radix-\\:r1i\\: > div.grid button').contains('Start Probe').click();
    cy.wait(2000);

    cy.log('Step 21: Waiting for XY probe completion...');
    cy.contains(/^Running$/i, { timeout: 30000 }).should('be.visible');
    cy.log(' XY probing running...');
    
    cy.contains(/^Idle$/i, { timeout: 90000 }).should('be.visible');
    cy.log(' XY probing completed');

    cy.log(' XY AXIS PROBING COMPLETED');


    // ═══════════════════════════════════════
    // FINAL SUMMARY
    // ═══════════════════════════════════════

    cy.log(' COMPLETE XY PROBING TEST PASSED! ');
    cy.log('Test Summary:');
    cy.log('   Part 1: Probe config verified');
    cy.log('   Part 2: Machine positioned correctly');
    cy.log('   Part 3: XY axis probing completed');
    cy.log('Machine returned to Idle after probing');

    cy.wait(2000);
  });
});
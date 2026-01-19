describe('CNC Machine - Complete Z and XYZ Axis Probing', () => {
 beforeEach(() => {
  cy.viewport(1920, 1080);
  // Use loadUI custom command with dynamic baseUrl
  cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
    maxRetries: 3,
    waitTime: 3000,
    timeout: 5000
  });
});
  it('Configures probe once, performs Z axis probing, then XYZ axis probing', () => {
    
    // ═══════════════════════════════════════
    // PART 1: PROBE CONFIGURATION (ONCE)
    // ═══════════════════════════════════════
    
    cy.log('═══════════════════════════════════════');
    cy.log('PART 1: PROBE CONFIGURATION');

    // Step 1: Visit and connect
  cy.log('Step 1: Loading application...');
cy.loadUI('http://localhost:8000/#/');
cy.log('Application loaded');

    cy.log('Step 2: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(6000);
    cy.unlockMachineIfNeeded();
    cy.wait(2000);
    cy.log(' Connected to CNC');

    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('Machine is Idle');

    // Step 2: Configure probe settings
    cy.log('Step 3: Navigating to Config page...');
    cy.get('a:nth-of-type(4) > div').should('be.visible').click();
    cy.wait(2000);

    cy.log('Step 4: Searching for "prob" in config...');
    cy.get('#simple-search').should('be.visible').clear().type('prob');
    cy.wait(1500);

    cy.wrap({ needsApply: false }).as('applyState');

    // Check and enable settings
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
            cy.log(` ${settingName} enabled`);
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
        cy.log('Settings applied');
      } else {
        cy.log(' All settings correct');
      }
    });

    cy.log(' PROBE CONFIGURATION COMPLETED');

    // Navigate back to Carve
    cy.get('#app > div > div.h-full > div.flex img').should('be.visible').click();
    cy.wait(2000);
    cy.log('Carve page opened');


    // PART 2: Z AXIS PROBING

    

    cy.log('PART 2: Z AXIS PROBING OPERATION');


    // Open and close Z probe dialog
    cy.log('Step 5: Opening Z probe dialog...');
    cy.get('div.grid > div.grid > div.justify-center button').should('be.visible').click();
    cy.wait(2000);
    
    cy.log('Step 6: Closing probe dialog...');
    cy.get('#radix-\\:r1i\\: svg').should('be.visible').click();
    cy.wait(1500);

    // Open and pin Machine Info
    cy.log('Step 7: Opening Machine Information popup...');
    cy.get('div.border > div.top-0 img').should('be.visible').click();
    cy.wait(2000);
    
    cy.log('Step 8: Pinning popup...');
    cy.get('body > div:nth-of-type(2) svg').first().click({ force: true });
    cy.wait(1000);

    // Jog Z- until TLS green
    cy.log('Step 9: Jogging Z- until Probe/TLS turns green...');
    
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
          cy.log(`Probe/TLS GREEN after ${attempt} clicks!`);
        } else {
          cy.log(`Probe/TLS still red, continuing...`);
          clickZMinus(attempt + 1, maxAttempts);
        }
      });
    };

    clickZMinus();

    // Verify TLS green
    cy.wait(1000);
    cy.contains('div.text-gray-500', 'Probe/TLS')
      .should('be.visible')
      .closest('.relative')
      .find('.bg-green-500')
      .should('exist');
    cy.log('Probe/TLS confirmed GREEN');

    // Open, close Z probe again
    cy.log('Step 10: Opening Z probe again...');
    cy.get('div.grid > div.grid > div.justify-center button').click();
    cy.wait(2000);
    
    cy.log('Step 11: Closing dialog...');
    cy.get('#radix-\\:r1i\\: svg').click();
    cy.wait(1500);

    // Jog Z+ three times
   cy.jogZPlusTimes(3);

    // Record initial Z0
    cy.log('Step 13: Recording initial Z0...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) input')
      .invoke('val')
      .then((value) => {
        const initialZ0 = parseFloat(value);
        cy.log(` Initial Z0: ${initialZ0}`);
        cy.wrap(initialZ0).as('initialZ0');
      });

    // Start Z probing
    cy.log('Step 14: Opening Z probe for probing...');
    cy.get('div.grid > div.grid > div.justify-center button').click();
    cy.wait(2000);

    cy.log('Step 15: Starting Z probe...');
    cy.get('#radix-\\:r1i\\: > div.grid button').contains('Start Probe').click();
    cy.wait(2000);

    cy.log('Step 16: Waiting for Z probe completion...');
    cy.contains(/^Running$/i, { timeout: 30000 }).should('be.visible');
    cy.log('Z probing running...');
    
    cy.contains(/^Idle$/i, { timeout: 60000 }).should('be.visible');
    cy.log('Z probing completed');

    // Verify Z0 changed
    cy.log('Step 17: Verifying Z0 changed...');
    cy.wait(2000);
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) input')
      .invoke('val')
      .then((value) => {
        const finalZ0 = parseFloat(value);
        cy.get('@initialZ0').then((initial) => {
          const difference = Math.abs(finalZ0 - initial);
          cy.log(`   Initial Z0: ${initial}`);
          cy.log(`   Final Z0: ${finalZ0}`);
          cy.log(`   Difference: ${difference.toFixed(4)}`);
   
          
          expect(finalZ0).to.not.equal(initial);
          if (difference > 0.001) {
            cy.log(`Z0 changed by ${difference.toFixed(4)}`);
          } else {
            throw new Error(`Z0 did not change. Initial: ${initial}, Final: ${finalZ0}`);
          }
        });
      });

    cy.log(' Z AXIS PROBING COMPLETED');


  
    // PART 3: XYZ AXIS PROBING


    cy.log('PART 3: XYZ AXIS PROBING OPERATION');
  

    // Open probe → XYZ tab
    cy.log('Step 18: Opening probe interface...');
    cy.get('button.text-blue-600').should('be.visible').click();
    cy.wait(1500);

    cy.log('Step 19: Clicking XYZ tab...');
    cy.contains('button', 'XYZ').should('be.visible').click();
    cy.wait(1000);

    // Click Z probe → Close
    cy.log('Step 20: Clicking Z probe button...');
    cy.get('div.grid > div.grid > div.justify-center button').click();
    cy.wait(2000);

    cy.log('Step 21: Closing dialog...');
    cy.get('#radix-\\:r1i\\: svg').click();
    cy.wait(1500);

    // Jog Z+ three times
    cy.log('Step 22: Jogging Z+ three times...');
   cy.jogZPlusTimes(3);

    // Open probe → XYZ → Z probe → Start
    cy.log('Step 23: Opening probe interface again...');
    cy.get('button.text-blue-600').click();
    cy.wait(1500);

    cy.log('Step 24: Clicking XYZ tab again...');
    cy.contains('button', 'XYZ').click();
    cy.wait(1000);

    cy.log('Step 25: Clicking Z probe button...');
    cy.get('div.grid > div.grid > div.justify-center button').click();
    cy.wait(2000);

    cy.log('Step 26: Starting XYZ probe...');
    cy.get('#radix-\\:r1i\\: > div.grid button').contains('Start Probe').click();
    cy.wait(2000);

    cy.log('Step 27: Waiting for XYZ probe completion...');
    cy.contains(/^Running$/i, { timeout: 30000 }).should('be.visible');
    cy.log(' XYZ probing running...');
    
    cy.contains(/^Idle$/i, { timeout: 90000 }).should('be.visible');
    cy.log('XYZ probing completed');

    cy.log('XYZ AXIS PROBING COMPLETED');


    // FINAL SUMMARY

    
  
    cy.log(' COMPLETE Z & XYZ PROBING TEST PASSED! ');
  
    cy.log('Test Summary:');
    cy.log('  Part 1: Probe config verified (once)');
    cy.log('  Part 2: Z axis probing completed + Z0 verified');
    cy.log('  Part 3: XYZ axis probing completed');
    cy.log(' Machine returned to Idle after both probings');

    
    cy.wait(2000);
  });
});
describe('Invert and Check Pins Test with Stepper Motor Lock/Unlock', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI();
  });

  it('Checks machine information, verifies pin inversion, and tests stepper motor lock/unlock', () => {

    const CHECKMARK_PATH = 'M173.898 439.404';
    const CROSS_PATH     = 'M242.72 256l100.07';

    // Helper: get limit pin state from pinned popup
    const checkLimitState = (limitName) => {
      return cy.get('body > div:nth-of-type(2)').then(($popup) => {
        const $rows = $popup.find('div').filter((i, el) => {
          return el.textContent.trim() === limitName;
        });

        if ($rows.length === 0) {
          cy.log(`WARNING: Could not find label "${limitName}" in popup`);
          return 'not-found';
        }

        const $row   = $rows.first().parent();
        const $paths = $row.find('svg path');

        if ($paths.length === 0) {
          cy.log(`WARNING: No SVG icon found near "${limitName}"`);
          return 'no-icon';
        }

        const pathD = $paths.first().attr('d') || '';
        if (pathD.includes(CHECKMARK_PATH)) return 'green';
        if (pathD.includes(CROSS_PATH))     return 'red';

        cy.log(`Unknown path near "${limitName}": ${pathD.substring(0, 40)}`);
        return 'unknown';
      });
    };

    // Helper: click Apply Settings only if present and enabled
    const applyIfNeeded = () => {
      cy.get('body').then(($body) => {
        const $btn = $body.find('button:contains("Apply Settings")');
        if ($btn.length > 0 && !$btn.is(':disabled')) {
          cy.log('Apply Settings button is active - Clicking...');
          cy.wrap($btn).click();
          cy.wait(2000);
        } else {
          cy.log('Apply Settings not needed - Settings already up to date');
        }
      });
    };

    // Helper: disable axis toggle if enabled
    const disableAxisIfEnabled = (axisId, axisName) => {
      cy.log(`Checking ${axisName} axis invert limit pin...`);
      cy.get(`#${axisId}`)
        .scrollIntoView()
        .should('exist')
        .then(($switch) => {
          const isEnabled = $switch.attr('data-state') === 'checked' ||
                            $switch.attr('aria-checked') === 'true';
          if (isEnabled) {
            cy.log(`${axisName} axis ENABLED - Disabling...`);
            cy.wrap($switch).click({ force: true });
            cy.wait(500);
          } else {
            cy.log(`${axisName} axis already DISABLED - Skipping`);
          }
        });
    };

    // Helper: enable axis toggle if disabled
    const enableAxisIfDisabled = (axisId, axisName) => {
      cy.log(`Checking ${axisName} axis invert limit pin...`);
      cy.get(`#${axisId}`)
        .scrollIntoView()
        .should('exist')
        .then(($switch) => {
          const isEnabled = $switch.attr('data-state') === 'checked' ||
                            $switch.attr('aria-checked') === 'true';
          if (!isEnabled) {
            cy.log(`${axisName} axis DISABLED - Enabling...`);
            cy.wrap($switch).click({ force: true });
            cy.wait(500);
          } else {
            cy.log(`${axisName} axis already ENABLED - Skipping`);
          }
        });
    };

    // Step 1: Connect
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

    // Step 3: Open Machine Info popup
    cy.log('Step 3: Opening Machine Information popup...');
    cy.get('header div.top-0 img').should('be.visible').click();
    cy.wait(2000);

    // Step 4: Pin the popup — from recording
    cy.log('Step 4: Pinning popup...');
    cy.get('body > div:nth-of-type(2) div > svg')
      .should('exist')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Machine Info popup pinned');

    // Step 5: Navigate to Configuration
    cy.log('Step 5: Navigating to Configuration page...');
    cy.goToConfig();
    cy.wait(3000);
    cy.log('Configuration page opened');

    // Step 6: Search for invert
    cy.log('Step 6: Searching for invert settings...');
    cy.searchInSettings('invert');
    cy.wait(1500);
    cy.log('Search results displayed for invert');

    // Disable all axes
    disableAxisIfEnabled('\\$5-0-key', 'X');
    disableAxisIfEnabled('\\$5-1-key', 'Y');
    disableAxisIfEnabled('\\$5-2-key', 'Z');
    disableAxisIfEnabled('\\$5-3-key', 'A');

    // Step 7: Apply if needed
    cy.log('Step 7: Applying settings...');
    applyIfNeeded();
    cy.log('Settings applied');

    // Verify all limits green in pinned popup
    cy.log('Verifying all limit pins turned green...');
    ['X limit', 'Y limit', 'Z limit', 'A limit'].forEach((limitName) => {
      checkLimitState(limitName).then((state) => {
        cy.log(`${limitName} state: ${state}`);
        expect(state, `${limitName} should be green`).to.equal('green');
      });
    });
    cy.log('All limit pins verified as green');

    // Step 8: Re-enable all axes
    cy.log('Step 8: Re-enabling all axis invert limit pins...');
    enableAxisIfDisabled('\\$5-0-key', 'X');
    enableAxisIfDisabled('\\$5-1-key', 'Y');
    enableAxisIfDisabled('\\$5-2-key', 'Z');
    enableAxisIfDisabled('\\$5-3-key', 'A');

    // Step 9: Apply if needed
    cy.log('Step 9: Applying settings after re-enabling axes...');
    applyIfNeeded();
    cy.log('Settings applied - All axes re-enabled');

    // ===== STEPPER MOTOR LOCK/UNLOCK TEST =====
    cy.log('Step 10: Testing Stepper Motor Lock/Unlock...');

    cy.log('Opening Machine Info popup...');
    cy.get('header div.top-0 img').should('be.visible').click();
    cy.wait(1500);

    cy.get('div.mt-4 > button')
      .should('be.visible')
      .as('stepperToggle');

    // Lock
    cy.log('Step 10a: Locking Stepper Motors...');
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' ||
                       $toggle.attr('aria-checked') === 'true';
      if (!isLocked) {
        cy.log('Stepper motors UNLOCKED - Locking now...');
        cy.get('@stepperToggle').click({ force: true });
        cy.wait(1000);
      } else {
        cy.log('Stepper motors already LOCKED - Skipping');
      }
    });

    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' ||
                       $toggle.attr('aria-checked') === 'true';
      expect(isLocked, 'Stepper motors should be LOCKED').to.be.true;
    });
    cy.log('Stepper motors LOCKED');
    cy.wait(2000);

    // Unlock
    cy.log('Step 10b: Unlocking Stepper Motors...');
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' ||
                       $toggle.attr('aria-checked') === 'true';
      if (isLocked) {
        cy.log('Stepper motors LOCKED - Unlocking now...');
        cy.get('@stepperToggle').click({ force: true });
        cy.wait(1000);
      } else {
        cy.log('Stepper motors already UNLOCKED - Skipping');
      }
    });

    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' ||
                       $toggle.attr('aria-checked') === 'true';
      expect(isLocked, 'Stepper motors should be UNLOCKED').to.be.false;
    });
    cy.log('Stepper motors UNLOCKED');

    // Final verification
    cy.log('Step 11: Final verification - Stepper motor unlocked...');
    cy.get('@stepperToggle').then(($toggle) => {
      const isLocked = $toggle.attr('data-state') === 'checked' ||
                       $toggle.attr('aria-checked') === 'true';
      expect(isLocked, 'Stepper motor should be UNLOCKED at test end').to.be.false;
      cy.log('Final state confirmed: Stepper motor is UNLOCKED');
    });

    cy.log('Test completed successfully');
  });
});
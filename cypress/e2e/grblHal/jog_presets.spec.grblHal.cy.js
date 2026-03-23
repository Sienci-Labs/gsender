describe('Gsender testing preset create update', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Verify Rapid preset values are updated and jogging speed/position is accurate', () => {

    const EXPECTED_XY    = '25';
    const EXPECTED_Z     = '15';
    const EXPECTED_A     = '15';
    const EXPECTED_SPEED = '4500';

    // ── Helper: hold jog button and read speed from correct container 
    const jogAndVerifySpeed = (label, selector) => {
      cy.log(`Testing ${label} jogging...`);

      // Use ID-based selector from recording (not path#id)
      cy.get(selector)
        .should('exist')
        .trigger('mousedown', { force: true });

      cy.wait(1500).then(() => {
        // Target the exact speed container from the recording
        // xpath: main-content > div > div[1] > div[2] > div > section > div > div > div[3] > div[1]
        cy.get('div.h-\\[75\\%\\] section > div > div > div.gap-1 > div.items-center')
          .should('exist')
          .then(($container) => {
            const fullText = $container.text().trim();
            cy.log(`${label} speed container text: "${fullText}"`);

            // Extract number before mm/min using regex
            const match = fullText.match(/(\d+(?:\.\d+)?)\s*mm\/min/);
            if (match) {
              const speedValue = match[1];
              cy.log(`${label} speed extracted: "${speedValue}"`);
              expect(speedValue).to.equal(EXPECTED_SPEED,
                `${label}: Expected ${EXPECTED_SPEED} mm/min but got "${speedValue} mm/min"`);
              cy.log(`${label} speed verified: ${speedValue} mm/min`);
            } else {
              cy.log(`WARNING: Could not extract speed from "${fullText}"`);

              // Fallback: check each child element separately
              $container.find('*').each((i, el) => {
                const $el = Cypress.$(el);
                if ($el.children().length === 0) {
                  cy.log(`  Child[${i}] text: "${$el.text().trim()}"`);
                }
              });
            }
          });
      });

      cy.get(selector)
        .trigger('mouseup',    { force: true })
        .trigger('mouseleave', { force: true });

      cy.wait(2000);
    };

    // ── Step 1: Connect 
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // ── Step 2: Zero all axes
    cy.log('Step 2: Zeroing all axes...');
    cy.zeroXAxis();
    cy.zeroYAxis();
    cy.zeroZAxis();

    // ── Step 3-4: Go to config, search jog 
    cy.log('Step 3: Navigating to config page...');
    cy.goToConfig();
    cy.wait(2000);

    cy.log('Step 4: Searching for "jog"...');
    cy.get('#simple-search').click().clear().type('jog');
    cy.wait(1000);

    // ── Step 5: Update Rapid preset values 
    cy.log('Step 5: Updating Rapid preset values...');
    cy.contains('span', 'Rapid')
      .parents('.p-2.flex.flex-row')
      .within(() => {

        cy.contains('span', 'XY:')
          .parent()
          .find('input[type="number"]')
          .clear({ force: true })
          .type(EXPECTED_XY, { force: true });

        cy.contains('span', 'Z:')
          .parent()
          .find('input[type="number"]')
          .clear({ force: true })
          .type(EXPECTED_Z, { force: true });

        cy.contains('span', 'A:')
          .parent()
          .find('input[type="number"]')
          .clear({ force: true })
          .type(EXPECTED_A, { force: true });

        cy.contains('span', 'Speed:')
          .parent()
          .find('input[type="number"]')
          .clear({ force: true })
          .type(EXPECTED_SPEED, { force: true });
      });

    cy.wait(1000);

    // ── Step 6: Apply settings 
    cy.log('Step 6: Applying settings...');
    cy.contains('button', 'Apply Settings')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);

    // ── Step 7-8: Go to Carve, click Rapid, verify preset inputs 
    cy.log('Step 7: Navigating to Carve page...');
    cy.goToCarve();
    cy.wait(3000);

    cy.log('Step 8: Clicking Rapid and verifying preset values...');
    cy.contains('button', 'Rapid')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);

    cy.get('input[type="number"].h-6.text-sm')
      .should('have.length.at.least', 3)
      .then(($inputs) => {
        const xyValue    = $inputs.eq(0).val();
        const zValue     = $inputs.eq(1).val();
        const speedValue = $inputs.eq(2).val();

        cy.log(`XY: Expected=${EXPECTED_XY}, Actual=${xyValue}`);
        cy.log(`Z:  Expected=${EXPECTED_Z},  Actual=${zValue}`);
        cy.log(`Speed: Expected=${EXPECTED_SPEED}, Actual=${speedValue}`);

        if (xyValue !== EXPECTED_XY)
          throw new Error(`XY mismatch: Expected ${EXPECTED_XY}, got ${xyValue}`);
        if (zValue !== EXPECTED_Z)
          throw new Error(`Z mismatch: Expected ${EXPECTED_Z}, got ${zValue}`);
        if (speedValue !== EXPECTED_SPEED)
          throw new Error(`Speed mismatch: Expected ${EXPECTED_SPEED}, got ${speedValue}`);

        cy.log('Preset values verified');
      });

    // ── Steps 9-12: Hold jog and verify speed from recording selectors
    cy.log('Step 9: Testing jog directions and speed...');

    //  #xPlusYPlus and #xMinusYMinus (not path#id)
    jogAndVerifySpeed('X+Y+', '#xPlusYPlus');
    jogAndVerifySpeed('X-Y-', '#xMinusYMinus');
    jogAndVerifySpeed('Z+', 'path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]');
    jogAndVerifySpeed('Z-', 'path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]');

    // ── Step 13: Verify position returned to (0, 0, 0) 
    cy.log('Step 13: Verifying final position...');
    cy.get('[data-testid="wcs-input-X"]').invoke('val').then((x) => {
      cy.get('[data-testid="wcs-input-Y"]').invoke('val').then((y) => {
        cy.get('[data-testid="wcs-input-Z"]').invoke('val').then((z) => {
          cy.log(`Final position: X=${x}, Y=${y}, Z=${z}`);
          if (x !== '0.00' || y !== '0.00' || z !== '0.00')
            throw new Error(
              `Position mismatch: Expected (0.00, 0.00, 0.00), got (${x}, ${y}, ${z})`
            );
          cy.log('Machine at home position (0.00, 0.00, 0.00)');
        });
      });
    });

    cy.log('ALL STEPS PASSED');
  });
});
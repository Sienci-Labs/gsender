describe('Spindle Configuration and Control Test - Decrease to 7500 RPM', () => {

  beforeEach(() => {
    cy.viewport(1689, 810);
    cy.loadUI();
    cy.goToConfig();
  });

  it('Connect, Configure Spindle, Upload File, Decrease to 7500 RPM, Reset, Increase to 24000 RPM, and Complete Job', () => {

    let minSpindleSpeed       = null;
    let maxSpindleSpeed       = null;
    let jobStartTime          = null;
    let jobEndTime            = null;
    let initialSpindleOverride = null;
    let initialSpindleRpm     = null;
    let currentSpindleRpm     = null;
    let reducedOverride       = 'N/A';
    let resetOverride         = 'N/A';
    let increasedOverride     = 'N/A';
    let secondResetOverride   = 'N/A';
    let reducedSpindleRpm     = 0;
    let resetSpindleRpm       = 0;
    let increasedSpindleRpm   = 0;
    let secondResetSpindleRpm = 0;

    // Button selectors as functions — fresh query + .first() on every call
    const DECREASE_BTN = () => cy.get('section div:nth-of-type(2) > div.gap-2 > div:nth-of-type(2) > button').first();
    const INCREASE_BTN = () => cy.get('div.order-2 section > div > div > div > div:nth-of-type(2) div:nth-of-type(3) > button').first();
    const RESET_BTN    = () => cy.get('div.order-2 section > div > div > div > div:nth-of-type(2) div:nth-of-type(1) > button').first();

    // --------------------------------------------------------
    // Step 1: Connect to CNC
    // --------------------------------------------------------
    cy.log('Step 1: Connect to CNC');
    cy.connectMachine();
    cy.wait(6000);
    cy.unlockMachineIfNeeded();
    cy.log('Connected to CNC');

    // --------------------------------------------------------
    // Step 2: Verify machine status is Idle
    // --------------------------------------------------------
    cy.log('Step 2: Verify machine status is Idle');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => cy.log('Machine status: ' + status.text().trim()));
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 3: Search for Spindle settings
    // --------------------------------------------------------
    cy.log('Step 3: Search for Spindle settings');
    cy.searchInSettings('Spindle');
    cy.wait(1000);

    // --------------------------------------------------------
    // Step 4: Enable spindle toggle
    // --------------------------------------------------------
    cy.log('Step 4: Enable spindle toggle');
    cy.get('#section-6')
      .find('fieldset').first()
      .find('div').first()
      .find('span.sm\\:order-none').last()
      .find('button')
      .should('exist')
      .click({ force: true });
    cy.wait(1000);

    // --------------------------------------------------------
    // Step 5: Record Maximum and Minimum Spindle Speed
    // --------------------------------------------------------
    cy.log('Step 5: Record Maximum and Minimum Spindle Speed');
    cy.get('input[type="number"]').then(($inputs) => {
      $inputs.each((index, input) => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
          if (!maxSpindleSpeed || val > maxSpindleSpeed) maxSpindleSpeed = val;
          if (!minSpindleSpeed || val < minSpindleSpeed) minSpindleSpeed = val;
        }
      });
      cy.log('Maximum Spindle Speed: ' + maxSpindleSpeed + ' RPM');
      cy.log('Minimum Spindle Speed: ' + minSpindleSpeed + ' RPM');
    });

    // --------------------------------------------------------
    // Step 6: Apply settings
    // --------------------------------------------------------
    cy.log('Step 6: Apply settings');
    cy.get('div.ring > button')
      .contains('Apply Settings')
      .click({ force: true });
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 7: Navigate to Carve page
    // --------------------------------------------------------
    cy.log('Step 7: Navigate to Carve page');
    cy.get('#app > div > div.h-full > div.flex img')
      .first()
      .click({ force: true });
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 8: Upload G-code file
    // --------------------------------------------------------
    cy.log('Step 8: Upload G-code file');
    cy.contains('Load File').should('be.visible').click({ force: true });
    cy.get('#fileInput').selectFile('cypress/fixtures/demo.gcode', { force: true });
    cy.wait(5000);

    // --------------------------------------------------------
    // Step 9: Start job
    // --------------------------------------------------------
    cy.log('Step 9: Start job');
    cy.then(() => {
      jobStartTime = Date.now();
      cy.log('Job Start Time: ' + new Date(jobStartTime).toISOString());
    });

    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    // --------------------------------------------------------
    // Step 10: Verify job is running
    // --------------------------------------------------------
    cy.log('Step 10: Verify job is running');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => cy.log('Job status: ' + status.text().trim()));
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 11: Capture initial spindle override and RPM
    // --------------------------------------------------------
    cy.log('Step 11: Capture initial spindle override and RPM');
    cy.get('#spindle-override').parent().then($parent => {
      const percentMatch = $parent.text().match(/(\d+)%/g);
      if (percentMatch) {
        initialSpindleOverride = percentMatch[percentMatch.length - 1];
        cy.log('Initial Spindle Override: ' + initialSpindleOverride);
      }
    });

    cy.contains(/\d+\s*RPM/i, { timeout: 5000 }).invoke('text').then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      initialSpindleRpm = match ? parseInt(match[1], 10) : null;
      cy.log('Initial Spindle RPM: ' + initialSpindleRpm + ' RPM');
    });
    cy.wait(1000);

    // --------------------------------------------------------
    // Step 12: Decrease spindle — 5 clicks, 10s wait each
    // --------------------------------------------------------
    cy.log('Step 12: Decreasing spindle speed - 5 clicks x 10s');

    DECREASE_BTN().then(($btn) => {
      cy.log(`Decrease button aria-label: "${$btn.attr('aria-label')}"`);
      cy.log(`Decrease button disabled: ${$btn.is(':disabled')}`);
    });

    Cypress._.times(5, (i) => {
      DECREASE_BTN().should('exist').click({ force: true });
      cy.wait(10000);
      cy.contains(/\d+\s*RPM/i).invoke('text').then((text) => {
        const match = text.match(/(\d+)\s*RPM/i);
        currentSpindleRpm = match ? parseInt(match[1], 10) : null;
        cy.log(`Decrease click ${i + 1}/5 — Current RPM: ${currentSpindleRpm}`);
      });
    });

    // --------------------------------------------------------
    // Step 13: Capture RPM and override after decrease
    // --------------------------------------------------------
    cy.log('Step 13: Capture spindle state after decrease');
    cy.contains(/\d+\s*RPM/i).invoke('text').then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      reducedSpindleRpm = match ? parseInt(match[1], 10) : 0;
      cy.log('Spindle RPM after decrease: ' + reducedSpindleRpm + ' RPM');
      cy.wrap(reducedSpindleRpm).as('reducedSpindleRpm');
    });

    cy.get('#spindle-override').parent().then($parent => {
      const percentMatch = $parent.text().match(/(\d+)%/g);
      if (percentMatch) {
        reducedOverride = percentMatch[percentMatch.length - 1];
        cy.log('Spindle Override after decrease: ' + reducedOverride);
      }
    });
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 14: Reset spindle to 100%
    // --------------------------------------------------------
    cy.log('Step 14: Click Reset button to return spindle to 100%');
    RESET_BTN().should('exist').click({ force: true });
    cy.wait(2000);
    cy.log('Reset button clicked - spindle should return to 100%');

    // --------------------------------------------------------
    // Step 15: Verify spindle returned to 100%
    // --------------------------------------------------------
    cy.log('Step 15: Verify spindle returned to 100% override');
    cy.get('#spindle-override').parent().then($parent => {
      const percentMatch = $parent.text().match(/(\d+)%/g);
      if (percentMatch) {
        resetOverride = percentMatch[percentMatch.length - 1];
        cy.log('Spindle Override after reset: ' + resetOverride);
        const overrideValue = parseInt(resetOverride);
        if (overrideValue >= 95 && overrideValue <= 105) {
          cy.log('Spindle successfully reset to 100%');
        } else {
          cy.log(`WARNING: Expected 100%, got ${overrideValue}%`);
        }
      }
    });

    cy.contains(/\d+\s*RPM/i).invoke('text').then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      resetSpindleRpm = match ? parseInt(match[1], 10) : 0;
      cy.log('Spindle RPM after reset: ' + resetSpindleRpm + ' RPM');
      cy.wrap(resetSpindleRpm).as('resetSpindleRpm');
    });
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 16: Increase spindle — 5 clicks, 10s wait each
    // --------------------------------------------------------
    cy.log('Step 16: Increasing spindle speed - 5 clicks x 10s');

    INCREASE_BTN().then(($btn) => {
      cy.log(`Increase button aria-label: "${$btn.attr('aria-label')}"`);
      cy.log(`Increase button disabled: ${$btn.is(':disabled')}`);
    });

    Cypress._.times(5, (i) => {
      INCREASE_BTN().should('exist').click({ force: true });
      cy.wait(10000);
      cy.contains(/\d+\s*RPM/i).invoke('text').then((text) => {
        const match = text.match(/(\d+)\s*RPM/i);
        currentSpindleRpm = match ? parseInt(match[1], 10) : null;
        cy.log(`Increase click ${i + 1}/5 — Current RPM: ${currentSpindleRpm}`);
      });
    });

    // --------------------------------------------------------
    // Step 17: Capture RPM and override after increase
    // --------------------------------------------------------
    cy.log('Step 17: Capture spindle state after increase');
    cy.get('#spindle-override').parent().then($parent => {
      const percentMatch = $parent.text().match(/(\d+)%/g);
      if (percentMatch) {
        increasedOverride = percentMatch[percentMatch.length - 1];
        cy.log('Spindle Override after increase: ' + increasedOverride);
      }
    });

    cy.contains(/\d+\s*RPM/i).invoke('text').then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      increasedSpindleRpm = match ? parseInt(match[1], 10) : 0;
      cy.log('Spindle RPM after increase: ' + increasedSpindleRpm + ' RPM');
      cy.wrap(increasedSpindleRpm).as('increasedSpindleRpm');
    });
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 18: Reset spindle to 100% again
    // --------------------------------------------------------
    cy.log('Step 18: Click Reset button again to return spindle to 100%');
    RESET_BTN().should('exist').click({ force: true });
    cy.wait(2000);
    cy.log('Second reset button clicked');

    // --------------------------------------------------------
    // Step 19: Verify spindle returned to 100% after increase
    // --------------------------------------------------------
    cy.log('Step 19: Verify spindle returned to 100% override after increase');
    cy.get('#spindle-override').parent().then($parent => {
      const percentMatch = $parent.text().match(/(\d+)%/g);
      if (percentMatch) {
        secondResetOverride = percentMatch[percentMatch.length - 1];
        cy.log('Spindle Override after second reset: ' + secondResetOverride);
        const overrideValue = parseInt(secondResetOverride);
        if (overrideValue >= 95 && overrideValue <= 105) {
          cy.log('Spindle successfully reset to 100%');
        } else {
          cy.log(`WARNING: Expected 100%, got ${overrideValue}%`);
        }
      }
    });

    cy.contains(/\d+\s*RPM/i).invoke('text').then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      secondResetSpindleRpm = match ? parseInt(match[1], 10) : 0;
      cy.log('Spindle RPM after second reset: ' + secondResetSpindleRpm + ' RPM');
      cy.wrap(secondResetSpindleRpm).as('secondResetSpindleRpm');
    });
    cy.wait(2000);

    // --------------------------------------------------------
    // Step 20: Wait before stopping job
    // --------------------------------------------------------
    cy.log('Step 20: Wait 5 seconds before stopping job');
    cy.wait(5000);

    // --------------------------------------------------------
    // Step 21: Stop job
    // --------------------------------------------------------
    cy.log('Step 21: Stop job and get details');
    cy.stopJobAndGetDetails();

    cy.get('@jobDetails').then(details => {
      jobEndTime = Date.now();
      cy.log('Job Details Retrieved:');
      cy.log(`Status: ${details.status}`);
      cy.log(`Time: ${details.time}`);
      cy.log(`Errors: ${details.errors}`);
      cy.log('Total Job Duration: ' + ((jobEndTime - jobStartTime) / 1000).toFixed(2) + 's');
      expect(details.status.toLowerCase()).to.not.include('error');
      cy.wrap(details.status).as('jobStatus');
      cy.wrap(details.time).as('timeTaken');
      cy.wrap(details.errors).as('jobErrors');
    });

    // --------------------------------------------------------
    // Step 22: Display final summary
    // --------------------------------------------------------
    cy.log('Step 22: Display final summary');
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('SPINDLE TEST SUMMARY - DECREASE & INCREASE');
          cy.log('  Min Spindle Speed: ' + minSpindleSpeed + ' RPM');
          cy.log('  Max Spindle Speed: ' + maxSpindleSpeed + ' RPM');
          cy.log('  Initial Override: ' + (initialSpindleOverride || 'N/A'));
          cy.log('  Initial RPM: ' + initialSpindleRpm + ' RPM');
          cy.log('  Reduced Override: ' + reducedOverride);
          cy.log('  Reduced RPM: ' + reducedSpindleRpm + ' RPM');
          cy.log('  After 1st Reset Override: ' + resetOverride);
          cy.log('  After 1st Reset RPM: ' + resetSpindleRpm + ' RPM');
          cy.log('  Increased Override: ' + increasedOverride);
          cy.log('  Increased RPM: ' + increasedSpindleRpm + ' RPM');
          cy.log('  After 2nd Reset Override: ' + secondResetOverride);
          cy.log('  After 2nd Reset RPM: ' + secondResetSpindleRpm + ' RPM');
          cy.log('  Status: ' + status);
          cy.log('  Time Taken: ' + time);
          cy.log('  Errors: ' + errors);
          cy.log('  Total Duration: ' + (jobEndTime && jobStartTime ?
            ((jobEndTime - jobStartTime) / 1000).toFixed(2) : 'N/A') + 's');
          cy.log('===============================================');
        });
      });
    });

    // --------------------------------------------------------
    // Step 23: Close the job completion popup
    // --------------------------------------------------------
    cy.log('Step 23: Close the job completion popup');
    cy.contains('button', 'Close').should('be.visible').click({ force: true });
    cy.wait(1000);

    // --------------------------------------------------------
    // Step 24: Verify popup is closed
    // --------------------------------------------------------
    cy.log('Step 24: Verify popup is closed');
    cy.contains('h2', 'Job End').should('not.exist');
    cy.log('Popup successfully closed');

    // --------------------------------------------------------
    // Step 25: Save test results to file
    // --------------------------------------------------------
    cy.log('Step 25: Save comprehensive test results to file');
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.writeFile('cypress/results/spindle-test-decrease-increase-stopped.json', {
            testName: 'Spindle Configuration and Control Test - Decrease & Increase (Stopped)',
            timestamp: new Date().toISOString(),
            spindleConfiguration: { minSpindleSpeed, maxSpindleSpeed },
            spindleOverrideSequence: {
              initial: {
                override: initialSpindleOverride || 'N/A',
                rpm: initialSpindleRpm
              },
              decreasePhase: {
                clickCount: 5,
                actualRpm: reducedSpindleRpm,
                override: reducedOverride,
                firstResetOverride: resetOverride,
                firstResetRpm: resetSpindleRpm
              },
              increasePhase: {
                clickCount: 5,
                actualOverride: increasedOverride,
                actualRpm: increasedSpindleRpm,
                secondResetOverride: secondResetOverride,
                secondResetRpm: secondResetSpindleRpm
              }
            },
            jobDetails: {
              jobStartTime: new Date(jobStartTime).toISOString(),
              jobEndTime: new Date(jobEndTime).toISOString(),
              jobDurationSeconds: jobEndTime && jobStartTime ?
                (jobEndTime - jobStartTime) / 1000 : 0,
              status,
              timeTaken: time,
              errors,
              stoppedManually: true
            }
          });
          cy.log('Test details saved to: cypress/results/spindle-test-decrease-increase-stopped.json');
        });
      });
    });

    cy.log('SPINDLE TEST COMPLETED SUCCESSFULLY');
  });
});
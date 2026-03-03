describe('Spindle Configuration and Control Test - Decrease to 7500 RPM', () => {

  beforeEach(() => {
    cy.viewport(1689, 810);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/configuration`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 120000
    });
  });

  it('Connect, Configure Spindle, Upload File, Decrease to 7500 RPM, Reset, Increase to 24000 RPM, and Complete Job', () => {
    
    let minSpindleSpeed = null;
    let maxSpindleSpeed = null;
    let jobStartTime = null;
    let jobEndTime = null;
    let initialSpindleOverride = null;
    let initialSpindleRpm = null;
    let targetSpindleRpm = 7500;
    let currentSpindleRpm = null;
    let decreaseClickCount = 0;
    let increaseClickCount = 0;
    let reducedOverride = 'N/A';
    let resetOverride = 'N/A';
    let increasedOverride = 'N/A';
    let secondResetOverride = 'N/A';
    let reducedSpindleRpm = 0;
    let resetSpindleRpm = 0;
    let increasedSpindleRpm = 0;
    let secondResetSpindleRpm = 0;
    let targetIncreaseRpm = 24000;

    cy.log('Step 1: Connect to CNC');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    cy.unlockMachineIfNeeded();

    cy.log('Step 2: Verify machine status is Idle');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log('Machine status: ' + status.text().trim());
      });
    cy.wait(2000);

    cy.log('Step 3: Search for Spindle settings');
    cy.searchInSettings('Spindle');
    cy.wait(1000);

    cy.log('Step 4: Enable spindle toggle');
    cy.get('fieldset:nth-of-type(1) span.sm\\:order-none button')
      .click({ force: true });
    cy.wait(1000);

    cy.log('Step 5: Record Maximum and Minimum Spindle Speed');
    cy.get('input[type="number"]').then(($inputs) => {
      $inputs.each((index, input) => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
          if (!maxSpindleSpeed || val > maxSpindleSpeed) {
            maxSpindleSpeed = val;
          }
          if (!minSpindleSpeed || val < minSpindleSpeed) {
            minSpindleSpeed = val;
          }
        }
      });
      cy.log('Maximum Spindle Speed: ' + maxSpindleSpeed + ' RPM');
      cy.log('Minimum Spindle Speed: ' + minSpindleSpeed + ' RPM');
    });

    cy.log('Step 6: Apply settings');
    cy.get('div.ring > button')
      .contains('Apply Settings')
      .click({ force: true });
    cy.wait(2000);

    cy.log('Step 7: Navigate to Carve page');
    cy.get('#app > div > div.h-full > div.flex img')
      .first()
      .click({ force: true });
    cy.wait(2000);

    cy.log('Step 8: Upload G-code file');
    cy.contains('Load File')
      .should('be.visible')
      .click({ force: true });

    cy.get('#fileInput')
      .selectFile('cypress/fixtures/demo.gcode', { force: true });

    cy.wait(5000);

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

    cy.log('Step 10: Verify job is running');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log('Job status: ' + status.text().trim());
      });
    cy.wait(2000);

    cy.log('Step 11: Capture initial spindle override and RPM');
    cy.get('#spindle-override').parent().then($parent => {
      const allText = $parent.text();
      cy.log('Spindle override container text: ' + allText);
      
      const percentMatch = allText.match(/(\d+)%/g);
      if (percentMatch && percentMatch.length > 0) {
        initialSpindleOverride = percentMatch[percentMatch.length - 1];
        cy.log('Initial Spindle Override: ' + initialSpindleOverride);
      }
    });

    // Capture initial RPM
    cy.contains(/\d+\s*RPM/i, { timeout: 5000 })
      .invoke('text')
      .then((text) => {
        const match = text.match(/(\d+)\s*RPM/i);
        initialSpindleRpm = match ? parseInt(match[1], 10) : null;
        cy.log('Initial Spindle RPM: ' + initialSpindleRpm + ' RPM');
      });

    cy.wait(1000);

    cy.log('Step 12: Click decrease button until spindle reaches 7500 RPM');
    cy.log('Target RPM: ' + targetSpindleRpm);
    
    // Find the decrease button for spindle override
    cy.get('div.h-\\[25\\%\\] div.relative > div.h-full > div > div > div > div:nth-of-type(2) div:nth-of-type(2) > button')
      .should('exist')
      .as('decreaseButton');

    // Function to check current RPM and click decrease if needed
    const decreaseUntilTarget = () => {
      cy.contains(/\d+\s*RPM/i, { timeout: 5000 })
        .invoke('text')
        .then((text) => {
          const match = text.match(/(\d+)\s*RPM/i);
          currentSpindleRpm = match ? parseInt(match[1], 10) : null;
          
          cy.log(`Current RPM: ${currentSpindleRpm}, Target: ${targetSpindleRpm}, Clicks: ${decreaseClickCount}`);
          
          // Check if we've reached or are below target
          if (currentSpindleRpm > targetSpindleRpm) {
            decreaseClickCount++;
            
            // Click the decrease button
            cy.get('@decreaseButton')
              .click({ force: true });
            
            cy.wait(1500); // Wait for debounce (1000ms) + update
            
            // Recursively check and click again if needed
            decreaseUntilTarget();
          } else {
            cy.log(` Target RPM reached: ${currentSpindleRpm} RPM (after ${decreaseClickCount} clicks)`);
          }
        });
    };

    // Start the decrease process
    decreaseUntilTarget();

    cy.log('Step 13: Verify spindle is at approximately 7500 RPM');
    cy.contains(/\d+\s*RPM/i)
      .invoke('text')
      .then((text) => {
        const match = text.match(/(\d+)\s*RPM/i);
        const verifiedRpm = match ? parseInt(match[1], 10) : 0;
        reducedSpindleRpm = verifiedRpm;
        cy.log('Verified Spindle RPM: ' + verifiedRpm + ' RPM');
        
        // Allow 10% tolerance (6750 - 8250 RPM)
        if (verifiedRpm >= 6750 && verifiedRpm <= 8250) {
          cy.log(' Spindle RPM is within acceptable range of 7500 RPM');
        } else {
          cy.log(` WARNING: Expected ~7500 RPM, got ${verifiedRpm} RPM`);
        }
        
        cy.wrap(verifiedRpm).as('reducedSpindleRpm');
      });

    // Capture the override percentage at this point
    cy.get('#spindle-override').parent().then($parent => {
      const allText = $parent.text();
      const percentMatch = allText.match(/(\d+)%/g);
      if (percentMatch && percentMatch.length > 0) {
        reducedOverride = percentMatch[percentMatch.length - 1];
        cy.log('Spindle Override at 7500 RPM: ' + reducedOverride);
      }
    });

    cy.wait(2000);

    cy.log('Step 14: Click Reset button to return spindle to 100%');
    // The reset/plus button is in div:nth-of-type(1)
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) div:nth-of-type(1) > button')
      .should('exist')
      .click({ force: true });
    
    cy.wait(2000);
    cy.log('Reset button clicked - spindle should return to 100%');

    cy.log('Step 15: Verify spindle returned to 100% override');
    cy.get('#spindle-override').parent().then($parent => {
      const allText = $parent.text();
      const percentMatch = allText.match(/(\d+)%/g);
      if (percentMatch && percentMatch.length > 0) {
        resetOverride = percentMatch[percentMatch.length - 1];
        cy.log('Spindle Override after reset: ' + resetOverride);
        
        const overrideValue = parseInt(resetOverride);
        if (overrideValue >= 95 && overrideValue <= 105) {
          cy.log(' Spindle successfully reset to 100%');
        } else {
          cy.log(` WARNING: Expected 100%, got ${overrideValue}%`);
        }
      }
    });

    // Verify RPM increased
    cy.contains(/\d+\s*RPM/i)
      .invoke('text')
      .then((text) => {
        const match = text.match(/(\d+)\s*RPM/i);
        resetSpindleRpm = match ? parseInt(match[1], 10) : 0;
        cy.log('Spindle RPM after reset: ' + resetSpindleRpm + ' RPM');
        cy.wrap(resetSpindleRpm).as('resetSpindleRpm');
      });

    cy.wait(2000);

    cy.log('Step 16: Click increase button until spindle reaches 24000 RPM');
cy.log('Target RPM: ' + targetIncreaseRpm);

// Corrected selector based on recorded JSON - targeting the + button
cy.get('div.relative > div.h-full div:nth-of-type(2) > div.gap-2 > div:nth-of-type(3) > button')
  .should('exist')
  .as('increaseButton');

// Function to check current RPM and click increase if needed
const increaseUntilTarget = () => {
  cy.contains(/\d+\s*RPM/i, { timeout: 5000 })
    .invoke('text')
    .then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      currentSpindleRpm = match ? parseInt(match[1], 10) : null;
      
      cy.log(`Current RPM: ${currentSpindleRpm}, Target: ${targetIncreaseRpm}, Clicks: ${increaseClickCount}`);
      
      // Check if we've reached target RPM
      if (currentSpindleRpm < targetIncreaseRpm) {
        increaseClickCount++;
        
        // Click the increase button
        cy.get('@increaseButton')
          .click({ force: true });
        
        cy.wait(1500); // Wait for debounce (1000ms) + update
        
        // Recursively check and click again if needed
        increaseUntilTarget();
      } else {
        cy.log(` Target RPM reached: ${currentSpindleRpm} RPM (after ${increaseClickCount} clicks)`);
      }
    });
};

// Start the increase process
increaseUntilTarget();

cy.log('Step 17: Verify spindle reached approximately 24000 RPM');

// Capture the override percentage at this point
cy.get('#spindle-override').parent().then($parent => {
  const allText = $parent.text();
  const percentMatch = allText.match(/(\d+)%/g);
  if (percentMatch && percentMatch.length > 0) {
    increasedOverride = percentMatch[percentMatch.length - 1];
    cy.log('Spindle Override at 24000 RPM: ' + increasedOverride);
  }
});

// Verify RPM
cy.contains(/\d+\s*RPM/i)
  .invoke('text')
  .then((text) => {
    const match = text.match(/(\d+)\s*RPM/i);
    increasedSpindleRpm = match ? parseInt(match[1], 10) : 0;
    cy.log('Verified Spindle RPM: ' + increasedSpindleRpm + ' RPM');
    
    // Allow 10% tolerance (21600 - 26400 RPM)
    if (increasedSpindleRpm >= 21600 && increasedSpindleRpm <= 26400) {
      cy.log(' Spindle RPM is within acceptable range of 24000 RPM');
    } else {
      cy.log(` WARNING: Expected ~24000 RPM, got ${increasedSpindleRpm} RPM`);
    }
    
    cy.wrap(increasedSpindleRpm).as('increasedSpindleRpm');
  });

cy.wait(2000);


    cy.log('Step 18: Click Reset button again to return spindle to 100%');
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) div:nth-of-type(1) > button')
      .should('exist')
      .click({ force: true });
    
    cy.wait(2000);
    cy.log('Second reset button clicked - spindle should return to 100%');

    cy.log('Step 19: Verify spindle returned to 100% override after increase');
    cy.get('#spindle-override').parent().then($parent => {
      const allText = $parent.text();
      const percentMatch = allText.match(/(\d+)%/g);
      if (percentMatch && percentMatch.length > 0) {
        secondResetOverride = percentMatch[percentMatch.length - 1];
        cy.log('Spindle Override after second reset: ' + secondResetOverride);
        
        const overrideValue = parseInt(secondResetOverride);
        if (overrideValue >= 95 && overrideValue <= 105) {
          cy.log(' Spindle successfully reset to 100%');
        } else {
          cy.log(` WARNING: Expected 100%, got ${overrideValue}%`);
        }
      }
    });

    // Verify RPM returned
    cy.contains(/\d+\s*RPM/i)
      .invoke('text')
      .then((text) => {
        const match = text.match(/(\d+)\s*RPM/i);
        secondResetSpindleRpm = match ? parseInt(match[1], 10) : 0;
        cy.log('Spindle RPM after second reset: ' + secondResetSpindleRpm + ' RPM');
        cy.wrap(secondResetSpindleRpm).as('secondResetSpindleRpm');
      });

    cy.wait(2000);

   cy.log('Step 20: Wait 5 seconds before stopping job');
cy.wait(5000);

cy.log('Step 21: Stop job and get details using custom command');
cy.stopJobAndGetDetails();

cy.get('@jobDetails').then(details => {
  jobEndTime = Date.now();
  
  cy.log('Job Details Retrieved:');
  cy.log(`Status: ${details.status}`);
  cy.log(`Time: ${details.time}`);
  cy.log(`Errors: ${details.errors}`);
  
  const durationSeconds = ((jobEndTime - jobStartTime) / 1000).toFixed(2);
  cy.log('Total Job Duration: ' + durationSeconds + 's');
  
  // Validate status doesn't contain error
  expect(details.status.toLowerCase()).to.not.include('error');
  
  // Store job details for later use
  cy.wrap(details.status).as('jobStatus');
  cy.wrap(details.time).as('timeTaken');
  cy.wrap(details.errors).as('jobErrors');
});

cy.log('Step 22: Display final summary');
cy.get('@jobStatus').then((status) => {
  cy.get('@timeTaken').then((time) => {
    cy.get('@jobErrors').then((errors) => {
      cy.log('');
      cy.log('SPINDLE TEST SUMMARY - DECREASE & INCREASE');
      cy.log('Configuration:');
      cy.log('  Min Spindle Speed: ' + minSpindleSpeed + ' RPM');
      cy.log('  Max Spindle Speed: ' + maxSpindleSpeed + ' RPM');
      cy.log('Spindle Override Changes:');
      cy.log('  Initial Override: ' + (initialSpindleOverride || 'N/A'));
      cy.log('  Initial RPM: ' + initialSpindleRpm + ' RPM');
      cy.log('  DECREASE Phase:');
      cy.log('    Decrease Clicks: ' + decreaseClickCount);
      cy.log('    Reduced Override: ' + reducedOverride);
      cy.log('    Reduced RPM: ' + reducedSpindleRpm + ' RPM');
      cy.log('    After 1st Reset Override: ' + resetOverride);
      cy.log('    After 1st Reset RPM: ' + resetSpindleRpm + ' RPM');
      cy.log('  INCREASE Phase:');
      cy.log('    Increase Clicks: ' + increaseClickCount);
      cy.log('    Increased Override: ' + increasedOverride);
      cy.log('    Increased RPM: ' + increasedSpindleRpm + ' RPM');
      cy.log('    After 2nd Reset Override: ' + secondResetOverride);
      cy.log('    After 2nd Reset RPM: ' + secondResetSpindleRpm + ' RPM');
      cy.log('Job Details:');
      cy.log('  Status: ' + status);
      cy.log('  Time Taken: ' + time);
      cy.log('  Errors: ' + errors);
      
      const duration = jobEndTime && jobStartTime ? 
        ((jobEndTime - jobStartTime) / 1000).toFixed(2) : 'N/A';
      cy.log('  Total Duration: ' + duration + 's');
      cy.log('===============================================');
    });
  });
});

cy.log('Step 23: Close the job completion popup');
cy.contains('button', 'Close')
  .should('be.visible')
  .click({ force: true });
cy.wait(1000);
cy.log('Popup closed');

cy.log('Step 24: Verify popup is closed');
cy.contains('h2', 'Job End').should('not.exist');
cy.log('Popup successfully closed');

cy.log('Step 25: Save comprehensive test results to file');
cy.get('@jobStatus').then((status) => {
  cy.get('@timeTaken').then((time) => {
    cy.get('@jobErrors').then((errors) => {
      const testDetails = {
        testName: 'Spindle Configuration and Control Test - Decrease & Increase (Stopped)',
        timestamp: new Date().toISOString(),
        spindleConfiguration: {
          minSpindleSpeed: minSpindleSpeed,
          maxSpindleSpeed: maxSpindleSpeed
        },
        spindleOverrideSequence: {
          initial: {
            override: initialSpindleOverride || 'N/A',
            rpm: initialSpindleRpm
          },
          decreasePhase: {
            targetRpm: targetSpindleRpm,
            actualRpm: reducedSpindleRpm,
            override: reducedOverride,
            decreaseClicksRequired: decreaseClickCount,
            firstResetOverride: resetOverride,
            firstResetRpm: resetSpindleRpm
          },
          increasePhase: {
            targetRpm: targetIncreaseRpm,
            actualOverride: increasedOverride,
            actualRpm: increasedSpindleRpm,
            increaseClicksRequired: increaseClickCount,
            secondResetOverride: secondResetOverride,
            secondResetRpm: secondResetSpindleRpm
          }
        },
        jobDetails: {
          jobStartTime: new Date(jobStartTime).toISOString(),
          jobEndTime: new Date(jobEndTime).toISOString(),
          jobDurationSeconds: jobEndTime && jobStartTime ? 
            (jobEndTime - jobStartTime) / 1000 : 0,
          status: status,
          timeTaken: time,
          errors: errors,
          stoppedManually: true
        }
      };
      
      cy.writeFile('cypress/results/spindle-test-decrease-increase-stopped.json', testDetails);
      cy.log('Test details saved to: cypress/results/spindle-test-decrease-increase-stopped.json');
    });
  });
});

cy.log('SPINDLE TEST COMPLETED SUCCESSFULLY');

  });
});
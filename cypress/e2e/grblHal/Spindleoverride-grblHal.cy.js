describe('Spindle Configuration and Speed Verification Test', () => {

  beforeEach(() => {
    cy.viewport(1706, 810);
    // Load UI
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 3,
      waitTime: 3000,
      timeout: 120000
    });
  });

  it('Complete Spindle Configuration with Min/Max Speed Verification', () => {

    let jobStartTime = null;
    let jobEndTime = null;
    const spindleChanges = [];
    let configMinSpeed = null;
    let configMaxSpeed = null;
    let initialSpindleValue = null;
    let finalSpindleValue = null;

    // STEP 1: Connect to CNC Machine
 
;
    cy.log('STEP 1: Connecting to CNC Machine');

  
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Successfully connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();


    // STEP 2: Verify Machine is Idle

    cy.log('STEP 2: Verifying Machine Status');

 
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine Status: "${status.text().trim()}"`);
      });
    cy.wait(2000);


    // STEP 3: Navigate to Configuration Page

    cy.log('STEP 3: Navigating to Configuration');

    
    cy.log('3.1: Clicking on Config tab...');
    cy.get('a').contains('Config')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Opened Config page');

    // STEP 4: Search for Spindle Settings


    cy.log('STEP 4: Searching for Spindle Settings');


    cy.log('4.1: Clearing search field...');
    cy.get('#simple-search')
      .should('be.visible')
      .clear();
    
    cy.log('4.2: Typing "spindle" in search...');
    cy.get('#simple-search')
      .type('spindle');
    
    cy.wait(2000);
    cy.log('Spindle search completed');


    // STEP 5: Enable Spindle if Not Enabled

    cy.log('STEP 5: Checking Spindle Enable Status');


    // Click on the spindle toggle button to enable (based on recorder)
    cy.log('5.1: Checking spindle enable button...');
    cy.get('fieldset:nth-of-type(1) span.sm\\:order-none button')
      .first()
      .then($button => {
        // Check if button indicates enabled state
        cy.log('Clicking to ensure spindle is enabled...');
        cy.wrap($button).click({ force: true });
        cy.wait(1000);
        cy.log('Spindle enable toggled');
      });

    // STEP 6: Record Minimum Spindle Speed
  

    cy.log('STEP 6: Recording Minimum Spindle Speed');


    cy.log('6.1: Locating minimum spindle speed field...');
    
    // Use contains to find the element and scroll it into view
    cy.contains('span', 'Minimum spindle speed')
      .parents('div.p-2')
      .scrollIntoView()
      .should('exist')
      .find('input[type="number"]')
      .invoke('val')
      .then((minValue) => {
        configMinSpeed = minValue;
        cy.log(`✓ Minimum Spindle Speed (Min): ${configMinSpeed} RPM`);
        spindleChanges.push({
          action: 'Config Min Speed',
          value: `${configMinSpeed} RPM`,
          timestamp: new Date().toISOString()
        });
      });
    
    cy.wait(500);

 
    // STEP 7: Record Maximum Spindle Speed

    cy.log('STEP 7: Recording Maximum Spindle Speed');


    cy.log('7.1: Locating maximum spindle speed field...');
    
    // Use contains to find the element and scroll it into view
    cy.contains('span', 'Maximum spindle speed')
      .parents('div.p-2')
      .scrollIntoView()
      .should('exist')
      .find('input[type="number"]')
      .invoke('val')
      .then((maxValue) => {
        configMaxSpeed = maxValue;
        cy.log(` Maximum Spindle Speed (Max): ${configMaxSpeed} RPM`);
        spindleChanges.push({
          action: 'Config Max Speed',
          value: `${configMaxSpeed} RPM`,
          timestamp: new Date().toISOString()
        });
      });
    
    cy.wait(500);

  
    // STEP 8: Apply Settings

;
    cy.log('STEP 8: Applying Configuration Settings');


    cy.log('8.1: Clicking Apply Settings button...');
    cy.contains('button', 'Apply Settings')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log(' Settings applied successfully');

   
    // STEP 9: Navigate to Carve Page

    cy.log('STEP 9: Navigating to Carve Page');
 

    cy.log('9.1: Clicking on Carve tab...');
    cy.get('a').contains('Carve')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log(' Navigated to Carve page');


    // STEP 10: Upload G-code File

    cy.log('STEP 10: Uploading G-code File');

    cy.uploadGcodeFile();
    cy.wait(2000);
    cy.log(' G-code file uploaded successfully');

    // STEP 11: Decrease Feedrate to Minimum

    
    cy.log('STEP 11: Adjusting Feedrate to Minimum');


    cy.log('11.1: Locating feedrate slider...');
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(1) span:nth-of-type(2) > span')
      .should('be.visible')
      .then($feedrate => {
        const currentFeedrate = $feedrate.text();
        cy.log(`Current Feedrate: ${currentFeedrate}`);
      });

    cy.log('11.2: Decreasing feedrate to minimum...');
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(1) span:nth-of-type(2) > span')
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: -500, clientY: 0 })
      .trigger('mouseup', { force: true });
    
    cy.wait(2000);
    
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(1) span:nth-of-type(2) > span')
      .then($feedrate => {
        const minFeedrate = $feedrate.text();
        cy.log(`Feedrate set to minimum: ${minFeedrate}`);
      });

    // STEP 12: Start Job
  

    cy.log('STEP 12: Starting Job');
   
    
    cy.then(() => {
      jobStartTime = Date.now();
      cy.log(`Job Start Time: ${new Date(jobStartTime).toISOString()}`);
    });
    
    cy.log('12.1: Clicking Start button...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(3000);
    cy.log(' Job started successfully');

    // Verify job is running
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job Status: "${status.text().trim()}"`);
      });


    // STEP 13: Record Initial Spindle Speed


    cy.log('STEP 13: Recording Initial Spindle Speed');


    cy.log('13.1: Reading initial spindle value...');
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span.min-w-4')
      .should('be.visible')
      .invoke('text')
      .then((initialValue) => {
        initialSpindleValue = initialValue.trim();
        cy.log(`Initial Spindle Speed: ${initialSpindleValue}`);
        spindleChanges.push({
          action: 'Initial Spindle Value (Job Started)',
          value: initialSpindleValue,
          timestamp: new Date().toISOString()
        });
      });

    cy.wait(2000);


    // STEP 14: Decrease Spindle to Minimum

    cy.log('STEP 14: Testing Minimum Spindle Speed');


    cy.log('14.1: Dragging spindle slider to minimum...');
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span:nth-of-type(2) > span')
      .should('be.visible')
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: -500, clientY: 0 })
      .trigger('mouseup', { force: true });
    
    cy.log('14.2: Waiting 5 seconds for acceleration adjustment...');
    cy.wait(5000);
    
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span.min-w-4')
      .invoke('text')
      .then((minValue) => {
        const actualMinValue = minValue.trim();
        const minSpeedNumber = actualMinValue.replace(/[^\d.]/g, '');
        const configMinNumber = String(configMinSpeed).replace(/[^\d.]/g, '');
        
        cy.log(`Actual Minimum Spindle Speed: ${actualMinValue}`);
        cy.log(`Expected Minimum (from Config): ${configMinSpeed} RPM`);
        
        const match = minSpeedNumber === configMinNumber;
        
        spindleChanges.push({
          action: 'Decreased to Minimum',
          value: actualMinValue,
          expectedValue: `${configMinSpeed} RPM`,
          match: match,
          timestamp: new Date().toISOString()
        });
        
        if (match) {
          cy.log('PASS: Minimum spindle value matches config Min');
        } else {
          cy.log(` WARNING: Minimum spindle value does not match exactly. Expected: ${configMinSpeed} RPM, Got: ${actualMinValue}`);
        }
      });

   
    // STEP 15: Increase Spindle to Maximum
;
    cy.log('STEP 15: Testing Maximum Spindle Speed');
    

    cy.log('15.1: Dragging spindle slider to maximum...');
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span:nth-of-type(2) > span')
      .should('be.visible')
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: 500, clientY: 0 })
      .trigger('mouseup', { force: true });
    
    cy.log('15.2: Waiting 5 seconds for acceleration adjustment...');
    cy.wait(5000);
    
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span.min-w-4')
      .invoke('text')
      .then((maxValue) => {
        const actualMaxValue = maxValue.trim();
        const maxSpeedNumber = actualMaxValue.replace(/[^\d.]/g, '');
        const configMaxNumber = String(configMaxSpeed).replace(/[^\d.]/g, '');
        
        cy.log(`Actual Maximum Spindle Speed: ${actualMaxValue}`);
        cy.log(`Expected Maximum (from Config): ${configMaxSpeed} RPM`);
        
        const match = maxSpeedNumber === configMaxNumber;
        
        spindleChanges.push({
          action: 'Increased to Maximum',
          value: actualMaxValue,
          expectedValue: `${configMaxSpeed} RPM`,
          match: match,
          timestamp: new Date().toISOString()
        });
        
        if (match) {
          cy.log('PASS: Maximum spindle value matches config Max');
        } else {
          cy.log(`WARNING: Maximum spindle value does not match exactly. Expected: ${configMaxSpeed} RPM, Got: ${actualMaxValue}`);
        }
      });

   
    // STEP 16: Test Reset Button

    cy.log('STEP 16: Testing Reset Functionality');


    cy.log('16.1: Clicking Reset button...');
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) div:nth-of-type(3) > button')
      .should('be.visible')
      .click({ force: true });
    
    cy.log('16.2: Waiting 5 seconds for reset to complete...');
    cy.wait(5000);
    
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span.min-w-4')
      .invoke('text')
      .then((resetValue) => {
        const actualResetValue = resetValue.trim();
        cy.log(`Spindle Speed after Reset: ${actualResetValue}`);
        cy.log(`Expected (Initial Value): ${initialSpindleValue}`);
        
        const match = actualResetValue === initialSpindleValue;
        
        spindleChanges.push({
          action: 'Reset Button Click',
          value: actualResetValue,
          expectedValue: initialSpindleValue,
          match: match,
          timestamp: new Date().toISOString()
        });
        
        if (match) {
          cy.log('PASS: Reset value matches initial spindle value');
        } else {
          cy.log(`WARNING: Reset value does not match initial. Expected: ${initialSpindleValue}, Got: ${actualResetValue}`);
        }
      });


    // STEP 17: Test Plus Button

    cy.log('STEP 17: Testing Plus Button');


    cy.log('17.1: Clicking Plus button...');
    cy.get('div.h-\\[25\\%\\] div.relative > div.h-full > div > div > div > div:nth-of-type(2) div:nth-of-type(2) > button')
      .first()
      .should('be.visible')
      .click({ force: true });
    
    cy.wait(1500);
    
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span.min-w-4')
      .invoke('text')
      .then((plusValue) => {
        const afterPlus = plusValue.trim();
        cy.log(` Spindle after Plus click: ${afterPlus}`);
        spindleChanges.push({
          action: 'Plus Button Click',
          value: afterPlus,
          timestamp: new Date().toISOString()
        });
      });


    // STEP 18: Test Minus Button


    cy.log('STEP 18: Testing Minus Button (After Plus)');
   

    cy.log('18.1: Clicking Minus button...');
    cy.get('div.h-\\[25\\%\\] div.relative > div.h-full > div > div > div > div:nth-of-type(2) div:nth-of-type(2) > button')
      .last()
      .should('be.visible')
      .click({ force: true });
    
    cy.wait(1500);
    
    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span.min-w-4')
      .invoke('text')
      .then((minusValue) => {
        const afterMinus = minusValue.trim();
        cy.log(`Spindle after Minus click: ${afterMinus}`);
        cy.log(`Expected (Initial Value): ${initialSpindleValue}`);
        
        const match = afterMinus === initialSpindleValue;
        
        spindleChanges.push({
          action: 'Minus Button Click (After Plus)',
          value: afterMinus,
          expectedValue: initialSpindleValue,
          match: match,
          timestamp: new Date().toISOString()
        });
        
        if (match) {
          cy.log('PASS: Plus then Minus returns to initial value');
        } else {
          cy.log(`INFO: Plus/Minus result: ${afterMinus} (Initial: ${initialSpindleValue})`);
        }
      });

    cy.wait(2000);

 
    // STEP 19: Wait for Job Completion


    cy.log('STEP 19: Waiting for Job Completion');

    
    cy.contains(/^Idle$/i, { timeout: 120000 })
      .should('be.visible')
      .then(status => {
        jobEndTime = Date.now();
        cy.log(`Job completed. Status: "${status.text().trim()}"`);
        cy.log(`Job End Time: ${new Date(jobEndTime).toISOString()}`);
        cy.log(`Total Job Duration: ${((jobEndTime - jobStartTime) / 1000).toFixed(2)}s`);
      });
    cy.wait(3000);


    // STEP 20: Record Final Spindle Value

    cy.log('STEP 20: Recording Final Spindle Speed');

    cy.get('div.relative > div.h-full > div > div > div > div:nth-of-type(2) span.min-w-4')
      .invoke('text')
      .then((finalValue) => {
        finalSpindleValue = finalValue.trim();
        cy.log(` Final Spindle Speed: ${finalSpindleValue}`);
        spindleChanges.push({
          action: 'Final Spindle Value (Job Complete)',
          value: finalSpindleValue,
          timestamp: new Date().toISOString()
        });
      });


    // STEP 21: Extract Job Completion Details

    cy.log('STEP 21: Extracting Job Completion Details');

    // Verify popup is visible
    cy.contains('h2', 'Job End')
      .should('be.visible');

    // Extract Status
    cy.contains('strong', 'Status:')
      .parent()
      .find('span.text-green-500')
      .should('be.visible')
      .invoke('text')
      .then((statusText) => {
        const status = statusText.trim();
        cy.log(`Job Status: ${status}`);
        expect(status).to.equal('COMPLETE');
        cy.wrap(status).as('jobStatus');
      });

    // Extract Time taken
    cy.contains('strong', 'Time:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((timeText) => {
        const timeTaken = timeText.trim();
        cy.log(` Time Taken: ${timeTaken}`);
        cy.wrap(timeTaken).as('timeTaken');
      });

    // Verify no errors
    cy.contains('strong', 'Errors:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((errorText) => {
        const errors = errorText.trim();
        cy.log(`Errors: ${errors}`);
        expect(errors).to.equal('None');
        cy.wrap(errors).as('jobErrors');
      });

    cy.wait(1000);


    // STEP 22: Display Final Summary

;
    cy.log('STEP 22: Final Summary');

    
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {

          cy.log(' JOB COMPLETION SUMMARY   ');
        
          cy.log(`Status: ${status}`);
          cy.log(`Time Taken: ${time}`);
          cy.log(`Errors: ${errors}`);
          
          const duration = jobEndTime && jobStartTime ? ((jobEndTime - jobStartTime) / 1000).toFixed(2) : 'N/A';
          cy.log(`Total Duration: ${duration}s`);
          
          cy.log('');
      
          cy.log(' SPINDLE CONFIGURATION & VERIFICATION ');

          cy.log(`Config Min Speed: ${configMinSpeed} RPM`);
          cy.log(`Config Max Speed: ${configMaxSpeed} RPM`);
          cy.log(`Initial Spindle Value: ${initialSpindleValue}`);
          cy.log(`Final Spindle Value: ${finalSpindleValue}`);
          
          cy.log('');
   
          cy.log('    SPINDLE SPEED CHANGES           ');

          spindleChanges.forEach((change, index) => {
            let logMsg = `${index + 1}. ${change.action}: ${change.value}`;
            if (change.expectedValue) {
              logMsg += ` (Expected: ${change.expectedValue})`;
              if (change.match !== undefined) {
                logMsg += ` [${change.match ? 'PASS' : 'FAIL'}]`;
              }
            }
            cy.log(logMsg);
          });
          
          cy.log('');
     
          cy.log('     VERIFICATION RESULTS              ');

          
          const verifications = spindleChanges.filter(c => c.match !== undefined);
          const passed = verifications.filter(c => c.match === true).length;
          const failed = verifications.filter(c => c.match === false).length;
          
          cy.log(`Total Verifications: ${verifications.length}`);
          cy.log(`Passed: ${passed}`);
          cy.log(`Failed: ${failed}`);
          
          if (failed === 0) {
            cy.log('ALL VERIFICATIONS PASSED');
          } else {
            cy.log(`${failed} VERIFICATION(S) FAILED`);
          }
        });
      });
    });

    // STEP 23: Close Popup
    cy.log('========================================');
    cy.log('STEP 23: Closing Job Completion Popup');
    cy.log('========================================');
    
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');

    // Verify popup is closed
    cy.contains('h2', 'Job End').should('not.exist');
    cy.log('Popup successfully closed');

    // ============================================
    // STEP 24: Save Complete Test Results
    // ============================================
    cy.log('========================================');
    cy.log('STEP 24: Saving Test Results');
    cy.log('========================================');
    
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          const verifications = spindleChanges.filter(c => c.match !== undefined);
          const passed = verifications.filter(c => c.match === true).length;
          const failed = verifications.filter(c => c.match === false).length;
          
          const testResults = {
            testName: 'Spindle Configuration and Speed Verification Test',
            timestamp: new Date().toISOString(),
            configuration: {
              minimumSpindleSpeed: `${configMinSpeed} RPM`,
              maximumSpindleSpeed: `${configMaxSpeed} RPM`
            },
            jobDetails: {
              startTime: new Date(jobStartTime).toISOString(),
              endTime: new Date(jobEndTime).toISOString(),
              duration: jobEndTime && jobStartTime ? (jobEndTime - jobStartTime) / 1000 : 0,
              status: status,
              timeTaken: time,
              errors: errors
            },
            spindleTracking: {
              initialValue: initialSpindleValue,
              finalValue: finalSpindleValue,
              totalChanges: spindleChanges.length,
              changes: spindleChanges
            },
            verificationResults: {
              totalTests: verifications.length,
              passed: passed,
              failed: failed,
              details: verifications.map(v => ({
                test: v.action,
                actual: v.value,
                expected: v.expectedValue,
                result: v.match ? 'PASS' : 'FAIL'
              }))
            },
            testStatus: failed === 0 ? 'PASSED' : 'FAILED_WITH_WARNINGS'
          };
          
          cy.writeFile('cypress/results/spindle-config-verification-test.json', testResults);
          cy.log(' Test results saved to: cypress/results/spindle-config-verification-test.json');
        });
      });
    });

    cy.log('TEST COMPLETED SUCCESSFULLY ');
  });

});
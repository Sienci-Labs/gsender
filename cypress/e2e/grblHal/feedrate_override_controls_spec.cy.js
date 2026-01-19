describe('Feedrate Performance Comparison Test', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Should compare job completion times with different feedrates', () => {

    // Step 1: Connect to CNC Machine
    cy.log('Step 1: Connecting to CNC Machine');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();

    // Verify machine status is Idle
    cy.log('Verifying machine status is Idle...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });
    cy.wait(2000);

    // Step 2: Upload G-code File
    cy.log('Step 2: Uploading G-code File');
    cy.uploadGcodeFile();
    cy.wait(2000);
    cy.log('File uploaded successfully');

    // FIRST JOB RUN - REDUCED FEEDRATE
    cy.log('');
    cy.log('FIRST JOB RUN - REDUCED FEEDRATE');
    cy.log('');

    // Step 3: Start First Job
    cy.log('Step 3: Starting First Job');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    
    cy.log('First job started');
    cy.wait(2000);

    // Verify job is running
    cy.log('Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status: "${status.text().trim()}"`);
      });
    cy.wait(2000);

    // Step 4: Capture initial feedrate
    cy.log('Step 4: Capturing Initial Feedrate');
    cy.get('span.w-12')
      .contains(/\d+%/)
      .invoke('text')
      .then((initialFeedrate) => {
        cy.log(`Initial Feedrate: ${initialFeedrate}`);
        cy.wrap(initialFeedrate).as('firstJobInitialFeedrate');
      });

    // Step 5: Click Minus Button 5 Times
    cy.log('Step 5: Decreasing Feedrate - Clicking Minus 5 Times');
    for (let i = 0; i < 5; i++) {
      cy.get('div.relative > div.h-full > div > div > div > div > div.gap-2 > div:nth-of-type(2) svg')
        .should('be.visible')
        .click({ force: true });
      cy.wait(500);
      cy.log(`Minus click ${i + 1}/5`);
    }

    // Wait for acceleration/deceleration to apply
    cy.log('Waiting for feedrate change to apply (acceleration/deceleration)...');
    cy.wait(3000);

    // Record feedrate after decrease
    cy.get('span.w-12')
      .contains(/\d+%/)
      .invoke('text')
      .then((reducedFeedrate) => {
        cy.log(`Feedrate after 5 minus clicks: ${reducedFeedrate}`);
        cy.wrap(reducedFeedrate).as('firstJobFeedrate');
      });

    cy.wait(1000);

    // Step 6: Wait for First Job to Complete
    cy.log('Step 6: Waiting for First Job to Complete');
    cy.contains(/^Idle$/i, { timeout: 300000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}" - First job completed`);
      });
    cy.wait(2000);

    // Step 7: Extract job details from popup
    cy.log('Step 7: Extracting First Job Details from Popup');
    
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
        cy.log(`First Job Status: ${status}`);
        expect(status).to.equal('COMPLETE');
        cy.wrap(status).as('firstJobStatus');
      });

    // Extract Time taken from popup
    cy.contains('strong', 'Time:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((timeText) => {
        const timeTaken = timeText.trim();
        cy.log(`FIRST JOB TIME TAKEN: ${timeTaken}`);
        cy.wrap(timeTaken).as('firstJobTime');
      });

    // Verify no errors
    cy.contains('strong', 'Errors:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((errorText) => {
        const errors = errorText.trim();
        cy.log(`First Job Errors: ${errors}`);
        expect(errors).to.equal('None');
      });

    cy.wait(1000);

    // Close popup after first job completion
    cy.log('Closing first job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');

    // Verify popup is closed
    cy.contains('h2', 'Job End').should('not.exist');

    cy.wait(2000);

    // SECOND JOB RUN - INCREASED FEEDRATE
    cy.log('');
    cy.log('SECOND JOB RUN - INCREASED FEEDRATE');
    cy.log('');

    // Step 8: Start Second Job
    cy.log('Step 8: Starting Second Job');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    
    cy.log('Second job started');
    cy.wait(2000);

    // Verify job is running
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible');
    cy.wait(2000);

    // Capture initial feedrate for second job
    cy.log('Capturing initial feedrate for second job...');
    cy.get('span.w-12')
      .contains(/\d+%/)
      .invoke('text')
      .then((initialFeedrate) => {
        cy.log(`Initial Feedrate: ${initialFeedrate}`);
        cy.wrap(initialFeedrate).as('secondJobInitialFeedrate');
      });

    // Step 9: Click Plus Button 5 Times
    cy.log('Step 9: Increasing Feedrate - Clicking Plus 5 Times');
    for (let i = 0; i < 5; i++) {
      cy.get('div.relative > div.h-full div.gap-2 > div:nth-of-type(3) svg')
        .should('be.visible')
        .click({ force: true });
      cy.wait(500);
      cy.log(`Plus click ${i + 1}/5`);
    }

    // Wait for acceleration/deceleration to apply
    cy.log('Waiting for feedrate change to apply (acceleration/deceleration)...');
    cy.wait(3000);

    // Record feedrate after increase
    cy.get('span.w-12')
      .contains(/\d+%/)
      .invoke('text')
      .then((increasedFeedrate) => {
        cy.log(`Feedrate after 5 plus clicks: ${increasedFeedrate}`);
        cy.wrap(increasedFeedrate).as('secondJobFeedrate');
      });

    cy.wait(1000);

    // Step 10: Wait for Second Job to Complete
    cy.log('Step 10: Waiting for Second Job to Complete');
    cy.contains(/^Idle$/i, { timeout: 300000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}" - Second job completed`);
      });
    cy.wait(2000);

    // Step 11: Extract second job details from popup
    cy.log('Step 11: Extracting Second Job Details from Popup');
    
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
        cy.log(`Second Job Status: ${status}`);
        expect(status).to.equal('COMPLETE');
        cy.wrap(status).as('secondJobStatus');
      });

    // Extract Time taken from popup
    cy.contains('strong', 'Time:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((timeText) => {
        const timeTaken = timeText.trim();
        cy.log(`SECOND JOB TIME TAKEN: ${timeTaken}`);
        cy.wrap(timeTaken).as('secondJobTime');
      });

    // Verify no errors
    cy.contains('strong', 'Errors:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((errorText) => {
        const errors = errorText.trim();
        cy.log(`Second Job Errors: ${errors}`);
        expect(errors).to.equal('None');
      });

    cy.wait(1000);

    // Close popup after second job completion
    cy.log('Closing second job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');

    // Verify popup is closed
    cy.contains('h2', 'Job End').should('not.exist');

    // FINAL COMPARISON AND CONCLUSION
    cy.log('');
    cy.log('FEEDRATE PERFORMANCE ANALYSIS');
    cy.log('');

    // Helper function to parse time string in HH:MM:SS format
    function parseTimeToSeconds(timeStr) {
      cy.log(`Parsing time string: "${timeStr}"`);
      
      let totalSeconds = 0;
      
      // Handle HH:MM:SS or MM:SS format
      if (timeStr.includes(':')) {
        const parts = timeStr.split(':').map(p => parseInt(p.trim()));
        
        if (parts.length === 3) {
          // HH:MM:SS format
          totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          cy.log(`Parsed as HH:MM:SS: ${parts[0]}h ${parts[1]}m ${parts[2]}s`);
        } else if (parts.length === 2) {
          // MM:SS format
          totalSeconds = parts[0] * 60 + parts[1];
          cy.log(`Parsed as MM:SS: ${parts[0]}m ${parts[1]}s`);
        }
      } 
      // Fallback: Try format "1m 23s" or "45s"
      else {
        const minuteMatch = timeStr.match(/(\d+)\s*m/i);
        const secondMatch = timeStr.match(/(\d+)\s*s/i);
        
        if (minuteMatch) totalSeconds += parseInt(minuteMatch[1]) * 60;
        if (secondMatch) totalSeconds += parseInt(secondMatch[1]);
      }
      
      if (totalSeconds === 0) {
        cy.log(`WARNING: Could not parse time from "${timeStr}"`);
      } else {
        cy.log(`Total seconds: ${totalSeconds}`);
      }
      
      return totalSeconds;
    }

    cy.get('@firstJobInitialFeedrate').then((firstInitial) => {
      cy.get('@firstJobFeedrate').then((firstFeedrate) => {
        cy.get('@firstJobTime').then((firstTime) => {
          cy.get('@secondJobInitialFeedrate').then((secondInitial) => {
            cy.get('@secondJobFeedrate').then((secondFeedrate) => {
              cy.get('@secondJobTime').then((secondTime) => {
                
                const firstSeconds = parseTimeToSeconds(firstTime);
                const secondSeconds = parseTimeToSeconds(secondTime);
                
                // Validate parsing
                if (firstSeconds === 0 || secondSeconds === 0) {
                  cy.log('ERROR: Failed to parse time values');
                  cy.log(`First job time: "${firstTime}" -> ${firstSeconds}s`);
                  cy.log(`Second job time: "${secondTime}" -> ${secondSeconds}s`);
                  return;
                }
                
                const timeDifference = Math.abs(firstSeconds - secondSeconds);
                const percentageDiff = ((timeDifference / Math.max(firstSeconds, secondSeconds)) * 100).toFixed(2);
                
                // Format time difference
                const diffHours = Math.floor(timeDifference / 3600);
                const diffMin = Math.floor((timeDifference % 3600) / 60);
                const diffSec = timeDifference % 60;
                
                let timeDiffStr = '';
                if (diffHours > 0) timeDiffStr += `${diffHours}h `;
                if (diffMin > 0) timeDiffStr += `${diffMin}m `;
                timeDiffStr += `${diffSec}s`;
                
                cy.log('');
                cy.log('FIRST JOB (Reduced Feedrate):');
                cy.log(`  Initial Feedrate: ${firstInitial}`);
                cy.log(`  Final Feedrate: ${firstFeedrate}`);
                cy.log(`  Time Taken: ${firstTime} (${firstSeconds} seconds)`);
                cy.log('');
                cy.log('SECOND JOB (Increased Feedrate):');
                cy.log(`  Initial Feedrate: ${secondInitial}`);
                cy.log(`  Final Feedrate: ${secondFeedrate}`);
                cy.log(`  Time Taken: ${secondTime} (${secondSeconds} seconds)`);
                cy.log('');
                cy.log('TIME DIFFERENCE:');
                cy.log(`  ${timeDiffStr}`);
                cy.log(`  Percentage difference: ${percentageDiff}%`);
                cy.log('');
                
                // Determine which job completed first
                if (secondSeconds < firstSeconds) {
                  cy.log('CONCLUSION:');
                  cy.log('SECOND JOB COMPLETED FIRST (Higher Feedrate)');
                  cy.log(`  Feedrate: ${secondFeedrate}`);
                  cy.log(`  Time: ${secondTime}`);
                  cy.log(`  Faster by: ${timeDiffStr} (${percentageDiff}% improvement)`);
                } else if (firstSeconds < secondSeconds) {
                  cy.log('CONCLUSION:');
                  cy.log('FIRST JOB COMPLETED FIRST (Lower Feedrate)');
                  cy.log(`  Feedrate: ${firstFeedrate}`);
                  cy.log(`  Time: ${firstTime}`);
                  cy.log(`  Slower by: ${timeDiffStr} (${percentageDiff}% slower)`);
                  cy.log('  Note: This is unexpected - higher feedrate should be faster');
                } else {
                  cy.log('CONCLUSION:');
                  cy.log('Both jobs completed in exactly the same time');
                }
                
                cy.log('');
                cy.log('Feedrate performance comparison test completed successfully');
                
                // Save comparison results to file
                const comparisonResults = {
                  testName: 'Feedrate Performance Comparison',
                  timestamp: new Date().toISOString(),
                  firstJob: {
                    initialFeedrate: firstInitial,
                    finalFeedrate: firstFeedrate,
                    timeTaken: firstTime,
                    timeInSeconds: firstSeconds
                  },
                  secondJob: {
                    initialFeedrate: secondInitial,
                    finalFeedrate: secondFeedrate,
                    timeTaken: secondTime,
                    timeInSeconds: secondSeconds
                  },
                  comparison: {
                    timeDifferenceSeconds: timeDifference,
                    timeDifference: timeDiffStr,
                    percentageDifference: percentageDiff + '%',
                    fasterJob: secondSeconds < firstSeconds ? 'Second Job (Higher Feedrate)' : 
                              firstSeconds < secondSeconds ? 'First Job (Lower Feedrate)' : 'Tie',
                    conclusion: secondSeconds < firstSeconds 
                      ? 'Higher feedrate resulted in faster completion as expected' 
                      : firstSeconds < secondSeconds
                      ? 'Unexpected result - lower feedrate was faster'
                      : 'Both jobs took the same time'
                  }
                };
                
                cy.writeFile('cypress/results/feedrate-comparison.json', comparisonResults);
                cy.log('Comparison results saved to: cypress/results/feedrate-comparison.json');
              });
            });
          });
        });
      });
    });

  });

});
describe('Job Run with Bit Position and Line Processing Tracking in grblHal', () => {

  // Ignore known hydration-related UI errors and undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false; // ignore these exceptions
    }
    return true;
  });

  beforeEach(() => {
    cy.viewport(1280, 800);
    
    // Use custom loadUI command
    cy.loadUI('http://localhost:8000/#/', {
      maxRetries: 3,
      waitTime: 2000,
      timeout: 20000
    });
  });

  it('Test Case: Track Bit Position and Line Processing During Job Run', () => {

    // Initialize tracking arrays
    const positionLog = [];
    const lineProcessingLog = [];
    let jobStartTime = null;
    let jobEndTime = null;

    // Helper function to capture current position
    const capturePosition = (label) => {
      return cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
        .then(($inputs) => {
          const position = {
            label,
            x: parseFloat($inputs.eq(0).val()) || 0,
            y: parseFloat($inputs.eq(1).val()) || 0,
            z: parseFloat($inputs.eq(2).val()) || 0,
            timestamp: Date.now()
          };
          positionLog.push(position);
          cy.log(`[${label}] Position: X=${position.x}, Y=${position.y}, Z=${position.z}`);
          return cy.wrap(position);
        });
    };

    // Helper function to capture line processing status
    const captureLineProcessing = (label) => {
      return cy.window().then((win) => {
        try {
          const store = win.reduxStore || win.store;
          if (store) {
            const state = store.getState();
            const senderStatus = state.controller?.sender?.status;
            
            if (senderStatus) {
              const lineStatus = {
                label,
                sent: senderStatus.sent || 0,
                received: senderStatus.received || 0,
                total: senderStatus.total || 0,
                currentLine: senderStatus.currentLineRunning || 0,
                timestamp: Date.now()
              };
              lineProcessingLog.push(lineStatus);
              
              const percentComplete = lineStatus.total > 0 
                ? ((lineStatus.received / lineStatus.total) * 100).toFixed(1)
                : 0;
              
              cy.log(`[${label}] Lines: ${lineStatus.received}/${lineStatus.total} (${percentComplete}%) | Current: Line ${lineStatus.currentLine}`);
              return cy.wrap(lineStatus);
            }
          }
        } catch (error) {
          cy.log(`Unable to capture line status: ${error.message}`);
        }
        return cy.wrap(null);
      });
    };

    // Helper function to capture both position and line processing
    const captureSnapshot = (label) => {
      cy.log(`--- Snapshot: ${label} ---`);
      capturePosition(label);
      captureLineProcessing(label);
    };

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });
    cy.wait(2000);

    // Step 3: Enable homing using custom cypress command 
    cy.log('Step 3: Performing axis homing...');
    cy.enableAxisHomingAndHome();
    cy.unlockMachineIfNeeded();
    cy.log("All axes homed");
    
    // Click on Toggle button to disable axis homing now
    cy.log('Disabling homing toggle button...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button')
      .click();
    cy.wait(1000);
    
    cy.log("Zeroing all axes");
    cy.zeroAllAxes();
    cy.log("All axes are zero");
    
    captureSnapshot('After Homing & Zero');

    // Step 4: Go to specific location
    cy.log('Step 4: Moving to position (300, 100, -50)...');
    cy.goToLocation(300, 100, -50);
    cy.log('Machine is at location (300, 100, -50)');
    
    captureSnapshot('After Movement to (300, 100, -50)');

    // Zeroing all the axes 
    cy.log('Zeroing all axes at new location...');
    cy.zeroAllAxes();
    cy.log('All axes zeroed');
    
    captureSnapshot('After Zero at New Location');
    
    // Step 5: Upload File using custom command
    cy.log('Step 5: Uploading G-code file...');
    cy.uploadGcodeFile();
    cy.log('File Uploaded');
    cy.wait(2000);
    
    captureSnapshot('After File Upload');
    
    // Step 6: Starting Job
    cy.log('Step 6: Starting Job...');
    
    cy.then(() => {
      jobStartTime = Date.now();
      cy.log(`Job Start Time: ${new Date(jobStartTime).toISOString()}`);
    });
    
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    // Step 7: Verify job is running
    cy.log('Step 7: Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status: "${status.text().trim()}"`);
      });
    
    captureSnapshot('Job Running - Initial');

    // Step 8: Monitor bit position and line processing during job
    cy.log('Step 8: Monitoring Bit Position and Line Processing...');
    
    // Take snapshots every 3 seconds for the duration of the job
    // We'll check up to 40 times (120 seconds max)
    const monitorJob = (iteration = 1, maxIterations = 40) => {
      if (iteration > maxIterations) {
        cy.log('Max monitoring iterations reached');
        return;
      }
      
      cy.wait(3000);
      
      // Check if job is still running
      cy.get('body').then($body => {
        const bodyText = $body.text();
        const isRunning = bodyText.match(/running|run/i) && !bodyText.match(/^Idle$/i);
        
        if (isRunning) {
          captureSnapshot(`Job Running - ${iteration * 3}s`);
          
          // Continue monitoring
          monitorJob(iteration + 1, maxIterations);
        } else {
          cy.log(`Job completed at ${iteration * 3} seconds`);
          captureSnapshot('Job Completed - Final Position');
        }
      });
    };
    
    // Start monitoring
    monitorJob();

    // Step 9: Wait for job completion
    cy.log('Step 9: Waiting for job completion...');
    cy.contains(/^Idle$/i, { timeout: 120000 })
      .should('be.visible')
      .then(status => {
        jobEndTime = Date.now();
        cy.log(`Job completed. Status: "${status.text().trim()}"`);
        cy.log(`Job End Time: ${new Date(jobEndTime).toISOString()}`);
        cy.log(`Total Job Duration: ${((jobEndTime - jobStartTime) / 1000).toFixed(2)}s`);
      });
    cy.wait(3000);
    
    captureSnapshot('After Job Completion');

    // Step 10: Extract and verify job completion details from popup;
    cy.log('Step 10: Extracting job completion details...');
    
    // Verify popup is visible
    cy.contains('h2', 'Job End')
      .should('be.visible');

    // Extract Status (COMPLETE)
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
        cy.log(`Time Taken: ${timeTaken}`);
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

    // Step 11: Analyze Position Changes
    cy.log('Step 11: Analyzing Bit Position Changes...');
    
    cy.wrap(positionLog).then((log) => {
      cy.log('POSITION TRACKING SUMMARY');
      cy.log(`Total position snapshots: ${log.length}`);
      
      // Find job start and end positions
      const jobStartPos = log.find(p => p.label === 'Job Running - Initial');
      const jobEndPos = log.find(p => p.label === 'After Job Completion');
      
      if (jobStartPos && jobEndPos) {
        const totalDistance = Math.sqrt(
          Math.pow(jobEndPos.x - jobStartPos.x, 2) +
          Math.pow(jobEndPos.y - jobStartPos.y, 2) +
          Math.pow(jobEndPos.z - jobStartPos.z, 2)
        );
        
        cy.log(`Start Position: X=${jobStartPos.x}, Y=${jobStartPos.y}, Z=${jobStartPos.z}`);
        cy.log(`End Position: X=${jobEndPos.x}, Y=${jobEndPos.y}, Z=${jobEndPos.z}`);
        cy.log(`Total Distance Traveled: ${totalDistance.toFixed(3)}mm`);
      }
      
      // Calculate movement statistics
      let totalMovement = 0;
      let maxSpeed = 0;
      
      for (let i = 1; i < log.length; i++) {
        const prev = log[i - 1];
        const curr = log[i];
        
        const distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) +
          Math.pow(curr.y - prev.y, 2) +
          Math.pow(curr.z - prev.z, 2)
        );
        
        const timeDelta = (curr.timestamp - prev.timestamp) / 1000; // seconds
        const speed = timeDelta > 0 ? distance / timeDelta : 0;
        
        totalMovement += distance;
        maxSpeed = Math.max(maxSpeed, speed);
        
        if (distance > 0.1) { // Only log significant movements
          cy.log(`${prev.label} → ${curr.label}:`);
          cy.log(`Distance: ${distance.toFixed(3)}mm over ${timeDelta.toFixed(1)}s`);
          cy.log(`Speed: ${speed.toFixed(2)}mm/s`);
        }
      }
      
      cy.log('MOVEMENT STATISTICS');
      cy.log(`Total Movement: ${totalMovement.toFixed(3)}mm`);
      cy.log(`Max Speed: ${maxSpeed.toFixed(2)}mm/s`);
      cy.log(`Average Position Updates: ${(log.length / ((jobEndTime - jobStartTime) / 1000)).toFixed(2)} per second`);
    });

    // Step 12: Analyze Line Processing
    cy.log('Step 12: Analyzing Line Processing...');
    
    cy.wrap(lineProcessingLog).then((log) => {
      cy.log('LINE PROCESSING SUMMARY');
      cy.log(`Total line processing snapshots: ${log.length}`);
      
      if (log.length > 0) {
        const firstSnapshot = log[0];
        const lastSnapshot = log[log.length - 1];
        
        cy.log(`Total Lines in File: ${lastSnapshot.total}`);
        cy.log(`Lines Processed: ${lastSnapshot.received}`);
        cy.log(`Processing Rate: ${(lastSnapshot.received / ((lastSnapshot.timestamp - firstSnapshot.timestamp) / 1000)).toFixed(2)} lines/second`);
        
        // Show progression
        cy.log('PROCESSING PROGRESSION');
        log.forEach((snapshot, index) => {
          if (index % 3 === 0 || index === log.length - 1) { // Show every 3rd snapshot
            const percentComplete = snapshot.total > 0 
              ? ((snapshot.received / snapshot.total) * 100).toFixed(1)
              : 0;
            cy.log(`${snapshot.label}: ${percentComplete}% complete (${snapshot.received}/${snapshot.total} lines)`);
          }
        });
        
        // Verify all lines were processed
        if (lastSnapshot.received === lastSnapshot.total) {
          cy.log('All lines processed successfully');
        } else {
          cy.log(`Lines processed: ${lastSnapshot.received}/${lastSnapshot.total}`);
        }
      } else {
        cy.log('No line processing data captured');
      }
    });

    // Step 13: Display final summary
    cy.log('Step 13: Final Job Summary...');
    
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('JOB COMPLETION SUMMARY');
          cy.log(`Status: ${status}`);
          cy.log(`Time Taken: ${time}`);
          cy.log(`Errors: ${errors}`);
          cy.log(`Position Snapshots: ${positionLog.length}`);
          cy.log(`Line Processing Snapshots: ${lineProcessingLog.length}`);
        });
      });
    });

    // Step 14: Close the job completion popup
    cy.log('Step 14: Closing job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log(' Popup closed');

    // Step 15: Verify popup is closed
    cy.log('Step 15: Verifying popup is closed...');
    cy.contains('h2', 'Job End').should('not.exist');
    cy.log(' Popup successfully closed');

    // Step 16: Return to home position
    cy.log('Step 16: Returning to home position...');
    cy.ensureHomingEnabledAndHome();
    cy.log('Returned to home position');
    
    captureSnapshot('Final - After Homing');

    // Step 17: Save data to files
    cy.log('Step 17: Saving test data...');
    
    cy.wrap(positionLog).then((log) => {
      cy.writeFile('cypress/results/job-position-log.json', log);
      cy.log('Position log saved to: cypress/results/job-position-log.json');
    });
    
    cy.wrap(lineProcessingLog).then((log) => {
      cy.writeFile('cypress/results/job-line-processing-log.json', log);
      cy.log(' Line processing log saved to: cypress/results/job-line-processing-log.json');
    });
    
    // Create combined report
    cy.then(() => {
      const report = {
        testName: 'Job Run with Position and Line Tracking',
        timestamp: new Date().toISOString(),
        jobDuration: jobEndTime && jobStartTime ? (jobEndTime - jobStartTime) / 1000 : 0,
        positionSnapshots: positionLog.length,
        lineProcessingSnapshots: lineProcessingLog.length,
        positionData: positionLog,
        lineProcessingData: lineProcessingLog
      };
      
      cy.writeFile('cypress/results/job-run-complete-report.json', report);
      cy.log('Complete report saved to: cypress/results/job-run-complete-report.json');
    });

    cy.log(' JOB RUN WITH POSITION & LINE TRACKING TEST COMPLETED');

  });

});
``
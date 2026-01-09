describe('Outline + Job Run with Complete Bit Position and Line Processing Tracking', () => {

  beforeEach(() => {
    cy.viewport(1280, 800);
    
    // Use custom loadUI command
    cy.loadUI('http://localhost:8000/#/', {
      maxRetries: 3,
      waitTime: 2000,
      timeout: 20000
    });
  });

  it('Test Case: Outline Feature + Job Run with Position and Line Tracking', () => {

    // Initialize tracking arrays
    const outlinePositionLog = [];
    const jobPositionLog = [];
    const lineProcessingLog = [];
    let outlineStartTime = null;
    let outlineEndTime = null;
    let jobStartTime = null;
    let jobEndTime = null;

    // Helper function to capture current position
    const capturePosition = (label, logArray) => {
      return cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
        .then(($inputs) => {
          const position = {
            label,
            x: parseFloat($inputs.eq(0).val()) || 0,
            y: parseFloat($inputs.eq(1).val()) || 0,
            z: parseFloat($inputs.eq(2).val()) || 0,
            timestamp: Date.now()
          };
          logArray.push(position);
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

    // Helper function to capture both position and line processing for job
    const captureJobSnapshot = (label) => {
      cy.log(`--- Job Snapshot: ${label} ---`);
      capturePosition(label, jobPositionLog);
      captureLineProcessing(label);
    };
    // PART 1: OUTLINE OPERATION
    cy.log('PART 1: OUTLINE FEATURE TEST');

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    cy.unlockMachineIfNeeded();

    // Step 2: Verify machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });
    cy.wait(2000);

    // Step 3: Enable homing and perform homing operation
    cy.log('Step 3: Performing axis homing...');
    cy.enableAxisHomingAndHome();
    cy.unlockMachineIfNeeded();
    cy.log('All axes are now homed');
    
    // Disable axis homing toggle
    cy.log('Disabling homing toggle button...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button')
      .click();
    cy.wait(1000);
    
    // Zero all axes after homing
    cy.log('Zeroing all axes after homing...');
    cy.zeroAllAxes();
    cy.log('All axes are zero');
    
    capturePosition('After Homing & Zero', outlinePositionLog);

    // Step 4: Go to specific location
    cy.log('Step 4: Moving to position (300, 100, -50)...');
    cy.goToLocation(300, 100, -50);
    cy.log('Machine is at location (300, 100, -50)');
    
    capturePosition('After Movement to (300, 100, -50)', outlinePositionLog);

    // Step 5: Zero all axes at the new location
    cy.log('Step 5: Zeroing all axes at new location...');
    cy.zeroAllAxes();
    cy.log('All axes zeroed at (300, 100, -50)');
    cy.wait(2000);
    
    capturePosition('After Zero at New Location', outlinePositionLog);

    // Step 6: Upload G-code file
    cy.log('Step 6: Uploading G-code file...');
    cy.uploadGcodeFile();
    cy.log('File uploaded successfully');
    cy.wait(3000);
    
    capturePosition('Before Outline Operation', outlinePositionLog);

    // Step 7: Start Outline Operation
    cy.log('Step 7: Starting Outline Operation...');
    
    cy.then(() => {
      outlineStartTime = Date.now();
      cy.log(`Outline Start Time: ${new Date(outlineStartTime).toISOString()}`);
    });
    
    cy.get('div.bg-transparent > div > div:nth-of-type(1) > button')
      .should('be.visible')
      .and('contain.text', 'Outline')
      .click({ force: true });
    
    cy.log('Outline button clicked');
    cy.wait(2000);
    
    capturePosition('Outline Start', outlinePositionLog);

    // Step 8: Monitor bit position during outline
    cy.log('Step 8: Tracking Bit Position During Outline...');
    
    cy.get('body').then($body => {
      const runningText = $body.text();
      if (runningText.match(/run|running|jog/i)) {
        cy.log('Outline operation detected as running');
        
        // Track position every 1 second for up to 10 seconds
        for (let i = 1; i <= 10; i++) {
          cy.wait(1000);
          capturePosition(`During Outline - ${i}s`, outlinePositionLog);
          
          cy.get('body').then($body => {
            const currentText = $body.text();
            if (!currentText.match(/run|running|jog/i)) {
              cy.log('Outline completed, stopping position tracking');
              return false;
            }
          });
        }
      } else {
        cy.log('Outline operation may have completed very quickly');
        capturePosition('Outline Immediate Complete', outlinePositionLog);
      }
    });

    // Step 9: Wait for machine to be idle after outline
    cy.log('Step 9: Waiting for machine to return to Idle...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        outlineEndTime = Date.now();
        cy.log(`Machine status: "${status.text().trim()}"`);
        cy.log(`Outline End Time: ${new Date(outlineEndTime).toISOString()}`);
        cy.log(`Outline Duration: ${((outlineEndTime - outlineStartTime) / 1000).toFixed(2)}s`);
      });
    cy.wait(2000);
    
    capturePosition('After Outline Complete', outlinePositionLog);

    // Step 10: Verify return to starting position
    cy.log('Step 10: Verifying Return to Start Position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .then(($inputs) => {
        const finalX = parseFloat($inputs.eq(0).val());
        const finalY = parseFloat($inputs.eq(1).val());
        const finalZ = parseFloat($inputs.eq(2).val());
        
        cy.log(`Position after Outline: X=${finalX}, Y=${finalY}, Z=${finalZ}`);
        
        const tolerance = 0.1;
        const xMatch = Math.abs(finalX - 0) < tolerance;
        const yMatch = Math.abs(finalY - 0) < tolerance;
        const zMatch = Math.abs(finalZ - 0) < tolerance;
        
        if (xMatch && yMatch && zMatch) {
          cy.log('Machine returned to starting position (0, 0, 0)');
        } else {
          cy.log(`Machine position: X=${finalX}, Y=${finalY}, Z=${finalZ} (Expected: 0, 0, 0)`);
        }
      });

    // PART 2: JOB RUN WITH TRACKING
    cy.log('PART 2: JOB RUN WITH POSITION & LINE TRACKING');

    // Step 11: Verify machine is still at zero
    cy.log('Step 11: Verifying machine ready for job...');
    capturePosition('Before Job Start', jobPositionLog);
    captureLineProcessing('Before Job Start');

    // Step 12: Start the job
    cy.log('Step 12: Starting Job...');
    
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

    // Step 13: Verify job is running
    cy.log('Step 13: Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status: "${status.text().trim()}"`);
      });
    
    captureJobSnapshot('Job Running - Initial');

    // Step 14: Monitor bit position and line processing during job
    cy.log('Step 14: Monitoring Bit Position and Line Processing...');
    
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
          captureJobSnapshot(`Job Running - ${iteration * 3}s`);
          monitorJob(iteration + 1, maxIterations);
        } else {
          cy.log(`Job completed at ${iteration * 3} seconds`);
          captureJobSnapshot('Job Completed - Final Position');
        }
      });
    };
    
    // Start monitoring
    monitorJob();

    // Step 15: Wait for job completion
    cy.log('Step 15: Waiting for job completion...');
    cy.contains(/^Idle$/i, { timeout: 120000 })
      .should('be.visible')
      .then(status => {
        jobEndTime = Date.now();
        cy.log(`Job completed. Status: "${status.text().trim()}"`);
        cy.log(`Job End Time: ${new Date(jobEndTime).toISOString()}`);
        cy.log(`Total Job Duration: ${((jobEndTime - jobStartTime) / 1000).toFixed(2)}s`);
      });
    cy.wait(3000);
    
    captureJobSnapshot('After Job Completion');

    // Step 16: Extract job completion details
    cy.log('Step 16: Extracting Job Completion Details...');
    
    cy.contains('h2', 'Job End').should('be.visible');

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

    cy.contains('strong', 'Time:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((timeText) => {
        const timeTaken = timeText.trim();
        cy.log(`Time Taken: ${timeTaken}`);
        cy.wrap(timeTaken).as('timeTaken');
      });

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

    // ANALYSIS AND REPORTING
    cy.log('COMPREHENSIVE ANALYSIS');

    // Step 17: Analyze Outline Position Changes
    cy.log('Step 17: Analyzing Outline Position Changes...');
    cy.wrap(outlinePositionLog).then((log) => {
      cy.log('OUTLINE POSITION ANALYSIS');
      cy.log(`Total outline snapshots: ${log.length}`);
      
      const outlineStartIndex = log.findIndex(p => p.label === 'Outline Start');
      const outlineEndIndex = log.findIndex(p => p.label === 'After Outline Complete');
      
      if (outlineStartIndex !== -1 && outlineEndIndex !== -1) {
        let totalOutlineMovement = 0;
        for (let i = outlineStartIndex + 1; i <= outlineEndIndex; i++) {
          const prev = log[i - 1];
          const curr = log[i];
          const deltaX = curr.x - prev.x;
          const deltaY = curr.y - prev.y;
          const deltaZ = curr.z - prev.z;
          totalOutlineMovement += Math.sqrt(deltaX**2 + deltaY**2 + deltaZ**2);
        }
        
        cy.log(`Outline Distance Traveled: ${totalOutlineMovement.toFixed(3)}mm`);
        cy.log(`Outline Duration: ${((outlineEndTime - outlineStartTime) / 1000).toFixed(2)}s`);
        
        if (totalOutlineMovement > 1) {
          cy.log('Bit moved during outline operation');
        } else {
          cy.log('Little or no movement detected during outline');
        }
      }
    });

    // Step 18: Analyze Job Position Changes
    cy.log('Step 18: Analyzing Job Position Changes...');
    cy.wrap(jobPositionLog).then((log) => {
      cy.log('JOB POSITION ANALYSIS');
      cy.log(`Total job position snapshots: ${log.length}`);
      
      const jobStartPos = log.find(p => p.label === 'Job Running - Initial');
      const jobEndPos = log.find(p => p.label === 'After Job Completion');
      
      if (jobStartPos && jobEndPos) {
        const totalDistance = Math.sqrt(
          Math.pow(jobEndPos.x - jobStartPos.x, 2) +
          Math.pow(jobEndPos.y - jobStartPos.y, 2) +
          Math.pow(jobEndPos.z - jobStartPos.z, 2)
        );
        
        cy.log(`Job Start Position: X=${jobStartPos.x}, Y=${jobStartPos.y}, Z=${jobStartPos.z}`);
        cy.log(`Job End Position: X=${jobEndPos.x}, Y=${jobEndPos.y}, Z=${jobEndPos.z}`);
        cy.log(`Job Distance Traveled: ${totalDistance.toFixed(3)}mm`);
      }
      
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
        
        const timeDelta = (curr.timestamp - prev.timestamp) / 1000;
        const speed = timeDelta > 0 ? distance / timeDelta : 0;
        
        totalMovement += distance;
        maxSpeed = Math.max(maxSpeed, speed);
      }
      
      cy.log(`Total Job Movement: ${totalMovement.toFixed(3)}mm`);
      cy.log(`Max Speed: ${maxSpeed.toFixed(2)}mm/s`);
      cy.log(`Average Position Updates: ${(log.length / ((jobEndTime - jobStartTime) / 1000)).toFixed(2)} per second`);
    });

    // Step 19: Analyze Line Processing
    cy.log('Step 19: Analyzing Line Processing...');
    cy.wrap(lineProcessingLog).then((log) => {
      cy.log('LINE PROCESSING ANALYSIS');
      cy.log(`Total line processing snapshots: ${log.length}`);
      
      if (log.length > 0) {
        const firstSnapshot = log[0];
        const lastSnapshot = log[log.length - 1];
        
        cy.log(`Total Lines in File: ${lastSnapshot.total}`);
        cy.log(`Lines Processed: ${lastSnapshot.received}`);
        
        if (lastSnapshot.timestamp !== firstSnapshot.timestamp) {
          const processingRate = lastSnapshot.received / ((lastSnapshot.timestamp - firstSnapshot.timestamp) / 1000);
          cy.log(`Processing Rate: ${processingRate.toFixed(2)} lines/second`);
        }
        
        // Show progression at key points
        cy.log('PROCESSING PROGRESSION');
        [0, Math.floor(log.length / 4), Math.floor(log.length / 2), Math.floor(3 * log.length / 4), log.length - 1].forEach(index => {
          const snapshot = log[index];
          if (snapshot) {
            const percentComplete = snapshot.total > 0 
              ? ((snapshot.received / snapshot.total) * 100).toFixed(1)
              : 0;
            cy.log(`${snapshot.label}: ${percentComplete}% complete (${snapshot.received}/${snapshot.total} lines)`);
          }
        });
        
        if (lastSnapshot.received === lastSnapshot.total) {
          cy.log('All lines processed successfully');
        } else {
          cy.log(`Lines processed: ${lastSnapshot.received}/${lastSnapshot.total}`);
        }
      } else {
        cy.log('No line processing data captured');
      }
    });

    // Step 20: Final Summary
    cy.log('Step 20: Final Summary...');
    
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('COMPLETE TEST SUMMARY');
          cy.log('OUTLINE OPERATION:');
          cy.log(`  Duration: ${((outlineEndTime - outlineStartTime) / 1000).toFixed(2)}s`);
          cy.log(`  Position Snapshots: ${outlinePositionLog.length}`);
          cy.log('');
          cy.log('JOB EXECUTION:');
          cy.log(`  Status: ${status}`);
          cy.log(`  Time Taken: ${time}`);
          cy.log(`  Errors: ${errors}`);
          cy.log(`  Position Snapshots: ${jobPositionLog.length}`);
          cy.log(`  Line Processing Snapshots: ${lineProcessingLog.length}`);
          cy.log('');
          cy.log(`  Total Test Duration: ${((jobEndTime - outlineStartTime) / 1000).toFixed(2)}s`);
        });
      });
    });

    // Step 21: Close job completion popup
    cy.log('Step 21: Closing job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');

    cy.contains('h2', 'Job End').should('not.exist');
    cy.log('Popup successfully closed');

    // Step 22: Return to home position
    cy.log('Step 22: Returning to home position...');
    cy.ensureHomingEnabledAndHome();
    cy.log('Returned to home position');

    // Step 23: Save all data
    cy.log('Step 23: Saving Test Data...');
    
    cy.wrap(outlinePositionLog).then((log) => {
      cy.writeFile('cypress/results/outline-position-log.json', log);
      cy.log('Outline position log saved');
    });
    
    cy.wrap(jobPositionLog).then((log) => {
      cy.writeFile('cypress/results/job-position-log.json', log);
      cy.log('Job position log saved');
    });
    
    cy.wrap(lineProcessingLog).then((log) => {
      cy.writeFile('cypress/results/job-line-processing-log.json', log);
      cy.log(' Line processing log saved');
    });
    
    // Create comprehensive report
    cy.then(() => {
      const report = {
        testName: 'Outline + Job Run with Complete Tracking',
        timestamp: new Date().toISOString(),
        outline: {
          startTime: new Date(outlineStartTime).toISOString(),
          endTime: new Date(outlineEndTime).toISOString(),
          duration: (outlineEndTime - outlineStartTime) / 1000,
          positionSnapshots: outlinePositionLog.length,
          positionData: outlinePositionLog
        },
        job: {
          startTime: new Date(jobStartTime).toISOString(),
          endTime: new Date(jobEndTime).toISOString(),
          duration: (jobEndTime - jobStartTime) / 1000,
          positionSnapshots: jobPositionLog.length,
          lineProcessingSnapshots: lineProcessingLog.length,
          positionData: jobPositionLog,
          lineProcessingData: lineProcessingLog
        },
        totalTestDuration: (jobEndTime - outlineStartTime) / 1000
      };
      
      cy.writeFile('cypress/results/complete-outline-job-report.json', report);
      cy.log('Complete report saved to: cypress/results/complete-outline-job-report.json');
    });

    cy.log('OUTLINE + JOB RUN WITH COMPLETE TRACKING TEST COMPLETED');

  });

});
describe('Job Run in grblHal', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 3,
      waitTime: 3000,
      timeout: 120000
    });
  });

  it('Test Case: Homes the machine and start job run after reaching a position', () => {

    let jobStartTime = null;
    let jobEndTime = null;

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
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

    // Step 4: Go to specific location
    cy.log('Step 4: Moving to position (300, 100, -50)...');
    cy.goToLocation(300, 100, -50);
    cy.log('Machine is at location (300, 100, -50)');

    // Step 5: Zero all the axes at new location
    cy.log('Step 5: Zeroing all axes at new location...');
    cy.zeroAllAxes();
    cy.log('All axes zeroed');
    
    // Step 6: Upload File using custom command
    cy.log('Step 6: Uploading G-code file...');
    cy.uploadGcodeFile();
    cy.log('File Uploaded');
    cy.wait(2000);
    
    // Step 7: Starting Job
    cy.log('Step 7: Starting Job...');
    
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

    // Step 8: Verify job is running
    cy.log('Step 8: Verifying job is running...');
    cy.verifyMachineStatus('Runing');

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

    // Step 10: Extract and verify job completion details from popup
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

    // Step 11: Display final summary
    cy.log('Step 11: Final Job Summary...');
    
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('JOB COMPLETION SUMMARY');
          cy.log(`Status: ${status}`);
          cy.log(`Time Taken: ${time}`);
          cy.log(`Errors: ${errors}`);
        });
      });
    });

    // Step 12: Close the job completion popup
    cy.log('Step 12: Closing job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log(' Popup closed');

    // Step 13: Verify popup is closed
    cy.log('Step 13: Verifying popup is closed...');
    cy.contains('h2', 'Job End').should('not.exist');
    cy.log(' Popup successfully closed');

    // Step 14: Return to home position
    cy.log('Step 14: Returning to home position...');
    cy.ensureHomingEnabledAndHome();
    cy.log('Returned to home position');

    cy.log(' JOB RUN TEST COMPLETED');

  });

});
describe('Job Run Test in grblHal without homing', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 3,
      waitTime: 3000,
      timeout: 120000
    });
  });

  it('Test Case: Connect, Upload File, Run Job and Collect Details', () => {

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
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });
    cy.wait(2000);

    // Step 3: Upload File using custom command
    cy.log('Step 3: Uploading G-code file...');
    cy.uploadGcodeFile();
    cy.log('File Uploaded');
    cy.wait(2000);
    
    // Step 4: Starting Job
    cy.log('Step 4: Starting Job...');
    
    cy.then(() => {
      jobStartTime = Date.now();
      cy.log(`Job Start Time: ${new Date(jobStartTime).toISOString()}`);
    });
    
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('✓ Job started');

    // Step 5: Verify job is running
    cy.log('Step 5: Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status: "${status.text().trim()}"`);
      });

    // Step 6: Wait for job completion
    cy.log('Step 6: Waiting for job completion...');
    cy.contains(/^Idle$/i, { timeout: 120000 })
      .should('be.visible')
      .then(status => {
        jobEndTime = Date.now();
        cy.log(`Job completed. Status: "${status.text().trim()}"`);
        cy.log(`Job End Time: ${new Date(jobEndTime).toISOString()}`);
        cy.log(`Total Job Duration: ${((jobEndTime - jobStartTime) / 1000).toFixed(2)}s`);
      });
    cy.wait(3000);

    // Step 7: Extract and verify job completion details from popup
    cy.log('Step 7: Extracting job completion details...');
    
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

    // Step 8: Display final summary
    cy.log('Step 8: Final Job Summary...');
    
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('       JOB COMPLETION SUMMARY       ');
          cy.log(`Status: ${status}`);
          cy.log(`Time Taken: ${time}`);
          cy.log(`Errors: ${errors}`);
          
          const duration = jobEndTime && jobStartTime ? ((jobEndTime - jobStartTime) / 1000).toFixed(2) : 'N/A';
          cy.log(`Total Duration: ${duration}s`);
        });
      });
    });

    // Step 9: Close the job completion popup
    cy.log('Step 9: Closing job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');

    // Step 10: Verify popup is closed
    cy.log('Step 10: Verifying popup is closed...');
    cy.contains('h2', 'Job End').should('not.exist');
    cy.log('Popup successfully closed');

    // Step 11: Save job details to file
    cy.log('Step 11: Saving job details...');
    
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          const jobDetails = {
            testName: 'Simple Job Run Test',
            timestamp: new Date().toISOString(),
            jobStartTime: new Date(jobStartTime).toISOString(),
            jobEndTime: new Date(jobEndTime).toISOString(),
            jobDuration: jobEndTime && jobStartTime ? (jobEndTime - jobStartTime) / 1000 : 0,
            status: status,
            timeTaken: time,
            errors: errors
          };
          
          cy.writeFile('cypress/results/job-run-details.json', jobDetails);
          cy.log('Job details saved to: cypress/results/job-run-details.json');
        });
      });
    });

    cy.log('JOB RUN TEST COMPLETED SUCCESSFULLY');

  });

});
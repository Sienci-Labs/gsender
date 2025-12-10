describe('Job run in grblHal', () => {

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

  it('Test Case: job run', () => {

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
    cy.log('Step 3: perform axis homing...!!!');
    cy.enableAxisHomingAndHome();
    cy.unlockMachineIfNeeded();
    cy.log("All axes homed");
    //Click on Toggle button to disable axis homing now ( because the button now is HX not X) 
      cy.log('Enabling homing toggle button...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button')
    .click();
  cy.wait(1000);
  
    cy.log("Make all axes 0");
    
    cy.zeroAllAxes();
    cy.log("All axes are zero now..!!!")


    // Step 4: Go to specific location to zero axis THESE VALUES CAN VARU ACCORDING TO FILE AND MACHINE 
    cy.log('Step 4: Moving to position (60,-200,-15)...');
    cy.grblHalGoToLocation(300,100, -50);

    cy.log('Machine is in 300,100,-50 location');

    //Zeroing all the axes 
    cy.zeroAllAxes();
    
    // Step 5: Upload File using custom command
    cy.log('Step 5: Uploading G-code file...');
    cy.uploadGcodeFile();
    cy.log('File Uploaded');
    cy.wait(2000);
    
    // Step 6: Starting Job
    cy.log('Step 6: Starting Job...');
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

    // Step 8: Wait for job completion
    cy.log('Step 8: Waiting for job completion...');
    cy.contains(/^Idle$/i, { timeout: 120000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job completed. Status: "${status.text().trim()}"`);
      });
    cy.wait(3000);

    // Step 9: Extract and verify job completion details from popup
    cy.log('Step 9: Extracting job completion details...');
    
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
        
        // Store status for final summary
        cy.wrap(status).as('jobStatus');
      });

    // Extract Time taken - Target the span directly after "Time:" strong tag
    cy.contains('strong', 'Time:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((timeText) => {
        const timeTaken = timeText.trim();
        cy.log(`Time Taken: ${timeTaken}`);
        
        // Store time for final summary
        cy.wrap(timeTaken).as('timeTaken');
      });

    // Verify no errors - Fixed to use .next('span')
    cy.contains('strong', 'Errors:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((errorText) => {
        const errors = errorText.trim();
        cy.log(` Errors: ${errors}`);
        expect(errors).to.equal('None');
        
        // Store errors for final summary
        cy.wrap(errors).as('jobErrors');
      });

    cy.wait(1000);

    // Step 10: Display final summary
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('JOB COMPLETION SUMMARY:');
          cy.log(`Status: ${status}`);
          cy.log(`Time Taken: ${time}`);
          cy.log(`Errors: ${errors}`);
        });
      });
    });

    // Step 11: Close the job completion popup
    cy.log('Step 11: Closing job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');

    // Step 12: Verify popup is closed
    cy.log('Step 12: Verifying popup is closed...');
    cy.contains('h2', 'Job End').should('not.exist');
    cy.log('Popup successfully closed');

    // Step 13: Return to home position
    cy.log('Step 13: Returning to home position...');
    cy.ensureHomingEnabledAndHome();
    cy.log(' Returned to home position');

    cy.log('========================================');
    cy.log(' JOB RUN TEST COMPLETED SUCCESSFULLY');
    cy.log('========================================');

  });

});
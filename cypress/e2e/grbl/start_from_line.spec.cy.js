describe('Start from line ', () => {

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
  cy.viewport(1920, 1080);
  // Use loadUI custom command with dynamic baseUrl
  cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
    maxRetries: 3,
    waitTime: 3000,
    timeout: 5000
  });
});


  it('Test Case: Runs a job, stops and then start from line', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });

    cy.wait(2000);

    // Step 3: Go to location 000 using cypress command
    cy.log('Step 3: Moving to home position (0,0,0)...');
    cy.goToLocation(0, 0, 0);
    cy.log('Machine is in 0,0,0 location');
    
    // Step 4: Upload File using custom command
    cy.log('Step 4: Uploading G-code file...');
    cy.uploadGcodeFile();
    cy.log('File Uploaded');
    cy.wait(2000);
    
    // Step 5: Starting Job
    cy.log('Step 5: Starting Job...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    // Step 6: Wait for 10 seconds and then stop job
    cy.log('Step 6: Waiting 10 seconds before stopping...');
    cy.wait(10000);

    // Step 7: Stop the job (First time)
    cy.log('Step 7: Stopping job (first time)...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(3) > button')
      .contains('Stop')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job stopped');
    
    // Step 8: Close the first popup
    cy.log('Step 8: Closing first job end popup...');
    
    // Verify popup is visible
    cy.contains('h2', 'Job End')
      .should('be.visible');

    cy.wait(2000);
    
    // Close the popup
    cy.get('button')
      .contains('Close')
      .should('be.visible')
      .click({ force: true });
    cy.log('First popup closed');

    cy.wait(1000);

    // Step 9: Click "Start From" button
    cy.log('Step 9: Clicking Start From button...');
    cy.get('div.bg-transparent div:nth-of-type(2) > button')
      .contains('Start From')
      .should('be.visible')
      .click({ force: true });
    cy.log('Start From button clicked');

    cy.wait(2000);

    // Step 10: Extract line number from the popup
    cy.log('Step 10: Extracting stopped line number...');
    let firstStoppedLine;
    
    // Find the paragraph containing "line X"
    cy.get('p:nth-of-type(3)')
      .should('be.visible')
      .find('strong:nth-of-type(2)')
      .invoke('text')
      .then((text) => {
        // Extract just the number from "line XX"
        firstStoppedLine = text.replace('line ', '').trim();
        cy.log(`Job stopped at line: ${firstStoppedLine}`);
        
        // Step 11: Enter the line number in the input
        cy.log('Step 11: Entering resume line number...');
        cy.get('#resumeJobLine')
          .should('be.visible')
          .clear({ force: true })
          .type(firstStoppedLine, { force: true });
        cy.log(`Resume line set to: ${firstStoppedLine}`);
      });

    cy.wait(1000);

    // Step 12: Click "Start from Line" button
    cy.log('Step 12: Clicking Start from Line button...');
    cy.get('button')
      .contains('span', 'Start from Line')
      .parent()
      .should('be.visible')
      .click({ force: true });
    cy.log('Job resumed from specified line');

    // Step 13: Wait for 20 seconds
    cy.log('Step 13: Waiting 20 seconds...');
    cy.wait(20000);
    cy.log('Wait completed');

    // Step 14: Stop the job (Second time)
    cy.log('Step 14: Stopping job (second time)...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(3) > button')
      .contains('Stop')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job stopped again');

    // Step 15: Close second popup
    cy.log('Step 15: Closing second job end popup...');
    
    cy.contains('h2', 'Job End')
      .should('be.visible');

    cy.wait(2000);

    cy.get('button')
      .contains('Close')
      .should('be.visible')
      .click({ force: true });
    cy.log('Second popup closed');

    cy.wait(1000);

    // Step 16: Click "Start From" button again
    cy.log('Step 16: Clicking Start From button (second time)...');
    cy.get('div.bg-transparent div:nth-of-type(2) > button')
      .contains('Start From')
      .should('be.visible')
      .click({ force: true });
    cy.log('Start From button clicked');

    cy.wait(2000);

    // Step 17: Extract second stopped line number
    cy.log('Step 17: Extracting second stopped line number...');
    let secondStoppedLine;
    
    cy.get('p:nth-of-type(3)')
      .should('be.visible')
      .find('strong:nth-of-type(2)')
      .invoke('text')
      .then((text) => {
        // Extract just the number from "line XX"
        secondStoppedLine = text.replace('line ', '').trim();
        cy.log(`Job stopped at line: ${secondStoppedLine}`);
        
        // Step 18: Enter second line number
        cy.log('Step 18: Entering second resume line number...');
        cy.get('#resumeJobLine')
          .should('be.visible')
          .clear({ force: true })
          .type(secondStoppedLine, { force: true });
        cy.log(`Resume line set to: ${secondStoppedLine}`);
      });

    cy.wait(1000);

    // Step 19: Click "Start from Line" button (final time)
    cy.log('Step 19: Clicking Start from Line button (final time)...');
    cy.get('button')
      .contains('span', 'Start from Line')
      .parent()
      .should('be.visible')
      .click({ force: true });
    cy.log('Job resumed from second line');

    // Step 20: Wait for job to complete (no timeout limit)
    cy.log('Step 20: Waiting for job to complete naturally...');
    cy.log('(This may take several minutes depending on the G-code file)');
    
    // Wait for the Job End popup to appear - give it plenty of time, change this according to gcode file..

    cy.contains('h2', 'Job End', { timeout: 600000 }) // 10 minutes max
      .should('be.visible');
    cy.log('Job completed successfully');

    // Step 21: Extract and verify job completion details
    cy.log('Step 21: Extracting job completion details...');
    
    // Extract Status
    cy.contains('strong', 'Status:')
      .parent()
      .invoke('text')
      .then((fullText) => {
        const status = fullText.replace('Status:', '').trim();
        cy.log(`  Job Status: ${status}`);
        cy.wrap(status).as('jobStatus');
      });

    // Extract Time taken
    cy.contains('strong', 'Time:')
      .parent()
      .invoke('text')
      .then((fullText) => {
        const timeTaken = fullText.replace('Time:', '').trim();
        cy.log(`  Time Taken: ${timeTaken}`);
        cy.wrap(timeTaken).as('timeTaken');
      });

    // Extract Errors
    cy.contains('strong', 'Errors:')
      .parent()
      .invoke('text')
      .then((fullText) => {
        const errors = fullText.replace('Errors:', '').trim();
        cy.log(`  Errors: ${errors}`);
        cy.wrap(errors).as('jobErrors');
      });

    cy.wait(1000);

    // Step 22: Display final summary
    cy.log('Step 22: Job completion summary...');
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('==================================');
          cy.log('JOB COMPLETION SUMMARY:');
          cy.log(`  Status: ${status}`);
          cy.log(`  Time Taken: ${time}`);
          cy.log(`  Errors: ${errors}`);
          cy.log('==================================');
        });
      });
    });
    
    cy.wait(2000);

    // Close final popup
    cy.log('Step 23: Closing final popup...');
    cy.get('button')
      .contains('Close')
      .click();
    cy.log('Final popup closed');

    // Step 24: Verify machine status returns to Idle
    cy.log('Step 24: Verifying machine returned to Idle...');
    cy.contains(/^Idle$/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`  Machine status: "${status.text().trim()}"`);
      });

    cy.log('TEST COMPLETED: Job successfully run, stopped twice, resumed from lines, and completed');
  });
});
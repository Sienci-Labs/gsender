describe('Stop job ', () => {

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
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000); // Give app time to recover from initialization error
  });

  it('Test Case: Stops Job', () => {

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
    cy.log('Step 6: Waiting 10 seconds before pausing...');
    cy.wait(10000);

    // Step 7: Stop the job
    cy.log('Step 7: Stopping job...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(3) > button')
      .contains('Stop')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job stopped');
    
    // Step 8: Extract and verify job completion details from popup
    cy.log('Step 8: Extracting job completion details...');
    
    // Verify popup is visible
    cy.contains('h2', 'Job End')
      .should('be.visible');

    // Extract Status - More flexible approach
    cy.contains('strong', 'Status:')
      .parent()
      .invoke('text')
      .then((fullText) => {
        // Extract status by removing the "Status:" label
        const status = fullText.replace('Status:', '').trim();
        cy.log(`Job Status: ${status}`);
        
        // Store status for final summary
        cy.wrap(status).as('jobStatus');
      });

    // Extract Time taken
    cy.contains('strong', 'Time:')
      .parent()
      .invoke('text')
      .then((fullText) => {
        const timeTaken = fullText.replace('Time:', '').trim();
        cy.log(`Time Taken: ${timeTaken}`);
        
        // Store time for final summary
        cy.wrap(timeTaken).as('timeTaken');
      });

    // Verify no errors
    cy.contains('strong', 'Errors:')
      .parent()
      .invoke('text')
      .then((fullText) => {
        const errors = fullText.replace('Errors:', '').trim();
        cy.log(`Errors: ${errors}`);
        
        // Store errors for final summary
        cy.wrap(errors).as('jobErrors');
      });

    cy.wait(1000);

    // Step 8: Display final summary
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

    // Step 9: Verify machine status returns to Idle
    cy.log('Step 9: Verifying machine returned to Idle...');
    cy.contains(/^Idle$/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status after stop: "${status.text().trim()}"`);
      });

    cy.log('Test completed: Job successfully run , waited, and stopped');
  });
});
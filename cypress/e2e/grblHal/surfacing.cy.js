describe('Surfacing Test', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Should complete surfacing workflow successfully', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);
    cy.log('Machine is in idle status');

    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 3: Navigate to Tools
    cy.log('Step 3: Navigating to Tools page...');
    cy.contains('span', 'Tools')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('Tools page opened');

    // Step 4: Click on Surfacing tool - using the link selector
    cy.log('Step 4: Opening Surfacing tool...');
    cy.get('div.w-full a:nth-of-type(1) > div')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('Surfacing tool opened');

    // Step 5: Configure Width
    cy.log('Step 5: Setting width to 75mm');
    cy.get('#width')
      .should('be.visible')
      .invoke('val', '')
      .type('75');
    cy.wait(300);

    // Step 6: Configure Length
    cy.log('Step 6: Setting length to 75mm');
    cy.get('#length')
      .should('be.visible')
      .invoke('val', '')
      .type('75');
    cy.wait(300);

    // Step 7: Configure Skim Depth
    cy.log('Step 7: Setting skim depth to 1mm');
    cy.get('#skimDepth')
      .should('be.visible')
      .invoke('val','')
      .type('1');
    cy.wait(300);

    // Step 8: Configure Max Depth
    cy.log('Step 8: Setting max depth to 1mm');
    cy.get('#maxDepth')
      .should('be.visible')
      .invoke('val','')
      .type('1');
    cy.wait(300);

    // DEBUG: Inspect bit diameter area
cy.contains('label', /bit diameter/i)
  .parent()
  .then(($el) => {
    cy.log($el[0].outerHTML);
  });
// Step 9: Configure Bit Diameter
cy.log('Step 9: Setting bit diameter to 22mm');
cy.get('div.px-8 div:nth-of-type(4) input')
  .invoke('val', '')
  .type('22');
cy.wait(300);

// Step 10: Configure Stepover
cy.log('Step 10: Setting stepover to 40%');
cy.get('div.px-8 div:nth-of-type(5) input')
  .invoke('val', '')
  .type('40');
cy.wait(300);

// Step 11: Configure Feedrate
cy.log('Step 11: Setting feedrate to 2500 mm/min');
cy.get('div.px-8 div:nth-of-type(6) input')
  .invoke('val', '')
  .type('2500');
cy.wait(300);

// Step 12: Configure Spindle RPM
cy.log('Step 12: Setting spindle RPM to 17000');
cy.get('div.px-8 div:nth-of-type(7) input')
  .invoke('val', '')
  .type('17000');
cy.wait(500);

    // Step 13: Generate G-code
    cy.log('Step 13: Generating G-code...');
    cy.contains('button', 'Generate G-code')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('G-code generated successfully');    
    
    // Step 14: Load to Main Visualizer
    cy.log('Step 14: Loading to main visualizer...');
    cy.contains('button', 'Load to Main')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Loaded to main visualizer');

    // Step 15: Starting Job
    cy.log('Step 15: Starting Job...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    // Step 16: Verify job is running
    cy.log('Step 16: Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status: "${status.text().trim()}"`);
      });

    // Step 17: Wait for job completion
    cy.log('Step 17: Waiting for job completion...');
    cy.contains(/^Idle$/i, { timeout: 120000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job completed. Status: "${status.text().trim()}"`);
      });
    cy.wait(3000);

    // Step 18: Extract and verify job completion details from popup
    cy.log('Step 18: Extracting job completion details...');
    
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
        cy.log(`Errors: ${errors}`);
        expect(errors).to.equal('None');
        
        // Store errors for final summary
        cy.wrap(errors).as('jobErrors');
      });

    cy.wait(1000);

    // Step 19: Display final summary
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

    // Step 20: Close the job completion popup
    cy.log('Step 20: Closing job completion popup...');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');
    cy.log('Surfacing test completed successfully!');

  });
});
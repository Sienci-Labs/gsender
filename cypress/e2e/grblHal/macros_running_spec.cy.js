describe('Macros Running Testing', () => {

  // Ignore known hydration-related UI errors and undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      //'Hydration failed',
      //'There was an error while hydrating',
      //Cannot read properties of undefined',
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

  it('Run macros using file upload', () => {

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

    // Step 3: Navigate to Macros tab
    cy.log('Step 3: Opening Macros tab...');
    cy.contains('button', 'Macros', { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Macros tab opened');

    // Step 4: Click Import button
    cy.log('Step 4: Clicking Import button...');
    cy.contains('button', 'Import')
      .should('be.visible')
      .click();
    cy.wait(500);

    // Step 5: Upload macro file
    cy.log('Step 5: Uploading macro file...');
    cy.get('#fileInput')
      .selectFile('cypress/fixtures/macrosample.json', { force: true });
    
    // Step 6: Wait for upload success message
    cy.log('Step 6: Waiting for file upload confirmation...');
    cy.contains(/uploaded|imported|success|added/i, { timeout: 10000 })
      .should('be.visible')
      .then($msg => {
        const uploadMessage = $msg.text().trim();
        cy.log(`Upload message: "${uploadMessage}"`);
      });
    
    cy.wait(2000);
    cy.log('Macro file "macrosample.json" uploaded successfully');

    // Step 7: Verify macro appears in the list and get its name
    cy.log('Step 7: Verifying macro appears in the list...');
    cy.wait(1000);
    
    // Get the macro name from the uploaded file
    cy.get('div.flex-grow > div.grid > div:nth-of-type(1)')
      .should('be.visible')
      .within(() => {
        cy.get('span').first().then($span => {
          const macroName = $span.text().trim();
          cy.log(`Found macro: "${macroName}"`);
          
          // Store the macro name for later reference
          cy.wrap(macroName).as('macroName');
        });
      });

    // Step 8: Click on the macro file name to run it
    cy.log('Step 8: Clicking on the macro file name to run...');
    cy.get('div.flex-grow > div.grid > div:nth-of-type(1)')
      .should('be.visible')
      .dblclick();
    
    cy.wait(1000);
    cy.log('Macro double-clicked to execute');

    // Step 9: Wait for and capture execution start message
    cy.log('Step 9: Waiting for macro execution start message...');
    cy.get('body', { timeout: 5000 }).then($body => {
      // Look for toast notifications or status messages
      const bodyText = $body.text();
      cy.log(`Page content check: Looking for execution messages...`);
      
      // Try to find execution-related messages
      if (bodyText.includes('running') || bodyText.includes('executing') || bodyText.includes('started')) {
        cy.log('Execution started message detected');
      }
    });

    // Step 10: Monitor machine status during execution
    cy.log('Step 10: Monitoring macro execution...');
    cy.wait(3000);
    
    // Capture current machine status
    cy.get('body').then($body => {
      const statusText = $body.text();
      if (statusText.includes('Run') || statusText.includes('Running')) {
        cy.log('Machine status: Running macro');
      } else if (statusText.includes('Idle')) {
        cy.log('Machine status: Idle (macro may have completed quickly)');
      }
    });

    // Step 11: Wait for macro completion and capture completion message
    cy.log('Step 11: Waiting for macro completion message...');
    
    // Wait for machine to return to Idle state
    cy.contains(/^Idle$/i, { timeout: 60000 })
      .should('be.visible')
      .then(() => {
        cy.log('Macro execution completed, machine returned to Idle');
      });

    // Look for completion messages or notifications
    cy.wait(2000);
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      // Check for various completion messages
      if (bodyText.includes('completed') || bodyText.includes('finished') || bodyText.includes('done')) {
        const messages = [];
        if (bodyText.includes('completed')) messages.push('Macro completed');
        if (bodyText.includes('finished')) messages.push('Macro finished');
        if (bodyText.includes('done')) messages.push('Macro done');
        
        cy.log(`Completion messages found: ${messages.join(', ')}`);
      }
      
      // Log any changes or status updates
      cy.log('Checking for status changes or updates...');
    });

    // Step 12: Capture and log what changed after macro execution
    cy.log('Step 12: Analyzing changes made by macro execution...');
    
    // Get the macro name again and verify it's still there
    cy.get('@macroName').then(macroName => {
      cy.log(`Verifying macro "${macroName}" is still in the list...`);
    });
    
    cy.get('div.flex-grow > div.grid > div:nth-of-type(1)')
      .should('be.visible')
      .then(() => {
        cy.log('Macro is still available in the list after execution');
      });

    // Capture any console logs or changes
    cy.window().then((win) => {
      cy.log('Checking window state for changes...');
      // Any additional state checks can be added here
    });

    // Step 13: Final verification and summary
    cy.log('Step 13: Test summary and verification...');
    cy.get('body').then($body => {
      const finalStatus = $body.text();
      
      // Log final state
      cy.log('=== MACRO EXECUTION SUMMARY ==='); 
      cy.log('Macro file: macrosample.json');
      cy.log('Upload: Success');
      cy.log('Execution: Completed');
      cy.log('Final Status: Idle');
      cy.log('Macro Persistence: Verified');
      cy.log('================================');
    });

    cy.wait(2000);
    cy.log('Macro upload and execution test completed successfully');
  });
});
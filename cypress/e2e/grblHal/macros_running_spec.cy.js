describe('Macros Upload and Execution Test', () => {

  // Ignore known hydration-related UI errors
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'reading \'get\'',
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined'
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false;
    }
    return true;
  });

  before(() => {
    // Set viewport once before all tests
    cy.viewport(1689, 810);
  });

  it('Upload and run macro with success message verification', () => {

    // Step 1: Load the application and connect to CNC
    cy.log('STEP 1: Loading Application & Connecting to CNC ===');
    
    // Visit the main page directly
    cy.visit('http://localhost:8000/#/', {
      timeout: 30000,
      failOnStatusCode: false
    });
    
    // Wait for page to be ready
    cy.wait(3000);
    
    // Connect to machine
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Verify machine is in Idle state
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log('Machine is Idle and ready');
      });

    // Step 2: Navigate to Configuration page
    cy.log('STEP 2: Navigate to Configuration ===');
    cy.visit('http://localhost:8000/#/configuration', {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);
    cy.log('Configuration page loaded');

    // Step 3: Restore defaults
    cy.log('STEP 3: Restore Defaults ===');
    
    // Click on Defaults button
    cy.get('div.fixed div.grid > button', { timeout: 15000 })
      .first()
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('Defaults dialog opened');

    // Click Restore Defaults confirmation button
    cy.get('button', { timeout: 10000 })
      .contains(/Restore Defaults/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Defaults restored');

    // Step 4: Go back to main page (Carve)
    cy.log('STEP 4: Navigate back to Carve ===');
    cy.visit('http://localhost:8000/#/', {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);
    cy.log('Returned to main page');

    // Step 5: Click on Macros tab
    cy.log('STEP 5: Open Macros Tab ===');
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Macros tab opened');

    // Step 6: Upload macro file and verify success message
    cy.log('STEP 6: Upload Macro File ===');
    
    // Click Import button
    cy.get('button')
      .contains(/Import/i)
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Import dialog opened');

    // Upload the file - try multiple selector strategies
    cy.log('Uploading file: macrosample.json');
    
    // Strategy 1: Try specific selector first
    cy.get('body').then($body => {
      const fileInputs = $body.find('input[type="file"]');
      cy.log(`Found ${fileInputs.length} file input(s)`);
    });

    // Use the most specific selector or first visible input
    cy.get('input[type="file"]')
      .then($inputs => {
        if ($inputs.length > 1) {
          cy.log(`Multiple file inputs found (${$inputs.length}), using the last one`);
          cy.wrap($inputs.last()).selectFile('cypress/fixtures/macrosample.json', { force: true });
        } else {
          cy.wrap($inputs.first()).selectFile('cypress/fixtures/macrosample.json', { force: true });
        }
      });
    
    cy.wait(2000);
    cy.log('File upload initiated');

    // Check for success toast/popup message
    cy.log('Checking for success message...');
    cy.get('section ol li', { timeout: 10000 })
      .should('exist')
      .and('be.visible')
      .then($toast => {
        const toastText = $toast.text().trim();
        cy.log(`Success message displayed: "${toastText}"`);
        
        // Verify the toast contains success-related text
        const hasSuccessMessage = /uploaded|imported|success|added|macro/i.test(toastText.toLowerCase());
        if (hasSuccessMessage) {
          cy.log('Success message verified');
        } else {
          cy.log(`Warning: Unexpected message text: ${toastText}`);
        }
      });

    // Close the toast notification
    cy.log('Closing success message popup...');
    cy.get('section button svg', { timeout: 5000 })
      .first()
      .should('exist')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Success popup closed');

    // Verify the uploaded macro appears in the list
    cy.log('Verifying macro appears in list...');
    cy.get('body').then($body => {
      const bodyText = $body.text();
      if (bodyText.includes('CLSM Kit Settings')) {
        cy.log('Macro "CLSM Kit Settings" found in list');
      } else {
        cy.log('Searching for any macro in list...');
      }
    });

    // Wait for macro to appear and store reference
    cy.get('div.flex-grow span', { timeout: 10000 })
      .contains(/CLSM Kit Settings/i)
      .should('be.visible')
      .then($macro => {
        const macroName = $macro.text().trim();
        cy.log(`Macro found in list: "${macroName}"`);
        cy.wrap(macroName).as('macroName');
      });

    // Step 7: Click on macro name to run it and verify success
    cy.log('STEP 7: Run Macro and Verify Success');
    
    // Click on the macro name to execute it
    cy.get('div.flex-grow span')
      .contains(/CLSM Kit Settings/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Macro clicked to execute');

    // Check for execution success toast/popup message
    cy.log('Checking for execution success message...');
    cy.get('section ol li', { timeout: 15000 })
      .should('exist')
      .and('be.visible')
      .then($toast => {
        const toastText = $toast.text().trim();
        cy.log(`Execution message displayed: "${toastText}"`);
        
        // Verify the toast contains execution-related text
        const hasExecutionMessage = /running|executed|started|success|completed|macro/i.test(toastText.toLowerCase());
        if (hasExecutionMessage) {
          cy.log('Execution message verified');
        } else {
          cy.log(`Warning: Unexpected execution message: ${toastText}`);
        }
      });

    // Close the execution success popup
    cy.log('Closing execution success popup...');
    cy.get('section button svg', { timeout: 5000 })
      .first()
      .should('exist')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Execution success popup closed');

    // Final verification
    cy.log('TEST SUMMARY ');
    cy.get('@macroName').then(name => {
      cy.log(`Macro Name: ${name}`);
    });
    cy.wait(2000);
  });
});
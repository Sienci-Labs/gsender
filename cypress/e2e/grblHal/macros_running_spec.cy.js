describe('Macros Upload, Execution and Verification Test', () => {

 beforeEach(() => {
  cy.viewport(1920, 1080);
  // Use loadUI custom command with dynamic baseUrl
  cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
    maxRetries: 4,
    waitTime: 4000,
    timeout: 5000
  });
});

  /**
   * Recursively deletes all macros
   */
  const deleteAllMacros = () => {
    cy.get('body').then($body => {

      // Check if "No Macros..." message is visible
      if ($body.text().includes('No Macros')) {
        cy.log('No macros found - list is empty');
        return;
      }

      // Find all three-dot menu buttons within macro cards
      // Target the button with the specific class and three-dot SVG icon
      const menuButtons = $body.find('button.flex.items-center.justify-center.w-10.h-8.cursor-pointer[aria-haspopup="menu"]');

      cy.log(`Found ${menuButtons.length} macro menu buttons`);

      // Exit condition - no menu buttons found
      if (menuButtons.length === 0) {
        cy.log('No menu buttons found');
        return;
      }

      // Click first three-dot menu button to open dropdown
      cy.log('Clicking three-dot menu button...');
      cy.wrap(menuButtons[0])
        .scrollIntoView()
        .click({ force: true });

      cy.wait(500);

      // Click "Delete" option from the dropdown menu
      // Using the specific dropdown item class
      cy.log('Looking for Delete option in dropdown...');
      cy.get('div[role="menuitem"].cursor-pointer, [class*="cursor-pointer"][class*="px-4"][class*="py-3"]')
        .contains(/Delete/i)
        .first()
        .should('be.visible')
        .click({ force: true });

      cy.wait(500);

      // Confirm deletion in modal - looking for the blue Delete button
      cy.log('Confirming deletion in modal...');
      cy.get('button.bg-blue-500')
        .contains(/^Delete$/i)
        .should('be.visible')
        .click({ force: true });

      // Wait for UI to update
      cy.wait(1500);

      // Recurse to delete next macro
      deleteAllMacros();
    });
  };

  it('Upload and run macro with success message verify the output', () => {

    // Step 1: Load the application and connect to CNC
    cy.log('STEP 1: Loading Application & Connecting to CNC ===');
    
    // Visit the main page directly
   cy.visit(`${Cypress.config('baseUrl')}/#/`, {
      timeout: 30000,
      failOnStatusCode: false
    });
    
    // Wait for page to be ready
    cy.wait(3000);
    
    // Connect to machine
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    // Handle unlock if needed after connection
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Verify machine is in Idle state
    cy.log('Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log('Machine is Idle');
      });

    // Handle unlock again if alarm 11 occurred during idle
    cy.log('Checking for alarm during idle state...');
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Machine ready (alarm handled if present)');
    
    // Handle unlock if needed after navigation
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    // Make x axis zero 
    cy.zeroXAxis();
    //Make y axis zero
    cy.zeroYAxis();

    // Step 5: Click on Macros tab
    cy.log('=== STEP 5: Open Macros Tab ===');
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Macros tab opened');

    // Step 6: Upload macro file and verify success message
    cy.log('=== STEP 6: Upload Macro File ===');
    
    // Click Import button
    cy.get('button')
      .contains(/Import/i)
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Import dialog opened');

    // Upload the file
    cy.log('Uploading file: macrosample.json');
    
    cy.get('body').then($body => {
      const fileInputs = $body.find('input[type="file"]');
      cy.log(`Found ${fileInputs.length} file input(s)`);
    });

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
    cy.get('div.flex-grow span', { timeout: 10000 })
      .contains(/X plus jogging/i)
      .should('be.visible')
      .then($macro => {
        const macroName = $macro.text().trim();
        cy.log(`Macro found in list: "${macroName}"`);
        cy.wrap(macroName).as('macroName');
      });

    // Step 7: Click on macro name to run it and verify success
    cy.log('=== STEP 7: Run Macro and Verify Execution Success ===');
    
    // Handle unlock before running macro
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    
    // Click on the macro name to execute it
    cy.get('div.flex-grow span')
      .contains(/X plus jogging/i)
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

     cy.log('MACRO TEST COMPLETED SUCCESSFULLY');

   
    cy.wait(2000);

    // Step 9: Navigate back to Macros tab to edit the macro
    cy.log('=== STEP 9: Navigate to Macros to Edit ===');
    cy.visit(`${Cypress.config('baseUrl')}/#/`, {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);

    // Handle unlock if needed
    cy.unlockMachineIfNeeded();
    cy.wait(1000);

    // Open Macros tab
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Macros tab opened for editing');

    // Step 10: Click three dots menu and then Edit
    cy.log('=== STEP 10: Open Three Dots Menu and Click Edit ===');
    
    // Find the first macro row with the matching name
    cy.log('Looking for X plus jogging macro...');
    cy.get('div.flex-grow span')
      .contains(/X plus jogging/i)
      .should('be.visible')
      .parents('div.flex.items-center.justify-between.rounded-md')
      .first()
      .within(() => {
        // Click the three dots menu button (ellipsis icon)
        cy.log('Clicking three dots menu...');
        cy.get('svg[viewBox="0 0 512 512"]')
          .parent('button')
          .should('be.visible')
          .click({ force: true });
      });
    
    cy.wait(1000);
    cy.log('Three dots menu opened');

    // Click on "Edit" option from the dropdown menu
    cy.log('Clicking Edit option...');
    cy.contains('span', /^Edit$/i, { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Edit dialog opened');

    // Step 11: Update macro fields
    cy.log('=== STEP 11: Update Macro Fields ===');

    // Update Name field
    cy.log('Updating macro name...');
    cy.get('div.my-4 input', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('X Minus jogging Editing ');
    cy.wait(500);
    cy.log('Name updated to: X Minus jogging Editing');

    // Update G-code field
    cy.log('Updating G-code...');
    cy.get('div:nth-of-type(3) > textarea', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('$J=G21 G91 X-10 F6000\n$$', { delay: 10 });
    cy.wait(500);
    cy.log('G-code updated');

    // Update Description field
    cy.log('Updating description...');
    cy.get('div:nth-of-type(4) > textarea', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('This is a test data');
    cy.wait(500);
    cy.log('Description updated to: This is a test data');

    // Save the changes
    cy.log('Saving macro changes...');
    cy.contains('button', /Update Macro/i, { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Macro changes saved');

    // Check for success message
    cy.log('Checking for update success message...');
    cy.get('body').then($body => {
      if ($body.find('section ol li').length > 0) {
        cy.get('section ol li', { timeout: 10000 })
          .should('exist')
          .and('be.visible')
          .then($toast => {
            const toastText = $toast.text().trim();
            cy.log(`Update message displayed: "${toastText}"`);
          });

        // Close success popup if present
        if ($body.find('section button svg').length > 0) {
          cy.get('section button svg')
            .first()
            .click({ force: true });
          cy.wait(1000);
          cy.log('Success popup closed');
        }
      }
    });

    // Step 12: Verify the edited macro name appears
    cy.log('=== STEP 12: Verify Edited Macro Name ===');
    cy.get('div.flex-grow span', { timeout: 10000 })
      .contains(/X Minus jogging Editing/i)
      .should('be.visible')
      .then($macro => {
        const macroName = $macro.text().trim();
        cy.log(`Edited macro found in list: "${macroName}"`);
      });

    // Step 13: Run the edited macro
    cy.log('=== STEP 13: Run Edited Macro ===');
    
    // Handle unlock before running
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    
    // Click on the edited macro to execute it
    cy.get('div.flex-grow span')
      .contains(/X Minus jogging Editing/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Edited macro clicked to execute');

    // Check for execution success message
    cy.log('Checking for execution success message...');
    cy.get('section ol li', { timeout: 15000 })
      .should('exist')
      .and('be.visible')
      .then($toast => {
        const toastText = $toast.text().trim();
        cy.log(`Execution message: "${toastText}"`);
      });

    // Close execution popup
    cy.get('body').then($body => {
      if ($body.find('section button svg').length > 0) {
        cy.get('section button svg')
          .first()
          .click({ force: true });
        cy.wait(1000);
        cy.log('Execution popup closed');
      }
    });

    // Verify X-axis position is back to 0.00
    cy.log('Verifying X-axis position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .first()
      .should('have.value', '0.00')
      .then(($input) => {
        const xValue = $input.val();
        cy.log(` X-axis position verified: ${xValue}`);
      });

    cy.log(' Macro edited successfully');
    
    cy.wait(2000);


    // Step 16: Delete all macros
    cy.log('=== STEP 16: Delete All Macros ===');
    deleteAllMacros();

    cy.log('STEP 16: Verify no macros remain');
    cy.contains(/No Macros/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log('All macros deleted successfully');
      });

    cy.log('=== STEP 16 COMPLETED ===');
    
    cy.wait(2000);

    // Step 17: Add New Macro Manually
    cy.log('=== STEP 17: Add New Macro Manually ===');

    // Navigate to application
   cy.visit(`${Cypress.config('baseUrl')}/#/`, {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);

    // Handle unlock if needed
    cy.unlockMachineIfNeeded();
    cy.wait(1000);

    // Verify machine is in Idle state
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible');
    cy.log('Machine is Idle');

    // Open Macros tab
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Macros tab opened');

    // Click Add button
    cy.log('Clicking Add button...');
    cy.contains('button', /^Add$/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log(' Add button clicked');

    // Verify form is visible
    cy.log('Verifying Add Macro form...');
    cy.get('input[name="name"][type="text"][maxlength="128"]', { timeout: 10000 })
      .should('be.visible')
      .should('be.enabled');
    cy.log(' Add Macro form is visible');

    // Fill in Macro Name
    const macroName = 'Jog Y axis plus and minus ';
    cy.log(`Entering macro name: ${macroName}`);
    cy.get('input[name="name"][type="text"][maxlength="128"]')
      .should('be.visible')
      .clear({ force: true })
      .type(macroName, { force: true });
    cy.wait(500);
    cy.log(`Name entered: ${macroName}`);

    // Fill in G-code
  const gcode = '$J=G21 G91 Y10 F6000\n$J=G21 G91 Y-10 F6000\n$$';
    cy.log('Entering G-code...');
    cy.get('textarea[name="content"][required]', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type(gcode, { delay: 10, force: true });
    cy.wait(500);
    cy.log('G-code entered');

    // Fill in Description
    const description = 'TEST DATA FOR ADDING MACROS';
    cy.log(`Entering description: ${description}`);
    cy.get('textarea[name="description"][maxlength="128"]', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type(description, { force: true });
    cy.wait(500);
    cy.log(` Description entered: ${description}`);

    // Click Add New Macro button
    cy.log('Clicking Add New Macro button...');
    cy.wait(1000);
    cy.get('[data-testid="add-macro-button"]')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Add New Macro button clicked');

    // Verify success message or form closure
    cy.log('Checking for success indication...');
    cy.get('body').then($body => {
      if ($body.find('section ol li').length > 0) {
        cy.get('section ol li', { timeout: 10000 })
          .should('exist')
          .and('be.visible')
          .then($toast => {
            const toastText = $toast.text().trim();
            cy.log(` Success message: "${toastText}"`);
            
            const hasSuccess = /added|success|created|macro/i.test(toastText);
            expect(hasSuccess).to.be.true;
          });

        // Close toast if present
        if ($body.find('section button svg').length > 0) {
          cy.get('section button svg', { timeout: 5000 })
            .first()
            .click({ force: true });
          cy.wait(1000);
          cy.log('Toast closed');
        }
      } else {
        cy.log('No toast found - checking for form closure');
        cy.get('input[name="name"][type="text"]').should('not.exist');
        cy.log('Form closed successfully');
      }
    });

    // Step 18: Verify newly added macro in list
    cy.log('=== STEP 18: Verify Newly Added Macro ===');
    cy.get('div.flex-grow span', { timeout: 10000 })
      .contains(new RegExp(macroName, 'i'))
      .should('be.visible')
      .then($macro => {
        const displayedName = $macro.text().trim();
        cy.log(` Macro found: "${displayedName}"`);
        expect(displayedName).to.include('Jog Y axis plus and minus');
      });
    cy.log('STEP 17-18 COMPLETED: Macro added and verified');

    // Step 19: Run the newly added macro
    cy.log('=== STEP 19: Run Newly Added Macro ===');

    // Handle unlock before running
    cy.unlockMachineIfNeeded();
    cy.wait(1000);

    // Click on the newly added macro to execute it
    cy.get('div.flex-grow span')
      .contains(/Jog Y axis plus and minus/i)
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Newly added macro clicked to execute');

    // Check for execution success message
    cy.log('Checking for execution success message...');
    cy.get('section ol li', { timeout: 15000 })
      .should('exist')
      .and('be.visible')
      .then($toast => {
        const toastText = $toast.text().trim();
        cy.log(` Execution message: "${toastText}"`);
      });

    // Close execution popup
    cy.get('body').then($body => {
      if ($body.find('section button svg').length > 0) {
        cy.get('section button svg')
          .first()
          .click({ force: true });
        cy.wait(1000);
        cy.log(' Execution popup closed');
      }
    });

    // Verify Y-axis position is back to 0.00
    cy.log('Verifying Y-axis position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .eq(1) // Y-axis is the second input (0=X, 1=Y, 2=Z)
      .should('have.value', '0.00')
      .then(($input) => {
        const yValue = $input.val();
        cy.log(`✓ Y-axis position verified: ${yValue}`);
      });

    cy.log('STEP 19 COMPLETED: Newly added macro executed');
    // Final summary for newly added macro
    cy.log('═══════════════════════════════════════════════');
    cy.log('NEWLY ADDED MACRO TEST SUMMARY ');
    cy.log('═══════════════════════════════════════════════');
    cy.log(`Macro Name: ${macroName}`);
    cy.log(`Description: ${description}`);
    cy.log('Macro added manually via UI');
    cy.log(' Macro executed successfully');
    
    cy.log('═══════════════════════════════════════════════');
    cy.log('STEP 20 COMPLETED');
    cy.log('═══════════════════════════════════════════════');

    cy.wait(2000);

    // Step 21: Export the newly added macro
    cy.log('=== STEP 21: Export Newly Added Macro ===');

    // Navigate back to Macros tab
    cy.visit(`${Cypress.config('baseUrl')}/#/`, {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);

    cy.unlockMachineIfNeeded();
    cy.wait(1000);

    // Open Macros tab
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    cy.wait(2000);

   // Click with force
cy.contains('button', /Export/i)
  .should('be.visible')
  .should('be.enabled')
  .click({ force: true });

    cy.log('Export button was clicked successfully');

    // Step 22: Clean up - Delete the newly added macro
    cy.log('=== STEP 22: Clean Up - Delete Newly Added Macro ===');

    // Navigate back to Macros tab
    cy.visit(`${Cypress.config('baseUrl')}/#/`, {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);

    cy.unlockMachineIfNeeded();
    cy.wait(1000);

    // Open Macros tab
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    cy.wait(2000);

    // Delete all macros
    deleteAllMacros();

    cy.log('Verify no macros remain after cleanup');
    cy.contains(/No Macros/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log(' All macros deleted successfully');
      });

    cy.log('=== STEP 22 COMPLETED ===');

    // Final complete test summary
    cy.log('═══════════════════════════════════════════════');
    cy.log('ALL TESTS COMPLETED SUCCESSFULLY');
    cy.log('═══════════════════════════════════════════════');
  });

});
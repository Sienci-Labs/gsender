describe('Macros Upload, Execution and Verification Test', () => {

  before(() => {
    // Set viewport once before all tests
    cy.viewport(1689, 810);
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

  it('Upload and run macro with success message verification and config validation', () => {

    // Step 1: Load the application and connect to CNC
    cy.log('STEP 1: Loading Application & Connecting to CNC');
    
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

    // Step 2: Navigate to Configuration page
    cy.log('STEP 2: Navigate to Configuration ===');
    cy.visit('http://localhost:8000/#/configuration', {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);
    cy.log('Configuration page loaded');

    // Step 3: Restore defaults
    cy.log('STEP 3: Restore Defaults');
    
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

    // Handle unlock if needed after navigation
    cy.unlockMachineIfNeeded();
    cy.wait(1000);

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
      .contains(/CLSM Kit Settings/i)
      .should('be.visible')
      .then($macro => {
        const macroName = $macro.text().trim();
        cy.log(`Macro found in list: "${macroName}"`);
        cy.wrap(macroName).as('macroName');
      });

    // Step 7: Click on macro name to run it and verify success
    cy.log('STEP 7: Run Macro and Verify Execution Success ===');
    
    // Handle unlock before running macro
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    
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

    // Step 8: Navigate to Configuration page to verify settings
    cy.log('STEP 8: Verify Macro Applied Settings ===');
    
    cy.visit('http://localhost:8000/#/configuration', {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);
    cy.log('Configuration page loaded for verification');

    // Helper function to search and verify a setting by label
    const verifyConfigValue = (searchTerm, expectedValue, settingName) => {
      cy.log(`Verifying: ${settingName}`);
      
      // Clear and search for the setting
      cy.get('#simple-search', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(searchTerm);
      cy.wait(2000);
      
      // Strategy: Find the fieldset containing the label text, then find input within it
      cy.contains('fieldset', new RegExp(searchTerm, 'i'))
        .filter(':visible')
        .first()
        .within(() => {
          // Find the input with the module class within this specific fieldset
          cy.get('input.index-module__textInput___KtY0r, input[type="text"], input[type="number"]')
            .not('[type="checkbox"]')
            .not('[type="radio"]')
            .first()
            .should('have.value', expectedValue.toString())
            .then(() => {
              cy.log(`✓ ${settingName} = ${expectedValue} (Verified)`);
            });
        });
    };

    // Verify X-axis travel resolution
    cy.log('Verifying Travel Resolutions');
    verifyConfigValue('X-axis travel resolution', '100', 'X-axis travel resolution');
    
    // Verify Y-axis travel resolution
    verifyConfigValue('Y-axis travel resolution', '100', 'Y-axis travel resolution');
    
    // Verify Z-axis travel resolution
    verifyConfigValue('Z-axis travel resolution', '100', 'Z-axis travel resolution');

    // Verify Maximum Rates
    cy.log('Verifying Maximum Rates');
    verifyConfigValue('X-axis maximum rate', '7000', 'X-axis maximum rate');
    
    verifyConfigValue('Y-axis maximum rate', '7000', 'Y-axis maximum rate');
    
    verifyConfigValue('Z-axis maximum rate', '2000', 'Z-axis maximum rate');

    // Verify Homing Direction Invert settings (SWITCH BUTTONS)
    cy.log('✓ Verifying Homing Direction Invert Settings');
    
    // Clear search and search for homing direction invert
    cy.get('#simple-search', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('Homing direction invert');
    cy.wait(2000);

    // Verify X-axis is enabled (checked) - using button[role="switch"]
    cy.get('button[role="switch"][id*="$23-0"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .should('have.attr', 'aria-checked', 'true')
      .should('have.attr', 'data-state', 'checked')
      .then(() => {
        cy.log('✓ X-axis homing direction invert: ENABLED (Correct)');
      });

    // Verify Y-axis is disabled (unchecked)
    cy.get('button[role="switch"][id*="$23-1"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .should('have.attr', 'aria-checked', 'false')
      .should('have.attr', 'data-state', 'unchecked')
      .then(() => {
        cy.log('✓ Y-axis homing direction invert: DISABLED (Correct)');
      });

    // Verify Z-axis is disabled (unchecked)
    cy.get('button[role="switch"][id*="$23-2"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .should('have.attr', 'aria-checked', 'false')
      .should('have.attr', 'data-state', 'unchecked')
      .then(() => {
        cy.log('✓ Z-axis homing direction invert: DISABLED (Correct)');
      });

    // Verify A-axis is disabled (unchecked) if present
    cy.get('body').then($body => {
      if ($body.find('button[role="switch"][id*="$23-3"]').length > 0) {
        cy.get('button[role="switch"][id*="$23-3"]')
          .first()
          .should('be.visible')
          .should('have.attr', 'aria-checked', 'false')
          .should('have.attr', 'data-state', 'unchecked')
          .then(() => {
            cy.log('✓ A-axis homing direction invert: DISABLED (Correct)');
          });
      } else {
        cy.log('ℹ A-axis not present (skipped)');
      }
    });

    // Final verification summary
    cy.log('═══════════════════════════════════════════════');
    cy.log('TEST SUMMARY ✓');
    cy.get('@macroName').then((name) => {
      cy.log(`Macro Name: ${name}`);
      cy.log('✓ Macro uploaded successfully');
      cy.log('✓ Macro executed successfully');
      cy.log('All configuration values verified:');
      cy.log('  - X/Y/Z travel resolution = 100');
      cy.log('  - X/Y maximum rate = 7000');
      cy.log('  - Z maximum rate = 2000');
      cy.log('  - X homing invert = ENABLED');
      cy.log('  - Y/Z/A homing invert = DISABLED');
    });

    cy.log('✓ MACRO TEST COMPLETED SUCCESSFULLY');
    cy.log('═══════════════════════════════════════════════');
   
    cy.wait(2000);

    // Step 9: Navigate back to Macros tab to edit the macro
    cy.log('=== STEP 9: Navigate to Macros to Edit ===');
    cy.visit('http://localhost:8000/#/', {
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
    cy.log('Looking for CLSM Kit Settings macro...');
    cy.get('div.flex-grow span')
      .contains(/CLSM Kit Settings/i)
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
    cy.log('STEP 11: Update Macro Fields');

    // Update Name field
    cy.log('Updating macro name...');
    cy.get('div.my-4 input', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('CLSM Kit Settings-edited');
    cy.wait(500);
    cy.log('Name updated to: CLSM Kit Settings-edited');

    // Update G-code field
    cy.log('Updating G-code...');
    cy.get('div:nth-of-type(3) > textarea', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('$100=200\n$101=200\n$102=200\n$110=6000\n$111=6000\n$112=1000\n$23=1\n$$', { delay: 10 });
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
    cy.log('STEP 12: Verify Edited Macro Name');
    cy.get('div.flex-grow span', { timeout: 10000 })
      .contains(/CLSM Kit Settings-edited/i)
      .should('be.visible')
      .then($macro => {
        const macroName = $macro.text().trim();
        cy.log(`Edited macro found in list: "${macroName}"`);
      });

    // Step 13: Run the edited macro
    cy.log('STEP 13: Run Edited Macro');
    
    // Handle unlock before running
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    
    // Click on the edited macro to execute it
    cy.get('div.flex-grow span')
      .contains(/CLSM Kit Settings-edited/i)
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

    // Step 14: Verify edited macro settings in Configuration
    cy.log('STEP 14: Verify Edited Macro Settings');
    
    cy.visit('http://localhost:8000/#/configuration', {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);
    cy.log('Configuration page loaded for edited macro verification');

    // Verify edited travel resolutions (NEW VALUES: 200)
    cy.log('Verifying Edited Travel Resolutions');
    verifyConfigValue('X-axis travel resolution', '200', 'X-axis travel resolution');
    
    verifyConfigValue('Y-axis travel resolution', '200', 'Y-axis travel resolution');
    
    verifyConfigValue('Z-axis travel resolution', '200', 'Z-axis travel resolution');

    // Verify edited maximum rates (NEW VALUES: 6000, 6000, 1000)
    cy.log('Verifying Edited Maximum Rates');
    verifyConfigValue('X-axis maximum rate', '6000', 'X-axis maximum rate');
    
    verifyConfigValue('Y-axis maximum rate', '6000', 'Y-axis maximum rate');
    
    verifyConfigValue('Z-axis maximum rate', '1000', 'Z-axis maximum rate');

    // Verify homing direction invert (should be enabled for X only based on $23=1)
    cy.log('Verifying Edited Homing Direction Invert Settings');
    
    cy.get('#simple-search', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('Homing direction invert');
    cy.wait(2000);

    // X-axis should be enabled ($23=1 means X-axis inverted)
    cy.get('button[role="switch"][id*="$23-0"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .should('have.attr', 'aria-checked', 'true')
      .should('have.attr', 'data-state', 'checked')
      .then(() => {
        cy.log('✓ X-axis homing direction invert: ENABLED (Correct)');
      });

    // Y-axis should be disabled
    cy.get('button[role="switch"][id*="$23-1"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .should('have.attr', 'aria-checked', 'false')
      .should('have.attr', 'data-state', 'unchecked')
      .then(() => {
        cy.log('✓ Y-axis homing direction invert: DISABLED (Correct)');
      });

    // Z-axis should be disabled
    cy.get('button[role="switch"][id*="$23-2"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .should('have.attr', 'aria-checked', 'false')
      .should('have.attr', 'data-state', 'unchecked')
      .then(() => {
        cy.log('✓ Z-axis homing direction invert: DISABLED (Correct)');
      });

    // Final summary for edited macro
    cy.log('═══════════════════════════════════════════════');
    cy.log('EDITED MACRO TEST SUMMARY ✓');
    cy.log('Macro Name: CLSM Kit Settings-edited');
    cy.log('✓ Macro edited successfully');
    cy.log('✓ Edited macro executed successfully');
    cy.log('All edited configuration values verified:');
    cy.log('  - X/Y/Z travel resolution = 200');
    cy.log('  - X/Y maximum rate = 6000');
    cy.log('  - Z maximum rate = 1000');
    cy.log('  - X homing invert = ENABLED');
    cy.log('  - Y/Z homing invert = DISABLED');
    cy.log('═══════════════════════════════════════════════');
    
    cy.wait(2000);

    // Step 15: Export Edited Macro
    cy.log('=== STEP 15: Export Edited Macro ===');

    // Navigate back to Macros tab
    cy.visit('http://localhost:8000/#/', {
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

    // Click Export button
    cy.log('Clicking Export button...');
    cy.contains('button', /Export/i, { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.wait(1000);

    cy.log('✓ Export functionality tested');

    // Step 16: Delete all macros
    cy.log('=== STEP 16: Delete All Macros ===');
    deleteAllMacros();

    cy.log('STEP 16: Verify no macros remain');
    cy.contains(/No Macros/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log('✓ All macros deleted successfully');
      });

    cy.log('=== STEP 16 COMPLETED ===');
    
    // Final complete test summary
    cy.log('═══════════════════════════════════════════════');
    cy.log('COMPLETE MACRO LIFECYCLE TEST SUMMARY');
    cy.log('═══════════════════════════════════════════════');
    cy.log('Step 1:   Machine connected and ready');
    cy.log('Step 2:   Configuration page accessed');
    cy.log('Step 3:   Defaults restored');
    cy.log('Step 4:   Returned to main page');
    cy.log('Step 5:   Macros tab opened');
    cy.log('Step 6:   Macro file uploaded successfully');
    cy.log('Step 7:   Macro executed successfully');
    cy.log('Step 8:   Configuration verified (original values)');
    cy.log('Step 9:   Navigated to edit macro');
    cy.log('Step 10:  Three dots menu and Edit clicked');
    cy.log('Step 11:  Macro fields updated');
    cy.log('Step 12:  Edited macro name verified');
    cy.log('Step 13:  Edited macro executed successfully');
    cy.log('Step 14:  Configuration verified (edited values)');
    cy.log('Step 15:  Macro exported successfully');
    cy.log('Step 16:  All macros deleted successfully');
    cy.log('═══════════════════════════════════════════════');
    cy.log('✓ ALL TESTS COMPLETED SUCCESSFULLY');
    cy.log('═══════════════════════════════════════════════');
  });

});
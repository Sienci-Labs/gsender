describe('Add Macro Manually - Test Case', () => {

  before(() => {
    // Set viewport once before all tests
    cy.viewport(1689, 810);
  });

  /**
   * Test Case: Add New Macro Manually
   * 
   * Purpose: Verify that a user can successfully add a new macro 
   * using the Add Macro dialog interface
   * 
   * Prerequisites:
   * - Application is running at http://localhost:8000
   * - Machine is connected and in Idle state
   * - Macros tab is accessible
   */
  it('Should successfully add a new macro manually via the UI', () => {

    // ========================================
    // STEP 1: Navigate to Application
    // ========================================
    cy.log('=== STEP 1: Load Application ===');
    
    cy.visit('http://localhost:8000/#/', {
      timeout: 30000,
      failOnStatusCode: false
    });
    
    cy.wait(3000);
    cy.log('✓ Application loaded');

    // ========================================
    // STEP 2: Connect to CNC Machine
    // ========================================
    cy.log('=== STEP 2: Connect to CNC ===');
    
    cy.connectMachine();
    cy.wait(6000);
    cy.log('✓ Machine connected');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Verify machine is in Idle state
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible');
    cy.log('✓ Machine is Idle');

    // ========================================
    // STEP 3: Navigate to Macros Tab
    // ========================================
    cy.log('=== STEP 3: Open Macros Tab ===');
    
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    
    cy.wait(2000);
    cy.log('✓ Macros tab opened');

    // ========================================
    // STEP 4: Click Add Button
    // ========================================
    cy.log('=== STEP 4: Click Add Button ===');

    // Click the "Add" button (not Import or Export)
    cy.contains('button', /^Add$/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);
    cy.log('✓ Add button clicked');

    // ========================================
    // STEP 5: Verify Form is Visible
    // ========================================
    cy.log('=== STEP 5: Verify Add Macro Form ===');
    
    // Wait for form inputs to be visible (not dialog state)
    cy.get('input[name="name"][type="text"][maxlength="128"]', { timeout: 10000 })
      .should('be.visible')
      .should('be.enabled');
    
    cy.log('✓ Add Macro form is visible');

    // ========================================
    // STEP 6: Fill in Macro Name
    // ========================================
    cy.log('=== STEP 6: Enter Macro Name ===');
    
    const macroName = 'CLSM Kit Settings ADD';
    
    cy.get('input[name="name"][type="text"][maxlength="128"]')
      .should('be.visible')
      .clear({ force: true })
      .type(macroName, { force: true });
    
    cy.wait(500);
    cy.log(`✓ Name entered: ${macroName}`);

    // ========================================
    // STEP 7: Fill in G-code
    // ========================================
    cy.log('=== STEP 7: Enter G-code ===');
    
    const gcode = '$100=100\n$101=100\n$102=100\n$110=7000\n$111=7000\n$112=2000\n$23=1\n$$';
    
    cy.get('textarea[name="content"][required]', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type(gcode, { delay: 10, force: true });
    
    cy.wait(500);
    cy.log('✓ G-code entered');

    // ========================================
    // STEP 8: Fill in Description
    // ========================================
    cy.log('=== STEP 8: Enter Description ===');
    
    const description = 'TEST DATA FOR ADDING MACROS';
    
    cy.get('textarea[name="description"][maxlength="128"]', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type(description, { force: true });
    
    cy.wait(500);
    cy.log(`✓ Description entered: ${description}`);

    // ========================================
    // STEP 9: Click Add New Macro Button
    // ========================================
    cy.log('=== STEP 9: Click Add New Macro Button ===');
    
    cy.wait(1000);
    
    // Target button with the unique class selector
    cy.get('.border-robin-500', { timeout: 10000 })
      .should('be.visible')
      .should('have.class', 'bg-white')
      .and('have.class', 'text-gray-600')
      .click({ force: true });

    cy.wait(2000);
    cy.log('✓ Add New Macro button clicked');

    // ========================================
    // STEP 10: Verify Success Message
    // ========================================
    cy.log('=== STEP 10: Check Success Toast ===');
    
    cy.get('body').then($body => {
      if ($body.find('section ol li').length > 0) {
        cy.get('section ol li', { timeout: 10000 })
          .should('exist')
          .and('be.visible')
          .then($toast => {
            const toastText = $toast.text().trim();
            cy.log(`✓ Success message: "${toastText}"`);
            
            const hasSuccess = /added|success|created|macro/i.test(toastText);
            expect(hasSuccess).to.be.true;
          });

        // Close toast
        if ($body.find('section button svg').length > 0) {
          cy.get('section button svg', { timeout: 5000 })
            .first()
            .click({ force: true });
          cy.wait(1000);
          cy.log('✓ Toast closed');
        }
      } else {
        cy.log('No toast found - checking for form closure');
        
        // Verify form is closed by checking if name input is no longer visible
        cy.get('input[name="name"][type="text"]').should('not.exist');
        cy.log('✓ Form closed successfully');
      }
    });

    // ========================================
    // STEP 11: Verify Macro in List
    // ========================================
    cy.log('=== STEP 11: Verify Macro Added ===');
    
    cy.get('div.flex-grow span', { timeout: 10000 })
      .contains(new RegExp(macroName, 'i'))
      .should('be.visible')
      .then($macro => {
        const displayedName = $macro.text().trim();
        cy.log(`✓ Macro found: "${displayedName}"`);
        expect(displayedName).to.include('CLSM Kit Settings ADD');
      });

    // ========================================
    // TEST SUMMARY
    // ========================================
    cy.log('═══════════════════════════════════════════════');
    cy.log('TEST SUMMARY - ADD MACRO MANUALLY');
    cy.log('═══════════════════════════════════════════════');
    cy.log(`Macro Name: ${macroName}`);
    cy.log(`Description: ${description}`);
    cy.log('G-code Settings:');
    cy.log('  - Travel resolution (X/Y/Z): 100 steps/mm');
    cy.log('  - Max rate (X/Y): 7000 mm/min');
    cy.log('  - Max rate (Z): 2000 mm/min');
    cy.log('  - Homing direction invert (X): Enabled');
    cy.log('✓ Macro added successfully');
    cy.log('✓ Macro verified in list');
    cy.log('═══════════════════════════════════════════════');
    cy.log('✅ TEST PASSED');
    cy.log('═══════════════════════════════════════════════');
  });

  /**
   * Test Case: Clean Up - Delete Test Macro
   */
  it('Should clean up - Delete the test macro', () => {
    
    cy.log('=== CLEANUP: Delete Test Macro ===');

    // Navigate to application
    cy.visit('http://localhost:8000/#/', {
      timeout: 20000,
      failOnStatusCode: false
    });
    cy.wait(3000);

    // Handle unlock
    cy.unlockMachineIfNeeded();
    cy.wait(1000);

    // Open Macros tab
    cy.get('button', { timeout: 15000 })
      .contains(/Macros/i)
      .should('be.visible')
      .click();
    cy.wait(2000);

    // Find and delete the test macro
    cy.get('div.flex-grow span')
      .contains(/CLSM Kit Settings ADD/i)
      .should('be.visible')
      .parents('div.flex.items-center.justify-between.rounded-md')
      .first()
      .within(() => {
        // Click three dots menu
        cy.get('button[aria-haspopup="menu"]')
          .should('be.visible')
          .click({ force: true });
      });

    cy.wait(500);

    // Click Delete option
    cy.get('div[role="menuitem"]')
      .contains(/Delete/i)
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.wait(500);

    // Confirm deletion
    cy.get('button.bg-blue-500')
      .contains(/^Delete$/i)
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);

    cy.log('✓ Test macro deleted');
    cy.log(' Cleanup completed');
  });

});
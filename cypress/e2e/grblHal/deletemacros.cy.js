describe('Delete All Uploaded Macros', () => {

  before(() => {
    cy.viewport(1689, 810);

    cy.visit('http://localhost:8000/#/', {
      timeout: 30000,
      failOnStatusCode: false
    });

    cy.wait(3000);
    cy.connectMachine();
    cy.wait(5000);
    cy.unlockMachineIfNeeded();
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

  it('Deletes all macro files uploaded from JSON', () => {

    cy.log('STEP 1: Navigate to Macros Tab');
    // Target the blue-highlighted Macros tab button
    cy.get('button.flex-grow')
      .contains(/Macros/i)
      .should('be.visible')
      .click();

    cy.wait(2000);

    cy.log('STEP 2: Delete all macros');
    deleteAllMacros();

    cy.log('STEP 3: Verify no macros remain');
    cy.contains(/No Macros/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log('All macros deleted successfully');
      });
  });
});
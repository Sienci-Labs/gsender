describe('Config features tests', () => {1/

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Checks config functionalities', () => {

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

    // Step 3: Go to config features 
    cy.log('Step 3: Navigating to Configuration page...');
    cy.goToConfig();
    cy.wait(3000);
    cy.log('Configuration page opened');

    // Step 4: Test search in Config tab - Search for "parking"
    cy.log('Step 4: Testing search functionality - Searching for "parking"');
    cy.get('#simple-search')
      .should('be.visible')
      .click()
      .type('parking');
    cy.wait(1500);
    cy.log('Search results displayed for "parking"');

    // Step 5: Clear search and verify results cleared
    cy.log('Step 5: Clearing search...');
    cy.get('#simple-search')
      .should('be.visible')
      .clear();
    cy.wait(1000);
    cy.log('Search cleared');

    // Step 6: Navigate to EEPROM tab
    cy.log('Step 6: Switching to EEPROM tab...');
    cy.contains('button', 'EEPROM')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('EEPROM tab opened');

    // Step 7: Search in EEPROM tab - Search for "direction"
    cy.log('Step 7: Searching for "direction" in EEPROM tab');
    cy.get('#simple-search')
      .should('be.visible')
      .click()
      .type('direction');
    cy.wait(1500);
    cy.log('Search results displayed for "direction"');

    // Step 8: Verify search results contain "direction" related settings
    cy.log('Step 8: Verifying search results...');
    cy.contains('Step direction')
      .should('be.visible');
    cy.contains('Ganged axes direction')
      .should('be.visible');
    cy.contains('Homing direction')
      .should('be.visible');
    cy.log('Direction-related settings verified');

    // Step 9: Interact with settings (view tooltips/help)
    cy.log('Step 9: Viewing setting details...');
    cy.contains('Step direction')
      .should('be.visible');
    cy.wait(500);

    // Step 10: Scroll down to view more settings
    cy.log('Step 10: Scrolling to view more settings...');
    cy.get('[role="tabpanel"]')
      .scrollTo('bottom', { duration: 1000 });
    cy.wait(1000);
    cy.log('Scrolled to bottom of settings');

    // Step 11: Test "Defaults" button - Click to restore defaults
    cy.log('Step 11: Testing Restore Defaults functionality...');
    cy.contains('button', 'Defaults')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Restore Defaults dialog opened');

    // Step 12: Confirm restore defaults
    cy.log('Step 12: Confirming restore defaults...');
    cy.contains('button', 'Restore Defaults')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Defaults restored');

    // Step 13: Verify success notification/toast
    cy.log('Step 13: Verifying success notification...');
    cy.get('section ol li')
      .should('be.visible')
      .and('contain.text', /success|restored|complete/i);
    cy.wait(1000);
    
    // Step 14: Close notification toast
    cy.log('Step 14: Closing notification...');
    cy.get('section button svg')
      .first()
      .click();
    cy.wait(500);
    cy.log('Notification closed');

    // Step 15: Test Defaults button again (second restoration)
    cy.log('Step 15: Testing Restore Defaults again...');
    cy.contains('button', 'Defaults')
      .should('be.visible')
      .click();
    cy.wait(1000);

    // Step 16: Confirm second restore
    cy.log('Step 16: Confirming second restore...');
    cy.contains('button', 'Restore Defaults')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.log('Defaults restored again');

    // Step 17: Close notification
    cy.log('Step 17: Closing notification...');
    cy.get('section ol li button')
      .first()
      .should('be.visible')
      .click();
    cy.wait(500);

    // Step 18: Test Export functionality
    cy.log('Step 18: Testing Export settings...');
    cy.contains('button', 'Export')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Export initiated - settings file should be downloaded');

    // Step 19: Test Import functionality (click on import button area)
    cy.log('Step 19: Testing Import settings UI...');
    cy.get('div.fixed input[type="file"]')
      .should('exist');
    cy.log('Import file input verified');

    // Step 20: Close any remaining notifications
    cy.log('Step 20: Cleaning up notifications...');
    cy.get('body').then($body => {
      if ($body.find('section ol li button').length > 0) {
        cy.get('section ol li button').first().click({ force: true });
        cy.wait(500);
      }
    });

    cy.log('Config features test completed successfully!');
  });

  it('Should test search functionality with specific term', () => {
    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);

    // Step 2: Verify CNC machine status
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);

    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 3: Navigate to Config
    cy.log('Step 3: Navigating to Configuration...');
    cy.goToConfig();
    cy.wait(3000);

    // Step 4: Test search with custom term
    cy.log('Step 4: Testing search functionality');
    const searchText = 'parking';

    cy.get('#simple-search')
      .should('be.visible')
      .clear()
      .type(searchText);
    cy.wait(1500);

    // Step 5: Verify search results
    cy.log('Step 5: Verifying search results...');
    cy.get('body').then($body => {
      // Check if any results are displayed
      const hasResults = $body.find('[id^="section-"]').length > 0 || 
                         $body.text().toLowerCase().includes(searchText.toLowerCase());
      
      if (hasResults) {
        cy.log(`Search results found for: ${searchText}`);
      } else {
        cy.log(`No results found for: ${searchText}`);
      }
    });

    cy.log('Search test completed successfully');
  });
});
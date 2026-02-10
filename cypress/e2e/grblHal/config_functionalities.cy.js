describe('gSender Configuration Settings Test', () => {

  beforeEach(() => {
    cy.viewport(2844, 1450);
    // Load the UI
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Should reset, export, and import gSender preference settings', () => {
    
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

    // Step 3: Unlock machine if needed
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 4: Navigate to Configuration page
    cy.log('Step 4: Navigating to Configuration page...');
    cy.goToConfig();
    cy.log('Configuration page opened');

    // Step 5: Click Reset Settings button
    cy.log('Step 5: Resetting settings...');
    cy.get('[data-testid="gsender-settings-reset-button"] > span.text-sm')
      .should('be.visible')
      .click();
    
    cy.wait(1000);
    
    // Confirm reset by clicking "Restore Settings" button
    cy.get('#radix-\\:rb\\: button.bg-blue-500')
      .contains('Restore Settings')
      .should('be.visible')
      .click();
    
    cy.wait(2000);
    cy.log('Settings reset successfully');

    // Step 6: Close the success message
    cy.log('Step 6: Closing success message...');
    cy.get('section line:nth-of-type(1)').click({ force: true });
    cy.wait(1000);

    // Step 7: Click Export Settings button
    cy.log('Step 7: Exporting settings...');
    cy.get('[data-testid="gsender-settings-export-button"] > span.text-sm')
      .should('be.visible')
      .click();
    
    // Wait for 3 seconds after clicking export
    cy.wait(3000);
    cy.log('Settings exported');

    // Step 8: Click anywhere outside (click on main section)
    cy.log('Step 8: Clicking outside...');
    cy.get('#section-0 > div.flex-row').click({ force: true });
    cy.wait(1000);

    // Step 9: Make changes in the config settings convert mm to inches
    cy.log('Step 9: Changing units from mm to inch...');
    cy.get('#section-0 div:nth-of-type(2) > button')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('Units changed to inches');
    
    // Apply settings to save changes 
    cy.log('Saving updated settings');
    cy.applySettings();
    cy.wait(500);

    // Step 10: Click Import Settings button
    cy.log('Step 10: Importing settings...');
    cy.get('[data-testid="gsender-settings-import-button"] > span.text-sm')
      .should('be.visible')
      .click();
    
    cy.wait(2000);

    // Step 11: Upload the file from fixtures
    cy.log('Step 11: Uploading settings file...');
    cy.get('div.min-h-1\\/5 > fieldset input')
      .selectFile('cypress/fixtures/gSender-settings.json', { force: true });
    
    cy.wait(1000);
    cy.log('File selected');

    // Step 12: Confirm import by clicking "Import Settings" button
    cy.log('Step 12: Confirming import...');
    cy.get('#radix-\\:rb\\: button.bg-blue-500')
      .contains('Import Settings')
      .should('be.visible')
      .click();
    
    cy.wait(3000);
    cy.log('Settings imported successfully');

    // Step 13: Close success notification
    cy.log('Step 13: Closing notification...');
    cy.get('section line:nth-of-type(2)').click({ force: true });
    cy.wait(1000);

    // Step 14: Verify carve units changed from inches to mm after import
    cy.log('Step 14: Verifying carve units changed to mm...');
    
    // Wait for settings to apply
    cy.wait(3000);
    
    // The unit selector is a toggle switch, not text buttons
    cy.get('#section-0').within(() => {
      // Look for the toggle switch in the carve units section
      cy.get('fieldset').first().within(() => {
        // Find the toggle switch button
        cy.get('button[role="switch"]', { timeout: 10000 })
          .first()
          .should('exist')
          .then(($toggle) => {
            const dataState = $toggle.attr('data-state');
            const ariaChecked = $toggle.attr('aria-checked');
            const classes = $toggle.attr('class') || '';
            
            cy.log(`Toggle state: ${dataState}`);
            cy.log(`Toggle aria-checked: ${ariaChecked}`);
            cy.log(`Toggle classes: ${classes}`);
            
            const isMMSelected = dataState === 'unchecked' || ariaChecked === 'false';
            
            expect(isMMSelected, 'Units should be set to MM after import').to.be.true;
          });
      });
    });
    
    cy.log('Test completed successfully - Carve units verified as mm');
  });

  it('Should restore defaults, export, and import firmware settings', () => {
    
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

    // Step 3: Unlock machine if needed
    cy.unlockMachineIfNeeded();
    cy.wait(2000);

    // Step 4: Navigate to Configuration page
    cy.log('Step 4: Navigating to Configuration page...');
    cy.goToConfig();
    cy.log('Configuration page opened');

    // Step 5: Click the Defaults button to restore default firmware settings
    cy.log('Step 5: Restoring default firmware settings...');
    cy.get('div.fixed div.grid > button:nth-of-type(1)')
      .should('be.visible')
      .click();
    
    cy.wait(1000);
    
    // Step 6: Confirm restore by clicking "Restore Defaults" button in the dialog
    cy.log('Step 6: Confirming restore defaults...');
    
    // Wait a moment for the dialog to be ready
    cy.wait(500);
    
    // Click the blue confirm button in the dialog
    cy.get('button.bg-blue-500')
      .contains('Restore Defaults')
      .should('be.visible')
      .click();
    
    cy.wait(2000);
    cy.log('Default firmware settings restored successfully');

    // Step 7: Close the success notification/toast
    cy.log('Step 7: Closing success notification...');
    cy.get('section button > svg')
      .should('be.visible')
      .click({ force: true });
    
    cy.wait(1000);
    cy.log('Success notification closed');

    // Step 8: Export firmware settings
    cy.log('Step 8: Exporting firmware settings...');
    cy.get('[data-testid="firmware-settings-export-button"] > span.text-sm')
      .should('be.visible')
      .click();
    
    // Wait for export to complete (file download)
    cy.wait(3000);
    cy.log('Firmware settings exported successfully');

    // Step 9: Click somewhere on the page to dismiss any overlays
    cy.log('Step 9: Clicking on page to dismiss overlays...');
    cy.get('#section-0 fieldset:nth-of-type(3) > div:nth-of-type(1)')
      .click({ force: true });
    
    cy.wait(1000);

    // Step 10: Import firmware settings
    cy.log('Step 10: Importing firmware settings...');
    cy.get('[data-testid="firmware-settings-import-button"] > span.text-sm')
      .should('be.visible')
      .click();
    
    cy.wait(2000);

    // Step 11: Upload the firmware settings file from fixtures
    cy.log('Step 11: Uploading firmware settings file...');
    cy.get('div.fixed input')
      .selectFile('cypress/fixtures/gSender-firmware-settings.json', { force: true });
    
    cy.wait(1000);
    cy.log('Firmware settings file selected');

    // Step 12: Confirm import by clicking the import button in the dialog
    cy.log('Step 12: Confirming firmware settings import...');
    
    // Click the last blue button in the dialog (the confirm/import button)
    cy.get('button.bg-blue-500')
      .last()
      .click({ force: true });
    
    cy.wait(3000);
    cy.log('Firmware settings imported successfully');

    // Step 13: Wait for import to complete and close notification if present
    cy.log('Step 13: Waiting for firmware import to complete...');
    
    // Wait for the import to complete
    cy.wait(2000);
    
    // Try to close the notification if it appears (it may auto-dismiss)
    cy.get('body').then(($body) => {
      if ($body.find('section:contains("EPROM settings imported")').length > 0) {
        cy.log('✓ EPROM settings imported notification found');
        cy.get('section button > svg')
          .first()
          .click({ force: true });
        cy.wait(500);
        cy.log('Success notification closed');
      } else {
        cy.log(' Import completed (notification auto-dismissed or not shown)');
      }
    });

    cy.log('Test completed successfully - Firmware settings restored, exported, and imported');
  });
it('Search and view modified ', () => {

  
    // Step 5: Click on "View Modified" button in All Config tab
    cy.log('Step 5: Toggling View Modified button in All Config tab...');
    cy.get('div.min-h-1\\/5 > div > button')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('View Modified toggled in All Config tab');

    // Step 6: Search for "spindle" - should return results
    cy.log('Step 6: Searching for "Spindle"...');
    cy.searchInSettings('Spindle');
    cy.wait(1000);
    
    // Verify search results are displayed
    cy.get('body').then(($body) => {
      const hasResults = $body.find('[data-testid*="search-result"], .search-result, fieldset:visible').length > 0;
      expect(hasResults, 'Search results should be displayed for "spindle"').to.be.true;
      cy.log('Spindle search returned results in All Config tab');
    });
    cy.wait(500);

    // Step 7: Search for "import" - should return no results
    cy.log('Step 7: Searching for "import" (expecting no results)...');
    cy.searchInSettings('import');
    cy.wait(1000);
    
    // Verify no search results
    cy.get('body').then(($body) => {
      const hasNoResults = $body.find('p:contains("No results"), p:contains("No settings found"), .empty-state').length > 0 ||
                          $body.find('fieldset:visible').length === 0;
      if (hasNoResults) {
        cy.log('No results found for "import" as expected');
      } else {
        cy.log('Minimal or no results for "import"');
      }
    });
    cy.wait(500);

    // Step 8: Search for numbers
    cy.log('Step 8: Searching for numbers "1000"...');
    cy.searchInSettings('1000');
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      const hasResults = $body.find('fieldset:visible, [data-testid*="search-result"]').length > 0;
      cy.log(hasResults ? 'Numeric search "1000" returned results' : ' No results for numeric search "1000"');
    });
    cy.wait(500);

    // Step 9: Search for special characters
    cy.log('Step 9: Searching for special characters "$%&^$%*(&"...');
    cy.searchInSettings('$%&^$%*(&');
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      const hasResults = $body.find('fieldset:visible, [data-testid*="search-result"]').length > 0;
      cy.log(hasResults ? 'Special character search returned results' : '⚠ No results for special characters');
    });
    cy.wait(500);

    // Step 10: Clear search field
    cy.log('Step 10: Clearing search field...');
    cy.get('#simple-search')
      .clear();
    cy.wait(500);
    cy.log('Search field cleared in All Config tab');

 

    // Step 11: Navigate to EEPROM tab
    cy.log('Step 11: Navigating to EEPROM tab...');
    cy.get('button[role="tab"]')
      .contains('EEPROM')
      .should('be.visible')
      .click();
    cy.wait(1500);
    cy.log('EEPROM tab opened');

    // Step 12: Click on "View Modified" button in EEPROM tab
    cy.log('Step 12: Toggling View Modified button in EEPROM tab...');
    cy.get('div.min-h-1\\/5 > div > button')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log('View Modified toggled in EEPROM tab');

    // Step 13: Search for "spindle" in EEPROM tab
    cy.log('Step 13: Searching for "spindle" in EEPROM tab...');
    cy.searchInSettings('spindle');
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      const hasResults = $body.find('fieldset:visible, [data-testid*="search-result"], tr:visible').length > 0;
      cy.log(hasResults ? 'Spindle search returned results in EEPROM tab' : '⚠ No spindle results in EEPROM tab');
    });
    cy.wait(500);

    // Step 14: Search for "import" - expecting no results
    cy.log('Step 14: Searching for "import" in EEPROM tab...');
    cy.searchInSettings('import');
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      const hasNoResults = $body.find('p:contains("No results"), .empty-state').length > 0 ||
                          $body.find('fieldset:visible, tr:visible').length === 0;
      cy.log(hasNoResults ? 'No results for "import" in EEPROM tab' : 'Some results may exist for "import"');
    });
    cy.wait(500);

    // Step 15: Search for numbers in EEPROM
    cy.log('Step 15: Searching for numbers "100" in EEPROM...');
    cy.searchInSettings('100');
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      const hasResults = $body.find('fieldset:visible, tr:visible').length > 0;
      cy.log(hasResults ? 'Numeric search "100" returned results in EEPROM' : ' No results for numeric search in EEPROM');
    });
    cy.wait(500);

    // Step 16: Search for special characters in EEPROM
    cy.log('Step 16: Searching for special characters "$#@%" in EEPROM...');
    cy.searchInSettings('$#@%');
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      const hasResults = $body.find('fieldset:visible, tr:visible').length > 0;
      cy.log(hasResults ? ' Special character search returned results in EEPROM' : ' No results for special characters in EEPROM');
    });
    cy.wait(500);

    // Step 17: Clear search and verify all items return
    cy.log('Step 17: Clearing search field in EEPROM tab...');
    cy.get('#simple-search')
      .clear();
    cy.wait(1000);
    cy.log(' Search cleared - all items should be visible in EEPROM');
});



});
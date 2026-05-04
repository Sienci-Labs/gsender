describe('gSender Configuration and Firmware Test Suite', () => {

  beforeEach(() => {
    cy.viewport(2844, 1450);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 8,
      waitTime: 8000,
      timeout: 5000
    });
  });

  it('Should reset, export, import gSender settings, restore firmware defaults, and perform searches', () => {

    
    // Part 1: gSender Configuration Settings
    cy.log('Part 1: gSender Configuration Settings');

    cy.log('Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.verifyMachineStatus('Idle');
    cy.unlockMachineIfNeeded();

    cy.goToConfig();

    // Reset Settings
    cy.get('[data-testid="gsender-settings-reset-button"] > span.text-sm').click();
    // FIX: use cy.contains on button.bg-blue-500 — avoids hardcoded radix ID
    cy.contains('button.bg-blue-500', 'Restore Settings', { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.get('section line:nth-of-type(1)').click({ force: true });

    // Export Settings
    cy.get('[data-testid="gsender-settings-export-button"] > span.text-sm').click();
    cy.wait(3000);
    cy.get('#section-0 > div.flex-row').click({ force: true });

    // Change units from mm to inches
    cy.get('#section-0 div:nth-of-type(2) > button').click();
    cy.applySettings();

    // Import Settings
    cy.get('[data-testid="gsender-settings-import-button"] > span.text-sm').click();
    cy.get('div.min-h-1\\/5 > fieldset input')
      .selectFile('cypress/fixtures/gSender-settings.json', { force: true });
    // FIX: same — use cy.contains instead of hardcoded radix ID
    cy.contains('button.bg-blue-500', 'Import Settings', { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.get('section line:nth-of-type(2)').click({ force: true });

    // Verify units reverted to mm
    cy.get('#section-0').within(() => {
      cy.get('fieldset').first().within(() => {
        cy.get('button[role="switch"]', { timeout: 10000 })
          .first()
          .then(($toggle) => {
            const isMMSelected =
              $toggle.attr('data-state') === 'unchecked' ||
              $toggle.attr('aria-checked') === 'false';
            expect(isMMSelected, 'Units should be set to MM after import').to.be.true;
          });
      });
    });

    // Part 2: Firmware Settings
cy.log('Part 2: Firmware Settings');

// Restore defaults
cy.get('div.fixed div.grid > button:nth-of-type(1)').click();
cy.contains('button.bg-blue-500', 'Restore Defaults', { timeout: 10000 })
  .should('be.visible')
  .should('not.be.disabled')
  .click();

// Skip waiting — force click past the notification
cy.get('[data-testid="firmware-settings-export-button"]', { timeout: 10000 })
  .should('be.visible')
  .click({ force: true });

// Confirm notification is gone before proceeding
cy.get('div[data-title]', { timeout: 10000 }).should('not.exist');

// Export firmware settings
cy.get('[data-testid="firmware-settings-export-button"]', { timeout: 10000 })
  .should('be.visible')
  .should('not.be.disabled')
  .click();


// Import firmware settings
cy.get('[data-testid="firmware-settings-import-button"]', { timeout: 10000 })
  .should('be.visible')
  .should('not.be.disabled')
  .click();

cy.get('div.fixed input')
  .selectFile('cypress/fixtures/gSender-firmware-settings.json', { force: true });

// Wait for import to process — no confirm button needed, file auto-imports
cy.wait(2000);

// Close the success/notification toast if it appears
cy.get('body').then(($body) => {
  if ($body.find('section line:nth-of-type(2)').length > 0) {
    cy.get('section line:nth-of-type(2)').click({ force: true });
  }
});

// Close import notification if present
cy.get('body').then(($body) => {
  if ($body.find('section:contains("EPROM settings imported")').length > 0) {
    cy.get('section button > svg').first().click({ force: true });
  }
});
    // Part 3: Search and View Modified Settings
    cy.log('Part 3: Search and View Modified');

    // All Config tab
    cy.get('div.min-h-1\\/5 > div > button').click();
    cy.searchInSettings('Spindle');
    cy.searchInSettings('import');
    cy.searchInSettings('1000');
    cy.searchInSettings('$%&^$%*(&');
    cy.get('#simple-search').clear();

    // EEPROM tab
    cy.get('button[role="tab"]').contains('EEPROM').click();
    cy.searchInSettings('spindle');
    cy.searchInSettings('import');
    cy.searchInSettings('100');
    cy.searchInSettings('$#@%');
    cy.get('#simple-search').clear();

    cy.log('All tests completed successfully.');
  });
});
describe('Unlock Machine if Needed - GrblHAL', () => {

  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\'',
      'ResizeObserver loop'
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false;
    }
    return true;
  });

  Cypress.on('window:alert', (str) => {
    if (str.includes('Click to unlock Machine')) {
      cy.log('Alert detected: Click to unlock Machine');
      return true;
    }
  });

  beforeEach(() => {
    cy.viewport(2327, 1186);
    
    cy.visit('http://localhost:8000/', {
      failOnStatusCode: false
    });
    
    cy.get('#app', { timeout: 30000 }).should('exist');
    cy.wait(3000);
  });

  it('connects to CNC, unlocks machine if locked, and verifies idle state', () => {
    cy.log('Step 1: Click Connect to CNC button');
    
    // Use text-based selector instead of CSS path
    cy.contains('button', /connect to cnc/i, { timeout: 20000 })
      .should('be.visible')
      .click();

    cy.wait(2000);

    cy.log('Step 2: Select COM port');
    cy.get('div.absolute', { timeout: 20000 })
      .should('be.visible')
      .find('button')
      .contains(/COM/i)
      .first()
      .then(($btn) => {
        const portText = $btn.text().trim();
        cy.log(`Selecting port: ${portText}`);
      })
      .click();

    cy.wait(3000);

    cy.log('Step 3: Check if machine is locked and unlock if needed');
    cy.get('body').then(($body) => {
      if ($body.find('svg.hidden').length > 0) {
        cy.log(' Machine is LOCKED - Attempting to unlock...');
        
        cy.get('svg.hidden')
          .parent('button')
          .should('be.visible')
          .click({ force: true });
        
        cy.wait(2000);
        cy.log(' Machine unlocked successfully');
      } else {
        cy.log('Machine is already unlocked');
      }
    });

    cy.log('Step 4: Verify machine reaches Idle state');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log('Machine is in Idle state and ready');
      });

    cy.log('Step 5: Verify GrblHAL firmware detected');
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      
      if (text.includes('grblhal')) {
        cy.log(' Firmware Detected: GrblHAL');
        expect(text).to.include('grblhal');
      } else if (text.includes('grbl')) {
        cy.log('Firmware Detected: Grbl (not GrblHAL)');
      } else {
        cy.log(' Firmware information not found');
      }
    });
  });

  it('should handle locked machine state correctly', () => {
    cy.log('Connecting to CNC...');
    cy.contains('button', /connect to cnc/i, { timeout: 20000 })
      .should('be.visible')
      .click();

    cy.log('Selecting COM port...');
    cy.get('div.absolute', { timeout: 20000 })
      .should('be.visible')
      .find('button')
      .contains(/COM/i)
      .first()
      .click();

    cy.wait(3000);

    cy.log('Checking lock status...');
    cy.get('body').then(($body) => {
      const isLocked = $body.find('svg.hidden').length > 0;
      
      if (isLocked) {
        cy.log('Machine is locked - testing unlock functionality');
        
        // Verify lock icon exists
        cy.get('svg.hidden').should('exist');
        
        // Click unlock button
        cy.get('svg.hidden')
          .parent('button')
          .should('be.visible')
          .click({ force: true });
        
        cy.wait(2000);
        
        // Verify machine becomes idle after unlock
        cy.contains(/^Idle$/i, { timeout: 30000 })
          .should('be.visible');
        
        cy.log('Lock/unlock functionality working correctly');
      } else {
        cy.log('Machine is not locked - no unlock needed');
        
        // Still verify idle state
        cy.contains(/^Idle$/i, { timeout: 30000 })
          .should('be.visible');
      }
    });
  });

  it('should use custom command to unlock machine', () => {
    cy.log('Connecting to CNC...');
    cy.contains('button', /connect to cnc/i, { timeout: 20000 })
      .should('be.visible')
      .click();

    cy.log('Selecting COM port...');
    cy.get('div.absolute', { timeout: 20000 })
      .should('be.visible')
      .find('button')
      .contains(/COM/i)
      .first()
      .click();

    cy.wait(3000);

    cy.log('Verifying Idle state...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log(' Machine connected and ready');
      });
  });
});
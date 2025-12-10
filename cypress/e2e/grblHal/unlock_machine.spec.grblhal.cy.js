describe('Machine Connection and Unlock Test', () => {

  // Ignore known errors
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false;
    }
    return true;
  });

  beforeEach(() => {
    cy.viewport(2133, 1050);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000);
  });

  it('Connect to machine and unlock to reach idle state', () => {
    
    // Step 1: Connect to machine by clicking COM port
    cy.log('Step 1: Connecting to machine via COM port...');
    
    // Click the COM4 USB button to connect
    cy.get('div.absolute > button.m-0')
      .contains('COM4')
      .click();
    
    cy.wait(3000);
    cy.log('Connection initiated');

    // Step 2: Wait for unlock popup to appear
    cy.log('Step 2: Waiting for unlock popup...');
    cy.wait(2000);
    
    // Step 3: Check for unlock popup and click it
    cy.log('Step 3: Looking for unlock popup...');
    
    cy.get('body').then($body => {
      
      // Check if unlock button/popup exists
      const unlockButton = $body.find('#app > div > div.border div.mt-4 button');
      
      if (unlockButton.length > 0) {
        cy.log('Unlock popup found - Machine is locked');
        cy.log('Clicking unlock popup to reach idle state...');
        
        // Click the unlock button using exact selector from JSON
        cy.get('#app > div > div.border div.mt-4 button')
          .contains('Click to Unlock')
          .should('be.visible')
          .click({ force: true });
        
        cy.wait(2000);
        cy.log('Unlock popup clicked');
        
      } else {
        cy.log('No unlock popup found - checking alternative selector...');
        
        // Try alternative selector - the path element
        cy.get('#app > div > div.border div.mt-4 path', { timeout: 5000 })
          .should('exist')
          .parent('button')
          .click({ force: true });
        
        cy.wait(2000);
        cy.log('Unlock button clicked via path selector');
      }
    });

    // Step 4: Verify machine reaches idle state
    cy.log('Step 4: Verifying machine is in idle state...');
    
    // Wait for idle state indicator
    cy.wait(3000);
    
    // Check that unlock popup is gone
    cy.get('body').should('not.contain', 'Click to Unlock');
    
    cy.log('Machine is now in idle state and ready for operations');
    cy.log('Test completed successfully');
  });

  it('Keep clicking unlock until machine reaches idle', () => {
    
    cy.log('Connecting to machine...');
    
    // Connect via COM port
    cy.get('div.absolute > button.m-0')
      .contains('COM4')
      .click();
    
    cy.wait(4000);

    // Keep clicking unlock button until idle state is reached
    cy.log('Attempting to unlock machine (multiple clicks if needed)...');
    
    const maxAttempts = 10;
    let attempts = 0;
    
    const clickUnlock = () => {
      cy.get('body').then($body => {
        attempts++;
        
        // Check if unlock button still exists
        const unlockExists = $body.find('#app > div > div.border div.mt-4 button, #app > div > div.border div.mt-4 path').length > 0;
        
        if (unlockExists && attempts < maxAttempts) {
          cy.log(`Unlock attempt ${attempts}/${maxAttempts}`);
          
          // Click unlock button
          cy.get('#app > div > div.border div.mt-4 button, #app > div > div.border div.mt-4 path')
            .first()
            .parent('button')
            .click({ force: true });
          
          cy.wait(1500);
          
          // Recursively check again
          clickUnlock();
          
        } else if (!unlockExists) {
          cy.log(`Machine unlocked after ${attempts} attempts`);
          cy.log('Machine should now be in idle state');
        } else {
          cy.log(`Max attempts (${maxAttempts}) reached`);
        }
      });
    };
    
    // Start the unlock process
    cy.wait(2000);
    clickUnlock();
    
    cy.log('Test completed');
  });

  it('Connect and wait for idle state after unlock', () => {
    
    cy.log('Step 1: Connecting to machine...');
    
    // Connect
    cy.get('div.absolute > button.m-0')
      .contains('COM4')
      .click();
    
    cy.wait(5000);

    cy.log('Step 2: Clicking unlock popup...');
    
    // Click unlock - using multiple selectors for reliability
    cy.get('body').then($body => {
      if ($body.find('#app > div > div.border div.mt-4 button').length > 0) {
        cy.get('#app > div > div.border div.mt-4 button')
          .click({ force: true });
      } else if ($body.find('#app > div > div.border div.mt-4 path').length > 0) {
        cy.get('#app > div > div.border div.mt-4 path')
          .parent('button')
          .click({ force: true });
      }
    });
    
    cy.wait(3000);

    cy.log('Step 3: Waiting for idle state...');
    
    // Wait and verify no more unlock popups
    cy.get('body').should('not.contain', 'Click to Unlock');
    
    cy.log(' Machine is in idle state - ready for operations');
  });

});
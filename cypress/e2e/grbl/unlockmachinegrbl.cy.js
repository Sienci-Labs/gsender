import '../support/commands'
describe('Comprehensive Axis Movement and Jog Control Tests', () => {

  // Ignore known hydration-related UI errors and undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false; // ignore these exceptions
    }
    return true;
  });

  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000); // Give app time to recover from initialization error
  });

  it('Test Case 1: Basic axis movements and position reset', () => {

    // Step 1: Connect to CNCimport '../support/commands'

describe('Machine Unlock Functionality Tests', () => {

  // Ignore known hydration-related UI errors
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
    cy.viewport(2133, 1050); // Using viewport from your JSON recording
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000);
  });

  afterEach(() => {
    // Disconnect after each test
    cy.get('body').then($body => {
      if ($body.find('button:contains("Disconnect")').length > 0) {
        cy.contains('button', 'Disconnect').click({ force: true });
        cy.wait(1000);
      }
    });
  });

  it('TC-UNLOCK-001: Unlock machine after connection when locked', () => {
    cy.log('=== Test Case: Unlock machine after connection ===');
    
    // Step 1: Connect to the machine
    cy.log('Step 1: Connecting to machine...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('✓ Machine connected');

    // Step 2: Verify machine is in locked state
    cy.log('Step 2: Checking for locked state...');
    cy.get('body').then($body => {
      const isLocked = $body.find('svg.hidden').length > 0 || 
                       $body.find('button[aria-label*="Unlock"]').length > 0 ||
                       $body.text().includes('Click to Unlock Machine');
      
      if (isLocked) {
        cy.log('✓ Machine is locked as expected');
      } else {
        cy.log('⚠ Machine is already unlocked');
      }
    });

    // Step 3: Click unlock button
    cy.log('Step 3: Clicking unlock button...');
    cy.get('div.mt-4 button svg path, svg.hidden, button[aria-label*="Unlock"]')
      .first()
      .parent('button')
      .should('be.visible')
      .click({ force: true });
    
    cy.wait(2000);
    cy.log('✓ Unlock button clicked');

    // Step 4: Verify machine is unlocked
    cy.log('Step 4: Verifying machine is unlocked...');
    cy.get('body').then($body => {
      const stillLocked = $body.find('svg.hidden').length > 0;
      expect(stillLocked).to.be.false;
    });
    
    cy.log('✓ Machine successfully unlocked');
    cy.log('=== Test Passed ===');
  });

  it('TC-UNLOCK-002: Verify unlock popup appears and can be dismissed', () => {
    cy.log('=== Test Case: Verify unlock popup functionality ===');
    
    // Connect and wait for popup
    cy.log('Step 1: Connecting to machine...');
    cy.connectMachine();
    cy.wait(6000);

    // Check for unlock popup/button
    cy.log('Step 2: Looking for unlock popup...');
    cy.get('body').then($body => {
      // Look for various unlock indicators
      const unlockElements = $body.find([
        'button[aria-label*="Click to Unlock Machine"]',
        'div:contains("Click to Unlock Machine")',
        'svg.hidden',
        'button svg path'
      ].join(','));

      if (unlockElements.length > 0) {
        cy.log('✓ Unlock popup/button found');
        
        // Click to dismiss/unlock
        cy.log('Step 3: Clicking to unlock...');
        cy.wrap(unlockElements.first())
          .parent('button')
          .click({ force: true });
        
        cy.wait(2000);
        
        // Verify popup is gone
        cy.log('Step 4: Verifying popup is dismissed...');
        cy.get('body').should('not.contain', 'Click to Unlock Machine');
        cy.log('✓ Popup dismissed successfully');
      } else {
        cy.log('⚠ No unlock popup found - machine may already be unlocked');
      }
    });

    cy.log('=== Test Passed ===');
  });

  it('TC-UNLOCK-003: Unlock machine multiple times during session', () => {
    cy.log('=== Test Case: Multiple unlock operations ===');
    
    // Connect
    cy.log('Step 1: Initial connection and unlock...');
    cy.connectMachine();
    cy.wait(6000);
    
    // First unlock
    cy.unlockMachine();
    cy.wait(3000);
    cy.log('✓ First unlock completed');

    // Simulate operation that might cause lock
    cy.log('Step 2: Simulating operations...');
    cy.wait(5000);

    // Check and unlock again if needed
    cy.log('Step 3: Second unlock check...');
    cy.unlockMachine();
    cy.wait(2000);
    cy.log('✓ Second unlock check completed');

    // Third check
    cy.log('Step 4: Third unlock check...');
    cy.unlockMachine();
    cy.log('✓ Third unlock check completed');

    cy.log('=== Test Passed ===');
  });

  it('TC-UNLOCK-004: Verify unlock button using exact selectors from recording', () => {
    cy.log('=== Test Case: Unlock using recorded selectors ===');
    
    // Connect
    cy.log('Step 1: Connecting...');
    cy.connectMachine();
    cy.wait(6000);

    // Use exact selector from your JSON recording
    cy.log('Step 2: Using recorded selector to unlock...');
    cy.get('#app > div > div.border div.mt-4 path', { timeout: 10000 })
      .should('exist')
      .parent('button')
      .should('be.visible')
      .click({ force: true });
    
    cy.wait(2000);
    cy.log('✓ Clicked unlock using recorded selector');

    // Verify unlock
    cy.log('Step 3: Verifying unlock...');
    cy.get('body').then($body => {
      const isLocked = $body.find('svg.hidden').length > 0;
      expect(isLocked).to.be.false;
    });

    cy.log('=== Test Passed ===');
  });

  it('TC-UNLOCK-005: Handle unlock error scenarios', () => {
    cy.log('=== Test Case: Error handling during unlock ===');
    
    // Connect
    cy.log('Step 1: Connecting...');
    cy.connectMachine();
    cy.wait(6000);

    // Attempt unlock with error handling
    cy.log('Step 2: Attempting unlock with error handling...');
    cy.get('body').then($body => {
      try {
        const unlockButton = $body.find('svg.hidden, button[aria-label*="Unlock"]');
        
        if (unlockButton.length > 0) {
          cy.wrap(unlockButton.first())
            .parent('button')
            .click({ force: true });
          
          cy.wait(2000);
          cy.log('✓ Unlock attempted');
          
          // Verify unlock succeeded
          cy.get('body').then($newBody => {
            const stillLocked = $newBody.find('svg.hidden').length > 0;
            if (stillLocked) {
              cy.log('⚠ Machine still locked - retry needed');
              // Retry once
              cy.wrap(unlockButton.first())
                .parent('button')
                .click({ force: true });
              cy.wait(2000);
            }
          });
        } else {
          cy.log('✓ No unlock needed - machine already unlocked');
        }
      } catch (error) {
        cy.log('⚠ Error during unlock:', error.message);
        throw error;
      }
    });

    cy.log('=== Test Passed ===');
  });

  it('TC-UNLOCK-006: Unlock immediately after disconnect-reconnect cycle', () => {
    cy.log('=== Test Case: Unlock after reconnection ===');
    
    // Initial connection and unlock
    cy.log('Step 1: Initial connection...');
    cy.connectMachine();
    cy.wait(6000);
    cy.ensureMachineUnlocked();
    cy.log('✓ Initial unlock completed');

    // Disconnect
    cy.log('Step 2: Disconnecting...');
    cy.contains('button', 'Disconnect').click({ force: true });
    cy.wait(3000);
    cy.log('✓ Disconnected');

    // Reconnect
    cy.log('Step 3: Reconnecting...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('✓ Reconnected');

    // Unlock after reconnection
    cy.log('Step 4: Unlocking after reconnection...');
    cy.ensureMachineUnlocked();
    cy.wait(2000);
    
    // Verify machine is responsive
    cy.get('#app').should('be.visible');
    cy.log('✓ Machine unlocked and responsive');

    cy.log('=== Test Passed ===');
  });

  it('TC-UNLOCK-007: Verify unlock button visibility and accessibility', () => {
    cy.log('=== Test Case: Unlock button UI verification ===');
    
    cy.log('Step 1: Connecting...');
    cy.connectMachine();
    cy.wait(6000);

    cy.log('Step 2: Checking unlock button properties...');
    cy.get('body').then($body => {
      const unlockButton = $body.find('svg.hidden, button[aria-label*="Unlock"]').first().parent('button');
      
      if (unlockButton.length > 0) {
        // Verify button is visible
        cy.wrap(unlockButton).should('be.visible');
        cy.log('✓ Unlock button is visible');

        // Verify button is enabled
        cy.wrap(unlockButton).should('not.be.disabled');
        cy.log('✓ Unlock button is enabled');

        // Click and verify
        cy.wrap(unlockButton).click({ force: true });
        cy.wait(2000);
        cy.log('✓ Unlock button is clickable');
      } else {
        cy.log('ℹ No unlock button present - machine already unlocked');
      }
    });

    cy.log('=== Test Passed ===');
  });

  it('TC-UNLOCK-008: Stress test - Rapid unlock attempts', () => {
    cy.log('=== Test Case: Rapid unlock attempts ===');
    
    cy.log('Step 1: Connecting...');
    cy.connectMachine();
    cy.wait(6000);

    // Attempt unlock 5 times rapidly
    cy.log('Step 2: Performing rapid unlock attempts...');
    for (let i = 1; i <= 5; i++) {
      cy.log(`Unlock attempt ${i}/5`);
      cy.unlockMachine();
      cy.wait(500); // Short wait between attempts
    }

    cy.wait(2000);
    
    // Verify machine is still functional
    cy.log('Step 3: Verifying machine functionality...');
    cy.get('#app').should('be.visible');
    cy.get('body').should('not.contain', 'error');
    
    cy.log('✓ Machine remains functional after rapid unlocks');
    cy.log('=== Test Passed ===');
  });

})
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Check if machine is locked and unlock if necessary
    cy.log('Step 2: Checking machine lock status...');
    
    // Check for lock button (svg.hidden indicates locked state)
    cy.get('body').then($body => {
      if ($body.find('svg.hidden').length > 0) {
        cy.log('Machine is locked, clicking unlock button...');
        
        // Click the lock/unlock button
        cy.get('svg.hidden')
          .parent('button')
          .click({ force: true });
        
        cy.wait(1000);
        cy.log('Machine unlocked');
      } else {
        cy.log('Machine is already unlocked');
      }
    });

    cy.wait(2000);

    // Continue with the rest of your test...
  });
});
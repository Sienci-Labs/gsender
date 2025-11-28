describe('Connect To CNC and Detect Firmware', () => {

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
    cy.viewport(1280, 800);
    
    cy.visit('http://localhost:8000/#/', {
      failOnStatusCode: false
    });
    
    cy.get('#app', { timeout: 30000 }).should('exist');
    cy.wait(3000);
  });

  it('connects to CNC, selects COM port, and detects firmware', () => {
    cy.wait(5000);

    cy.log('Checking for Connect button...');
    // Find the Connect button by its SVG icon and parent container
    cy.get('svg[viewBox="0 0 256 256"]', { timeout: 20000 })
      .parents('div.h-12.max-xl\\:h-10')
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.log('Connect button clicked — selecting COM port...');
    cy.get('div.absolute', { timeout: 20000 })
      .should('be.visible')
      .find('button')
      .first()
      .should('contain.text', 'COM')
      .then(($btn) => {
        const portName = $btn.text().trim();
        cy.log(`Selecting port: ${portName}`);
        cy.wrap($btn).click();
      });

    cy.wait(2000);

    // Check for unlock button and click it if present
    cy.log('Checking if machine needs to be unlocked...');
    cy.get('body').then(($body) => {
      // Look for the unlock button with multiple possible selectors
      const unlockButtonSelectors = [
        'button:contains("Unlock")',
        'button:contains("Click to unlock")',
        '[aria-label*="unlock" i]',
        'button[class*="unlock" i]'
      ];

      let foundUnlock = false;

      unlockButtonSelectors.forEach(selector => {
        if ($body.find(selector).length > 0) {
          cy.log('Unlock button found, clicking it...');
          cy.get(selector, { timeout: 5000 })
            .first()
            .should('be.visible')
            .click({ force: true });
          foundUnlock = true;
          cy.wait(2000);
          cy.log(' Machine unlocked');
          return false; // break the loop
        }
      });

      if (!foundUnlock) {
        cy.log(' Machine already unlocked or no unlock needed');
      }
    });

    // Wait for Idle state
    cy.log('Waiting for machine to reach Idle state...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log(' CNC machine connected successfully and is in Idle state');
      });

    cy.wait(2000);

    // Detect firmware
    cy.log('Detecting firmware...');
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();

      if (text.includes('grblhal')) {
        cy.log(' Firmware Detected: GrblHAL');
      } else if (text.includes('grbl')) {
        cy.log('Firmware Detected: Grbl');
      } else {
        cy.log('Firmware information not found.');
      }
    });
  });
});
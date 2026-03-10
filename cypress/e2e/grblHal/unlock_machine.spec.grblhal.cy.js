describe('Machine Connection and Unlock Test', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Connect to machine and unlock if needed', () => {
    
    // Get device prefix from environment variable
    const devicePrefix = Cypress.env('devicePrefix') || 'COM';
    
    cy.wait(3000);

    // Step 1: Click "Connect to CNC" button first
    cy.log('Step 1: Clicking Connect to CNC button...');
    cy.contains(/^connect to CNC$/i, { timeout: 20000 })
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);

    // Step 2: Select device from the connection dialog
    cy.log(`Step 2: Selecting device with prefix: ${devicePrefix}...`);
    
    cy.get('div.absolute', { timeout: 20000 })
      .should('be.visible')
      .find('button')
      .then(($buttons) => {
        // Find the button that contains the device prefix
        const matchingButton = $buttons.filter((i, btn) => 
          btn.textContent.includes(devicePrefix)
        );
        
        if (matchingButton.length > 0) {
          const portName = matchingButton.first().text().trim();
          cy.log(`Selecting port: ${portName}`);
          cy.wrap(matchingButton.first()).click({ force: true });
        } else {
          cy.log(`No device found with prefix: ${devicePrefix}`);
          throw new Error(`No device found with prefix: ${devicePrefix}`);
        }
      });
    
    cy.wait(4000);
    cy.log('Connection initiated');

    // Step 3: Check if unlock/homing is needed and click if it appears
    cy.log('Step 3: Checking if machine needs to be unlocked or homed...');
    
    cy.get('body').then($body => {
      // Check for the specific unlock/homing button with SVG icon
      const unlockButton = $body.find('button.border-red-800.bg-red-600 svg');
      
      if (unlockButton.length > 0) {
        cy.log('Unlock/Homing button found - clicking to unlock machine...');
        
        // Click the button that contains the SVG (the unlock/homing button)
        cy.get('button.border-red-800.bg-red-600')
          .should('be.visible')
          .click({ force: true });
        
        cy.wait(3000);
        cy.log('Unlock/Homing button clicked');
      } else {
        cy.log('No unlock needed - machine is already unlocked');
      }
    });

    // Step 4: Verify machine reaches idle state
    cy.log('Step 4: Waiting for machine to reach idle state...');
    
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log('Machine is in Idle state and ready for operations');
      });
    
    cy.log('Test completed successfully');
  });

});
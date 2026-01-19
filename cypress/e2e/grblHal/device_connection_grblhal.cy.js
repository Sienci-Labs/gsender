describe('Connect To CNC and Detect Firmware', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('connects to CNC, selects device port, and detects firmware', () => {
    cy.wait(5000);

    // Get device name pattern from environment variable
    // Default to 'COM' for Windows if not specified
    const devicePattern = Cypress.env('deviceName') || 'COM';
    
    cy.log(`Using device pattern: ${devicePattern}`);
    cy.log('Checking for Connect button...');
    
    cy.contains(/^connect to CNC$/i, { timeout: 20000 })
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.log('Connect button clicked — selecting device port...');
    cy.get('div.absolute', { timeout: 20000 })
      .should('be.visible')
      .find('button')
      .first()
      .should('contain.text', devicePattern)
      .then(($btn) => {
        const portName = $btn.text().trim();
        cy.log(`Selecting port: ${portName}`);
        $btn.click();
      });

    cy.unlockMachineIfNeeded(); //Unlock if there are any errors 

    cy.log('Waiting for machine to reach Idle state...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log('CNC machine connected successfully and is in Idle state');
      });

    cy.wait(2000);

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();

      if (text.includes('grblhal')) {
        cy.log('Firmware Detected: GrblHAL');
      } else if (text.includes('grbl')) {
        cy.log('Firmware Detected: Grbl');
      } else {
        cy.log('Firmware information not found.');
      }
    });
  });
});
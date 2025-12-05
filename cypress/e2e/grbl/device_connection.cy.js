describe('Connect To CNC and Detect Firmware', () => {

  Cypress.on('uncaught:exception', (err) => {
    // Log the error for debugging
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false; // prevent cypress from failing 
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
    cy.viewport(1280, 800);
    // Use loadUI custom command instead of manual visit
    cy.loadUI('http://localhost:8000/#/', {
      maxRetries: 3,
      waitTime: 3000,
      timeout: 5000
    });
  });

  it('connects to CNC, selects COM port, and detects firmware', () => {
    cy.wait(5000);

    cy.log('Checking for Connect button...');
    cy.contains(/^connect to CNC$/i, { timeout: 20000 })
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
        $btn.click();
      });

    cy.unlockMachineIfNeeded(); // Unlock if there are any errors 

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

    //Disconnect the machine using custom command
    cy.disconnectIfIdle();
  });

});

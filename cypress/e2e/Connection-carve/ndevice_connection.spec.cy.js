describe('Connect To CNC and Detect Firmware', () => {

  Cypress.on('uncaught:exception', (err) => {
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating'
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
    cy.viewport(1280, 800);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
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

    cy.log('Waiting for machine to reach Idle state...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => {
        cy.log(' CNC machine connected successfully and is in Idle state');
      });

    // ---------------------------
    //  Firmware Detection Step
    // ---------------------------
   cy.wait(2000); // wait a moment for firmware text to load

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();

      if (text.includes('grblhal')) {
        cy.log(' Firmware Detected: GrblHAL');
      } else if (text.includes('grbl')) {
        cy.log(' Firmware Detected: Grbl');
      } else {
        cy.log('Firmware information not found.');
      }
    });
  });

});

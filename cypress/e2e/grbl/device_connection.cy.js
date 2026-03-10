describe('Device Connection', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('should connect to CNC machine by selecting the first available port', () => {
    //  Step 1: Click "Connect to CNC" button 
    cy.contains('span', 'Connect to CNC', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    // Step 2: Wait for the radix popper div to appear 
    cy.get('div[data-radix-popper-content-wrapper]', { timeout: 10000 })
      .should('exist')
      .and('be.visible')
      .within(() => {

        //0 Step 3: Get the first port button inside the popper 
        cy.get('button.m-0')
          .should('have.length.greaterThan', 0)
          .first()
          .then(($btn) => {

            // Step 4: Read and log the port label — no assertion on name 
            const $label = $btn.find('span.font-bold');
            const portName = $label.length > 0
              ? $label.text().trim()
              : $btn.text().trim();

            cy.log(`Selecting first available port: "${portName}"`);

            // Step 5: Click whatever port is listed first 
            cy.wrap($btn).click({ force: true });
          });
      });

    // Step 6: Confirm machine reaches Idle state after connecting 
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(() => cy.log('CNC machine connected and in Idle state'));

    // Step 7: Find the connected device button
    cy.get(
      'button:has(.w-full.flex.h-full.transition-opacity.duration-200.rounded.items-center.font-normal.justify-center.absolute.top-0.left-0.opacity-0.bg-red-600.text-white.z-20)',
      { timeout: 10000 }
    )
      .should('exist')
      .then(($deviceBtn) => {

        // Step 8: Extract only the firmware name (grbl or grblHAL) 
        // Full button text is e.g. "COM4grblHALDisconnect" — strip port and
        // "Disconnect" to isolate just the firmware label
        const fullText = $deviceBtn.text().trim();
        const firmwareMatch = fullText.match(/grbl(hal)?/i);

        expect(firmwareMatch).to.not.be.null;

        const firmware = firmwareMatch[0];
        cy.log(`Firmware detected: "${firmware}"`);

        // Step 9: Assert firmware is grbl or grblHAL 
        expect(firmware).to.match(
          /^grbl(hal)?$/i,
          `Expected firmware to be "grbl" or "grblHAL" but got "${firmware}"`
        );

        cy.log(`Firmware "${firmware}" confirmed — assertion passed`);
      });

      //Disconnect the machine using custom command
    cy.disconnectIfIdle();
  });
});
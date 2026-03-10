describe('Device Connection', () => {
  beforeEach(() => {
    cy.viewport(2133, 1050);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('should connect to CNC machine by selecting the first available port', () => {

    cy.wait(2000);

    cy.get('body').then(($body) => {
      const bodyText = $body.text();

      // ── Already connected and Idle
      if (/\bIdle\b/i.test(bodyText)) {
        cy.log('Machine is already connected and in Idle state');
        return;
      }

      // ── Connected but not yet Idle
      if (/\bDisconnect\b/i.test(bodyText)) {
        cy.log('Machine connected — waiting for Idle...');
        cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
        return;
      }

      // ── Not connected — start flow
      cy.log('Not connected. Starting connection flow...');

      // Step 1: Click "Connect to CNC"
      cy.contains('span', 'Connect to CNC', { timeout: 10000 })
        .should('exist')
        .scrollIntoView()
        .click({ force: true });

      // Step 2: Wait for Radix dropdown to appear
      cy.get('div[data-radix-popper-content-wrapper]', { timeout: 10000 })
        .should('exist')
        .within(() => {

          // Step 3: Get all port buttons (button.m-0 confirmed from recording)
          cy.get('button.m-0')
            .should('have.length.greaterThan', 0)
            .then(($buttons) => {

              // Step 4: Filter out non-port UI buttons
              const NON_PORT_LABELS = [
                'back', 'refresh', 'cancel', 'close', 'ok',
                'done', 'connect', 'disconnect', 'next', 'previous'
              ];

              const portButtons = $buttons.toArray().filter((btn) => {
                const text = (btn.textContent || '').trim().toLowerCase();
                return (
                  text.length > 0 &&
                  !NON_PORT_LABELS.some((label) => text === label)
                );
              });

              expect(
                portButtons.length,
                'No port buttons found in dropdown'
              ).to.be.greaterThan(0);

              // Step 5: Select first port — works on all OS
              // Windows → COM4, Linux → ttyUSB0, macOS → cu.usbmodem
              const firstPort = portButtons[0];
              const portName = (firstPort.textContent || '').trim();
              cy.log(`Selecting first available port: "${portName}"`);

              cy.wrap(firstPort).click({ force: true });
            });
        });

      // Step 6: Wait for Idle state
      cy.log('Waiting for Idle state...');
      cy.contains(/^Idle$/i, { timeout: 30000 })
        .should('be.visible')
        .then(() => cy.log('Machine connected and in Idle state'));

      // Step 7: Verify firmware from connected device button
      cy.get('div.group', { timeout: 10000 })
        .should('exist')
        .then(($groups) => {

          // Find the div.group whose text contains grbl firmware info
          const deviceGroup = $groups.toArray().find((el) => {
            const text = (el.textContent || '').trim();
            return /grbl(hal)?/i.test(text);
          });

          expect(
            deviceGroup,
            'Could not find a connected device button containing grbl/grblHAL firmware'
          ).to.not.be.undefined;

          const fullText = (deviceGroup.textContent || '').trim();
          cy.log(`Device button text: "${fullText}"`);

          const firmwareMatch = fullText.match(/grbl(hal)?/i);
          const firmware = firmwareMatch[0];
          cy.log(`Firmware detected: "${firmware}"`);

          expect(firmware).to.match(
            /^grbl(hal)?$/i,
            `Expected "grbl" or "grblHAL" but got "${firmware}"`
          );

          cy.log(`Firmware "${firmware}" confirmed`);
        });

      // Step 8: Disconnect
      cy.disconnectIfIdle();

    }); 
  });   
});     
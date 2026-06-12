describe('gSender Sienci Spindle Accessory Installation', () => {

    beforeEach(() => {
        cy.viewport(2844, 1450);
        cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
            maxRetries: 8,
            waitTime: 8000,
            timeout: 5000
        });
    });

    it('Should complete Sienci Spindle accessory installation wizard', () => {

        cy.log('=== Sienci Spindle Installation Test ===');
        cy.closePopupIfVisible();

        cy.log('Connecting to CNC...');
        cy.connectMachine();
        cy.wait(1000);
		cy.clickToRunHomingIfNeeded();
        cy.ensureHomingEnabledAndHome();
        cy.closeAccPopupIfVisible();

        // Navigate to Tools
        cy.goToTools();
        cy.log('Disconnecting machine before accessory install...');
        cy.disconnectIfIdle();

        // Navigate to Accessory Installation
        cy.log('Opening Accessory Installation page...');
        cy.contains("Install various").click();
        cy.wait(1000);
        cy.log('Accessory Installation page opened');

        // Click Sienci Spindle card (2nd button in the list)
        cy.log('Selecting Sienci Spindle...');
        cy.get("button:nth-of-type(2) div:nth-of-type(3)")
            .should("be.visible")
            .click();
        cy.wait(1000);
        cy.log('Sienci Spindle page opened');

		cy.log("Connect to Machine");
		cy.connectMachine();

        // Click Setup Spindle
        cy.log('Clicking Setup Spindle...');
        cy.contains("button", "Setup Spindle")
            .should("be.visible")
            .click();
        cy.wait(1000);
        cy.log('Setup Spindle wizard opened');

        // ---- Wizard Step 1: Click Next ----
        cy.log('--- Wizard Step 1: Next ---');
        cy.contains("button", "Next")
            .should("be.visible")
            .should("not.be.disabled")
            .click();
        cy.wait(1000);
        cy.log('Moved to next wizard step');

        // ---- Wizard Step 2: Reconnect machine ----
        cy.log('--- Wizard Step 2: Reconnect machine ---');
        cy.contains('span', 'Connect to CNC', { timeout: 15000 })
            .should('exist')
            .scrollIntoView()
            .parents('button')
            .first()
            .should('be.visible')
            .should('not.be.disabled')
            .click({ force: true });

        cy.wait(1500);

        cy.get('body').then(($body) => {
            if ($body.find('div[data-radix-popper-content-wrapper]').length === 0) {
                cy.log('Dropdown not open - retrying click...');
                cy.contains('span', 'Connect to CNC', { timeout: 5000 })
                    .parents('button')
                    .first()
                    .click({ force: true });
                cy.wait(1500);
            }
        });

        cy.get("div[data-radix-popper-content-wrapper]", { timeout: 15000 })
            .should("exist")
            .within(() => {
                cy.get("button.m-0")
                    .should("have.length.greaterThan", 0)
                    .first()
                    .then(($btn) => {
                        const $label = $btn.find("span.font-bold");
                        const portName = $label.length > 0 ? $label.text().trim() : $btn.text().trim();
                        cy.log(`Selecting port: "${portName}"`);
                        cy.wrap($btn).click({ force: true });
                    });
            });

        cy.wait(2000);

        // ---- Handle "Click to Run Homing" prompt after reconnect ----
        cy.log('Handling Click to Run Homing prompt...');
        cy.clickToRunHomingIfNeeded();
        cy.verifyMachineStatus("Idle", { timeout: 30000 });
        cy.log('Machine is Idle after homing');

        // ---- Wizard Step 3: Configure Modbus ----
        cy.log('--- Wizard Step 3: Configure Modbus ---');
        cy.contains("button", "Configure Modbus")
            .should("be.visible")
            .click();
        cy.wait(1000);
        cy.log('Configure Modbus clicked');
		cy.wait(500);
		cy.log("Close pop up if required");
		cy.closeAccPopupIfVisible();

        // ---- Exit Wizard ----
        cy.log('Exiting wizard...');
        cy.contains("button", "Exit Wizard")
            .should("be.visible")
            .click();
        cy.wait(1000);
        cy.log('Wizard exited');
		

        // ---- Reconnect after Exit Wizard ----
        cy.log('Reconnecting after Exit Wizard...');
        cy.contains('span', 'Connect to CNC', { timeout: 15000 })
            .should('exist')
            .scrollIntoView()
            .parents('button')
            .first()
            .should('be.visible')
            .should('not.be.disabled')
            .click({ force: true });

        cy.wait(1500);

        cy.get('body').then(($body) => {
            if ($body.find('div[data-radix-popper-content-wrapper]').length === 0) {
                cy.log('Dropdown not open - retrying click...');
                cy.contains('span', 'Connect to CNC', { timeout: 5000 })
                    .parents('button')
                    .first()
                    .click({ force: true });
                cy.wait(1500);
            }
        });

        cy.get("div[data-radix-popper-content-wrapper]", { timeout: 15000 })
            .should("exist")
            .within(() => {
                cy.get("button.m-0")
                    .should("have.length.greaterThan", 0)
                    .first()
                    .then(($btn) => {
                        const $label = $btn.find("span.font-bold");
                        const portName = $label.length > 0 ? $label.text().trim() : $btn.text().trim();
                        cy.log(`Selecting port: "${portName}"`);
                        cy.wrap($btn).click({ force: true });
                    });
            });

        cy.wait(2000);

        // ---- Handle "Click to Run Homing" prompt after final reconnect ----
        cy.log('Handling Click to Run Homing prompt after Exit Wizard...');
        cy.clickToRunHomingIfNeeded();
        cy.verifyMachineStatus("Idle", { timeout: 30000 });
        cy.log('Machine is Idle after final homing');
		cy.closeAccPopupIfVisible();

        // ---- Final Verification ----
        cy.log('=== Final Verification ===');
        cy.verifyMachineStatus("Idle");
		cy.log("Close pop up if required");
		cy.closeAccPopupIfVisible();
        cy.log('✓ Sienci Spindle installation complete — machine is Idle');
		

    });

});
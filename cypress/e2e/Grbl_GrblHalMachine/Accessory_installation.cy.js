describe('gSender Accessory Installation Testing - ATC and Spindle', () => {

    beforeEach(() => {
        cy.viewport(2844, 1450);
        cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
            maxRetries: 8,
            waitTime: 8000,
            timeout: 5000
        });
    });

    it('Should complete Sienci ATC and Sienci Spindle accessory installation wizards', () => {

        // ============================================================
        // PART 1: Sienci ATC Accessory Installation
        // ============================================================
        cy.log('=== PART 1: Sienci ATC Accessory Installation ===');
        cy.closePopupIfVisible();
        cy.log('Connecting to CNC...');
        cy.connectMachine();
        cy.wait(1000);
        cy.ensureHomingEnabledAndHome();
        cy.closeAccPopupIfVisible();

        // Navigate to Tools
        cy.goToTools();
        cy.log('Disconnecting machine before accessory install...');
        cy.disconnectIfIdle();

        // Navigate to Accessory Installation
        cy.log('Choose accessory installation');
        cy.contains("Install various").click();
        cy.wait(1000);
        cy.log('Accessory Installation page opened');

        // Click Sienci ATC
        cy.log('Click on Sienci ATC');
        cy.contains("Sienci ATC").click();
        cy.wait(1000);
        cy.log('Sienci ATC Set up Wizard page opened');

        // Check for connection error and connect if needed
        cy.get("body").then(($body) => {
            const hasAlertDialog = $body.find('[role="alertdialog"]').length > 0;
            const hasDialog = $body.find('[role="dialog"]').length > 0;
            const hasErrorText = $body.text().includes("error") ||
                                 $body.text().includes("Error") ||
                                 $body.text().includes("COM") ||
                                 $body.text().includes("connect");

            cy.log(`alertdialog found: ${hasAlertDialog}`);
            cy.log(`dialog found: ${hasDialog}`);
            cy.log(`error text found: ${hasErrorText}`);

            if (hasAlertDialog || hasDialog || hasErrorText) {
                cy.log("Connection error detected - connecting machine...");
                if (hasAlertDialog) {
                    cy.get('[role="alertdialog"]').contains("button", "OK").click();
                } else if (hasDialog) {
                    cy.get('[role="dialog"]').contains("button", "OK").click();
                }
                cy.wait(500);
                cy.connectMachine();
                cy.verifyMachineStatus("Idle");
                cy.log("Machine connected and ready");
            } else {
                cy.log("No connection error - continuing...");
            }
        });

        // Open Setup Wizard
        cy.log('Opening Set Up Wizard');
        cy.contains("button", "Setup Wizard").click();
        cy.wait(1000);
        cy.log('Set up Wizard opened');

        // Select No Tool Rack
        cy.log('Selecting No Tool Rack from dropdown');
        cy.get("Select").select("0");
        cy.wait(500);
        cy.log('No Tool Rack selected');

        // Upload Macros
        cy.log('Click on Upload Macros');
        cy.contains("button", "Upload Macros").click();
        cy.wait(12000);
        cy.log('Macros Uploaded');

        // Verify upload success
        cy.log('Verifying upload process is successful');
        cy.contains("Success", { timeout: 10000 }).should("be.visible");
        cy.contains("Successfully uploaded macro configuration to the SD card.", { timeout: 10000 })
            .should("be.visible")
            .then(() => {
                cy.log("Upload success confirmed");

                // Step 10: Next
                cy.log("Clicking Next...");
                cy.contains("button", "Next").should("be.visible").click();
                cy.wait(1000);

                // Controller Set Up
                cy.log('Controller Set Up - Apply settings');
                cy.contains("button", "Apply").should("be.visible").click();
                cy.log("Closing confirmation popup...");
                cy.get('[role="alertdialog"]').contains("button", "OK").click();
                cy.wait(500);
                cy.log("Popup closed");

                // Next
                cy.contains("button", "Next").should("be.visible").click();
                cy.wait(500);

                // Re-home
                cy.log('Selecting Re-homing to continue');
                cy.contains("button", "Re-home").should("be.visible").click();
                cy.wait(2000);
                cy.verifyMachineStatus("Idle", { timeout: 30000 });
                cy.log('Re-Home Completed');

                // Next
                cy.contains("button", "Next")
                    .should("be.visible")
                    .should("not.be.disabled")
                    .click();
                cy.wait(1000);

                // Wizard Step 4: Set Position
                cy.log("--- Wizard Step 4: Set Position ---");
                cy.get("div.w-3\\/5 div:nth-of-type(1) > input")
                    .first()
                    .clear({ force: true })
                    .type("1.00", { force: true });
                cy.wait(500);
                cy.get("div.w-3\\/5 div:nth-of-type(2) > input")
                    .clear({ force: true })
                    .type("2.00", { force: true });
                cy.wait(500);

                cy.contains("button", "Set Position").click();
                cy.wait(1000);
                cy.log("Position set");

                cy.contains("button", "Next").click();
                cy.wait(1000);

                // Wizard Step 5: Apply and Restart
                cy.log("--- Wizard Step 5: Apply and Restart ---");
                cy.contains("button", "Apply and Restart").click();
                cy.wait(2000);

                // Next
                cy.contains("button", "Next").click();
                cy.wait(1000);

                // Reconnect Step 22
                cy.log("Reconnect to machine");
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
                            .parents('button').first().click({ force: true });
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
            });

        // Wizard Step 7: Final Apply and Restart
        cy.log("--- Wizard Step 7: Final Apply and Restart ---");
        cy.contains("button", "Apply and Restart").click();
        cy.wait(2000);
        cy.log("Final Apply and Restart clicked");
        cy.wait(3000);

        // Exit Wizard
        cy.log('Exiting ATC wizard...');
        cy.window().then((win) => {
            win.document.body.removeAttribute('data-scroll-locked');
            win.document.body.style.removeProperty('pointer-events');
        });
        cy.wait(500);
        cy.contains("button", "Exit Wizard").should("exist").click({ force: true });
        cy.wait(1000);
        cy.log('ATC Wizard exited');

        // Reconnect and home after ATC
        cy.log("Reconnecting after ATC wizard...");
        cy.connectMachineNUL();
        cy.log("Handling homing prompt...");
        cy.clickToRunHomingIfNeeded();
        cy.verifyMachineStatus("Idle", { timeout: 30000 });
        cy.log("Machine Idle — ATC installation complete");

        // ============================================================
        // PART 2: Sienci Spindle Accessory Installation
        // ============================================================
        cy.log('=== PART 2: Sienci Spindle Accessory Installation ===');

        // Navigate back to Accessory Installation
        cy.goToCarve();
        cy.wait(1000);
        cy.goToTools();

        cy.log("disconnecting machine");
        cy.disconnectIfIdle();

        cy.log('Opening Accessory Installation page...');
        // Close Radix alert popup if visible
cy.wait(1000);
cy.get("body").then(($body) => {
    const hasPopup = $body.find('#radix-\\:rd\\:').length > 0 ||
                     $body.find('[role="alertdialog"]').length > 0 ||
                     $body.find('[role="dialog"]').length > 0;

    if (hasPopup) {
        cy.log("Popup detected — closing...");
        cy.get('#radix-\\:rd\\: button, [role="alertdialog"] button, [role="dialog"] button')
            .first()
            .click({ force: true });
        cy.wait(500);
        cy.log("✓ Popup closed");
    } else {
        cy.log("No popup present — continuing...");
    }
});
        cy.contains("Install various").click();
        cy.wait(1000);
        cy.log('Accessory Installation page opened');

        // Click Sienci Spindle card
        cy.log('Selecting Sienci Spindle...');
        cy.get("button:nth-of-type(2) div:nth-of-type(3)")
            .should("be.visible")
            .click();
        cy.wait(1000);
        cy.log('Sienci Spindle page opened');

        // Connect machine
        cy.log("Connecting to machine for Spindle wizard...");
        cy.connectMachine();

        // Click Setup Spindle
        cy.log('Clicking Setup Spindle...');
        cy.contains("button", "Setup Spindle").should("be.visible").click();
        cy.wait(1000);
        cy.log('Setup Spindle wizard opened');

        // Wizard Step 1: Next
        cy.log('--- Spindle Wizard Step 1: Next ---');
        cy.contains("button", "Next")
            .should("be.visible")
            .should("not.be.disabled")
            .click();
        cy.wait(1000);

        // Wizard Step 2: Reconnect
        cy.log('--- Spindle Wizard Step 2: Reconnect ---');
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
                    .parents('button').first().click({ force: true });
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

        // Homing prompt after reconnect
        cy.log('Handling Click to Run Homing prompt...');
        cy.clickToRunHomingIfNeeded();
        cy.verifyMachineStatus("Idle", { timeout: 30000 });
        cy.log('Machine is Idle after homing');

        // Wizard Step 3: Configure Modbus
        cy.log('--- Spindle Wizard Step 3: Configure Modbus ---');
        cy.contains("button", "Configure Modbus").should("be.visible").click();
        cy.wait(500);
        cy.closeAccPopupIfVisible();

        // Exit Spindle Wizard
        cy.log('Exiting Spindle wizard...');
        cy.window().then((win) => {
            win.document.body.removeAttribute('data-scroll-locked');
            win.document.body.style.removeProperty('pointer-events');
        });
        cy.wait(500);
        cy.contains("button", "Exit Wizard").should("exist").click({ force: true });
        cy.wait(1000);
        cy.log('Spindle Wizard exited');

        // Reconnect after Exit Wizard
        cy.log('Reconnecting after Spindle Exit Wizard...');
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
                    .parents('button').first().click({ force: true });
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

        // Final homing prompt
        cy.log('Handling Click to Run Homing prompt after Exit Wizard...');
        cy.clickToRunHomingIfNeeded();
        cy.verifyMachineStatus("Idle", { timeout: 30000 });
        cy.log('Machine is Idle after final homing');
        cy.closeAccPopupIfVisible();

        // ============================================================
        // FINAL VERIFICATION
        // ============================================================
        cy.log('=== Final Verification ===');
        cy.verifyMachineStatus("Idle");
        cy.closeAccPopupIfVisible();
        cy.log('✓ ATC and Spindle installation complete — machine is Idle');

    });

});
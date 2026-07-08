describe("Preset Movements by Updating Values Test", () => {
    beforeEach(() => {
        cy.viewport(1920, 1080);
        cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
            maxRetries: 3,
            waitTime: 2000,
            timeout: 20000,
        });
    });

    it("Verify preset movements by updating values in Precise, Normal and Rapid modes", () => {

        // ── Helper: run one mode's test ──
        const testMode = (modeName, xyValue, zValue, feedValue, waitTime) => {
            cy.log(`\n========== ${modeName.toUpperCase()} MODE ==========`);

            // Zero and verify
            cy.zeroAllAxes();
            cy.wait(2000);
            cy.verifyAxes(0, 0, 0);

            // Switch mode
            cy.contains("button", modeName).click();
            cy.wait(500);

            // Set XY and move X+Y+
            cy.log(`[${modeName}] Setting XY to ${xyValue} and moving X+Y+...`);
            cy.forceInput('[aria-label="XY jog distance"]', String(xyValue));
            cy.wait(500);
            cy.get("#xPlusYPlus").click();
            cy.wait(waitTime);
            cy.verifyAxes(xyValue, xyValue, 0);

            // Set Z and move Z+
            cy.log(`[${modeName}] Setting Z to ${zValue} and moving Z+...`);
            cy.forceInput('[aria-label="Z jog distance"]', String(zValue));
            cy.wait(500);
            cy.get("div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)").click();
            cy.wait(waitTime);
            cy.verifyAxes(xyValue, xyValue, zValue);

            // Set feed rate
            cy.log(`[${modeName}] Setting feed rate to ${feedValue}...`);
            cy.forceInput('[aria-label="Jog feedrate"]', String(feedValue));
            cy.wait(500);

            // Return Z to 0
            cy.log(`[${modeName}] Moving Z- to return...`);
            cy.get("div.flex-row > div.flex path:nth-of-type(2)").click();
            cy.wait(waitTime);
            cy.verifyAxes(xyValue, xyValue, 0);

            // Return X to 0
            cy.log(`[${modeName}] Moving X- to return...`);
            cy.get("#xMinus").click();
            cy.wait(waitTime);
            cy.verifyAxes(0, xyValue, 0);

            // Return Y to 0
            cy.log(`[${modeName}] Moving Y- to return...`);
            cy.get("#yMinus").click();
            cy.wait(waitTime);
            cy.verifyAxes(0, 0, 0);

            cy.log(`[${modeName}] Mode test PASSED ✓`);
        };

        // ── Connect once ──
        cy.log("Connecting to CNC machine...");
        cy.connectMachine();
        cy.wait(7000);
        cy.verifyMachineStatus('Idle');

        // ── Run all 3 modes ──
        testMode('Precise', 0.6,  0.2,  1500,  2000);
        testMode('Normal',  10,   5,    4500,  3000);
        testMode('Rapid',   25,   15,   10000, 4000);

        cy.log("ALL MODES PASSED ✓");
    });
});
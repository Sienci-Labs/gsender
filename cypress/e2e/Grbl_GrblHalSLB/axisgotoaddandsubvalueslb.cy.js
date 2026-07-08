describe("Jog Preset Increment Decrement Values Test", () => {
    beforeEach(() => {
        cy.viewport(1920, 1080);
        cy.loadUI(`${Cypress.config("baseUrl")}/#/`, {
            maxRetries: 3,
            waitTime: 2000,
            timeout: 20000,
        });
    });

    it("Verify axis movements by adding and subtracting preset values in Precise, Normal and Rapid modes", () => {

        // ── Helper: Zero all axes ──
        const zeroAllAxesManually = () => {
            cy.zeroXAxis();
            cy.zeroYAxis();
            cy.zeroZAxis();
            cy.wait(2000);
        };

        // ── Helper: Run increment/decrement movement test for a given mode ──
        const testMode = (modeName, buttonSelector, waitTime) => {
            cy.log(`\n========== TESTING ${modeName.toUpperCase()} MODE ==========`);

            // Switch mode
            cy.log(`Switching to ${modeName} mode...`);
            if (modeName === 'Precise') {
                cy.contains("button", "Precise").click();
            } else if (modeName === 'Normal') {
                cy.get("div.flex-shrink-0 button:nth-of-type(2)")
                    .contains(/^Normal$/i).click();
            } else if (modeName === 'Rapid') {
                cy.contains("button", "Rapid").click();
            }
            cy.wait(500);

            // Increment XY
            cy.log(`[${modeName}] Incrementing XY preset value...`);
            cy.get(buttonSelector.xyIncrement).click();
            cy.wait(500);

            // Move X+Y+
            cy.log(`[${modeName}] Moving X+Y+...`);
            cy.get("#xPlusYPlus").click();
            cy.wait(waitTime);

            cy.get("div.gap-1 > div.items-center > div > div:nth-of-type(1) input")
                .invoke("val")
                .then((xyValue) => {
                    const expectedXY = parseFloat(xyValue);
                    cy.log(`[${modeName}] XY moved to: ${expectedXY}`);
                    cy.verifyAxes(expectedXY, expectedXY, 0);

                    // Increment Z
                    cy.log(`[${modeName}] Incrementing Z preset value...`);
                    cy.get("div.h-\\[75\\%\\] div:nth-of-type(2) > div > div:nth-of-type(3) svg").click();
                    cy.wait(500);

                    // Move Z+
                    cy.log(`[${modeName}] Moving Z+...`);
                    cy.get("div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)").click();
                    cy.wait(waitTime);

                    cy.get("div.gap-1 > div.items-center > div > div:nth-of-type(2) input")
                        .invoke("val")
                        .then((zValue) => {
                            const expectedZ = parseFloat(zValue);
                            cy.log(`[${modeName}] Z moved to: ${expectedZ}`);
                            cy.verifyAxes(expectedXY, expectedXY, expectedZ);

                            // Increment feed rate
                            cy.log(`[${modeName}] Incrementing feed rate...`);
                            cy.get(buttonSelector.feedIncrement).click();
                            cy.wait(500);

                            // Return to origin
                            cy.log(`[${modeName}] Moving X- to return...`);
                            cy.get("#xMinus").click();
                            cy.wait(waitTime);
                            cy.verifyAxes(0, expectedXY, expectedZ);

                            cy.log(`[${modeName}] Moving Y- to return...`);
                            cy.get("#yMinus").click();
                            cy.wait(waitTime);
                            cy.verifyAxes(0, 0, expectedZ);

                            cy.log(`[${modeName}] Moving Z- to return...`);
                            cy.get("div.flex-row > div.flex path:nth-of-type(2)").click();
                            cy.wait(waitTime);
                            cy.verifyAxes(0, 0, 0);

                            // Decrement XY
                            cy.log(`[${modeName}] Decrementing XY preset value...`);
                            cy.get(buttonSelector.xyDecrement).click();
                            cy.wait(500);

                            // Move X+Y+ with decremented value
                            cy.log(`[${modeName}] Moving X+Y+ with decremented value...`);
                            cy.get("#xPlusYPlus").click();
                            cy.wait(waitTime);

                            cy.get("div.gap-1 > div.items-center > div > div:nth-of-type(1) input")
                                .invoke("val")
                                .then((newXYValue) => {
                                    const newXY = parseFloat(newXYValue);
                                    cy.log(`[${modeName}] XY moved to: ${newXY} (after decrement)`);
                                    cy.verifyAxes(newXY, newXY, 0);

                                    // Decrement Z
                                    cy.log(`[${modeName}] Decrementing Z preset value...`);
                                    cy.get(buttonSelector.zDecrement).click();
                                    cy.wait(500);

                                    // Move Z+ with decremented value
                                    cy.log(`[${modeName}] Moving Z+ with decremented value...`);
                                    cy.get("div.flex-shrink-0 div.flex-row > div.flex path:nth-of-type(1)").click();
                                    cy.wait(waitTime);

                                    cy.get("div.gap-1 > div.items-center > div > div:nth-of-type(2) input")
                                        .invoke("val")
                                        .then((newZValue) => {
                                            const newZ = parseFloat(newZValue);
                                            cy.log(`[${modeName}] Z moved to: ${newZ} (after decrement)`);
                                            cy.verifyAxes(newXY, newXY, newZ);

                                            // Decrement feed rate
                                            cy.log(`[${modeName}] Decrementing feed rate...`);
                                            cy.get(buttonSelector.feedDecrement).click();
                                            cy.wait(500);

                                            // Return to origin
                                            cy.log(`[${modeName}] Moving Y- to return...`);
                                            cy.get("#yMinus").click();
                                            cy.wait(waitTime);
                                            cy.verifyAxes(newXY, 0, newZ);

                                            cy.log(`[${modeName}] Moving X- to return...`);
                                            cy.get("#xMinus").click();
                                            cy.wait(waitTime);
                                            cy.verifyAxes(0, 0, newZ);

                                            cy.log(`[${modeName}] Moving Z- to return...`);
                                            cy.get("div.flex-row > div.flex path:nth-of-type(2)").click();
                                            cy.wait(waitTime);
                                            cy.verifyAxes(0, 0, 0);

                                            cy.log(`[${modeName}] Mode test PASSED ✓`);
                                        });
                                });
                        });
                });
        };

        // ── Button selectors per mode ──
        const preciseSelectors = {
            xyIncrement:   "div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(3) path",
            xyDecrement:   "div.h-\\[75\\%\\] div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(1) svg",
            zDecrement:    "#app > div > div.h-full div.items-center > div > div:nth-of-type(2) > div > div:nth-of-type(1) svg",
            feedIncrement: "div:nth-of-type(3) > div > div:nth-of-type(3) path",
            feedDecrement: "div.items-center > div > div:nth-of-type(3) > div > div:nth-of-type(1) svg",
        };

        const normalSelectors = {
            xyIncrement:   "div.gap-1 > div.items-center > div > div:nth-of-type(1) div:nth-of-type(3) > button",
            xyDecrement:   "div.h-\\[75\\%\\] div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(1) path",
            zDecrement:    "#app > div > div.h-full div.items-center > div > div:nth-of-type(2) > div > div:nth-of-type(1) path",
            feedIncrement: "div:nth-of-type(3) > div > div:nth-of-type(3) svg",
            feedDecrement: "div.items-center > div > div:nth-of-type(3) > div > div:nth-of-type(1) svg",
        };

        const rapidSelectors = {
            xyIncrement:   "div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(3) svg",
            xyDecrement:   "div.h-\\[75\\%\\] div.items-center > div > div:nth-of-type(1) > div > div:nth-of-type(1) svg",
            zDecrement:    "#app > div > div.h-full div.items-center > div > div:nth-of-type(2) > div > div:nth-of-type(1) svg",
            feedIncrement: "div:nth-of-type(3) > div > div:nth-of-type(3) svg",
            feedDecrement: "div.items-center > div > div:nth-of-type(3) > div > div:nth-of-type(1) svg",
        };

        // ── Step 1: Connect ──
        cy.log("Step 1: Connecting to CNC machine...");
        cy.connectMachine();
        cy.wait(7000);
        cy.verifyMachineStatus('Idle');

        // ── Step 2: Zero axes ──
        cy.log("Step 2: Zeroing all axes...");
        zeroAllAxesManually();
        cy.verifyAxes(0, 0, 0);

        // ── Run all 3 modes ──
        testMode('Precise', preciseSelectors, 2000);

        cy.log("Re-zeroing before Normal mode...");
        zeroAllAxesManually();
        cy.verifyAxes(0, 0, 0);

        testMode('Normal', normalSelectors, 3000);

        cy.log("Re-zeroing before Rapid mode...");
        zeroAllAxesManually();
        cy.verifyAxes(0, 0, 0);

        testMode('Rapid', rapidSelectors, 4000);

        cy.log("ALL MODES PASSED ✓");
    });
});
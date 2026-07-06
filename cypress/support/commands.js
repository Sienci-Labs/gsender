// ***********************************************
// cypress/support/commands.js
// Custom commands for Gsender
//2.Load UI
//3.Connect to CNC machine grbl
//4.Auto unlock
// 5.Connect to CNC - GrblHAL
// 6.Disconnect if Idle
// 7.Upload G-code file
//8.Go to location grbl
//9.Go to location grblHal
//10.Unlock Machine if Needed
//11.Verify Specific Console Line Contains Text
//12.Zero X Axis
//13.Zero Y Axis
//14.Zero Z Axis
//15.Zero All Axes
//16.Force input into a field
//17.Send Console Command
//18.Clear Console Command
//19.Verify axes for expected values (flexible with decimals)
//20.Homing enabling and perform homing
//21.Axis Homing Z< Y & X
//22.Go to URLS
//23. Checking probing pin is active
//24.Jogging every axes
//25.Stop Job and get details
//26. Verify machine status
//27. Search items in settings
// ***********************************************

//=======//
//2.Load UI//   cy.loadUI(`${Cypress.config('baseUrl')}/#/configuration`, {
//=======//
Cypress.Commands.add('loadUI', (url, options = {}) => {
  const {
    maxRetries = 3,
    waitTime = 3000,
    timeout = 5000,
    viewport = { width: 1920, height: 1080 }
  } = options;

  cy.viewport(viewport.width, viewport.height);

  function tryLoadUI(attempt = 1) {
    cy.log(`Loading attempt ${attempt} of ${maxRetries}`);

    if (attempt === 1) {
      cy.visit(url, {
        failOnStatusCode: false,
        timeout: 30000
      });
    } else {
      cy.reload();
    }

    cy.wait(waitTime);

    cy.get('body', { timeout }).then(($body) => {
      const hasButton = $body.find('button').length > 0;
      const hasCOM = $body.text().includes('COM');
      const hasConnection =
        $body.text().includes('Connect') ||
        $body.text().includes('Connection');

      const uiLoaded = hasButton && (hasCOM || hasConnection);

      cy.log(
        `Buttons found: ${hasButton}, COM text: ${hasCOM}, Connection text: ${hasConnection}`
      );

      if (uiLoaded) {
        cy.log('UI loaded successfully');
      } else if (attempt < maxRetries) {
        cy.log('UI not loaded, refreshing...');
        tryLoadUI(attempt + 1);
      } else {
        throw new Error(`Failed to load UI after ${maxRetries} attempts`);
      }
    });
  }

  tryLoadUI();
});


// ----------------------
//3.Connect to CNC machine grbl cy.connectMachine();
// ----------------------
Cypress.Commands.add("connectMachine", () => {
    // Step 1: Click the parent button, not just the span
    cy.contains('span', 'Connect to CNC', { timeout: 15000 })
        .should('exist')
        .scrollIntoView()
        .parents('button')
        .first()
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true });

    cy.wait(1500);

    // Step 2: If dropdown didn't open, retry click once
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

    // Step 3: Wait for the radix popper div to appear
    cy.get("div[data-radix-popper-content-wrapper]", { timeout: 15000 })
        .should("exist")
        .within(() => {
            cy.get("button.m-0")
                .should("have.length.greaterThan", 0)
                .first()
                .then(($btn) => {
                    const $label = $btn.find("span.font-bold");
                    const portName =
                        $label.length > 0 ? $label.text().trim() : $btn.text().trim();
                    cy.log(`Selecting first available port: "${portName}"`);
                    cy.wrap($btn).click({ force: true });
                });
        });
		cy.log('Unlocking machine if needed')
		cy.unlockMachineIfNeeded();
    // Step 4: Confirm Idle state
});

// Without unlock 
Cypress.Commands.add("connectMachineNUL", () => {
    // Step 1: Click the parent button, not just the span
    cy.contains('span', 'Connect to CNC', { timeout: 15000 })
        .should('exist')
        .scrollIntoView()
        .parents('button')
        .first()
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true });

    cy.wait(1500);

    // Step 2: If dropdown didn't open, retry click once
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

    // Step 3: Wait for the radix popper div to appear
    cy.get("div[data-radix-popper-content-wrapper]", { timeout: 15000 })
        .should("exist")
        .within(() => {
            cy.get("button.m-0")
                .should("have.length.greaterThan", 0)
                .first()
                .then(($btn) => {
                    const $label = $btn.find("span.font-bold");
                    const portName =
                        $label.length > 0 ? $label.text().trim() : $btn.text().trim();
                    cy.log(`Selecting first available port: "${portName}"`);
                    cy.wrap($btn).click({ force: true });
                });
        });
		
   
});
//-----------------------
//21.Axis Homing Z< Y & X
//-----------------------
Cypress.Commands.add("enableAxisHomingAndHome", () => {
	cy.log("Starting axis homing configuration and execution...");

	// Step 1: Navigate to Config page
	cy.log("Navigating to Config page...");
	cy.get("a:nth-of-type(4) span").click();
	cy.wait(1000);

	// Step 2: Navigate to Homing section
	cy.log("Opening Homing settings...");
	cy.get("button:nth-of-type(6) > span:nth-of-type(2)").click();
	cy.wait(500);

	// Step 3: Check and enable all required homing settings if disabled
	cy.log("Checking axis homing conditions...");

	const settingsToCheck = [
		{ id: "$22-0-key", name: "Enable Homing" },
		{ id: "$22-1-key", name: "Enable single axis commands" },
		{ id: "$22-2-key", name: "Homing on startup required" },
		{ id: "$22-3-key", name: "Set Machine origin to 0" },
		{ id: "$22-5-key", name: "Allow Manual" },
		{ id: "$22-6-key", name: "Override locks" },
	];

	let changesDetected = false;

	settingsToCheck.forEach((setting) => {
		cy.get(`button#\\${setting.id}`).then(($toggle) => {
			if ($toggle.attr("aria-checked") === "false") {
				cy.log(`Enabling: ${setting.name}`);
				cy.wrap($toggle).click();
				cy.wait(300);
				changesDetected = true;
			} else {
				cy.log(`${setting.name} already enabled - ignoring`);
			}
		});
	});

	// Step 4: Apply Settings only if changes were made
	cy.log("Checking if settings need to be applied...");
	cy.contains("button", "Apply Settings").then(($button) => {
		if ($button.is(":disabled")) {
			cy.log("No changes detected - ignoring Apply Settings");
		} else {
			cy.log("Applying settings...");
			cy.wrap($button).click();
			cy.wait(2000);
			cy.unlockMachineIfNeeded();
			cy.wait(1000);
		}
	});

	// Step 5: Navigate back to main page
	cy.log("Returning to main view...");
	cy.get("#app > div > div.h-full > div.flex img").click();
	cy.wait(1000);
	cy.unlockMachineIfNeeded();
	cy.wait(1000);

	// Step 6: Enable Homing Toggle
	cy.log("Enabling homing toggle button...");
	cy.get(
		"div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button",
	).click();
	cy.wait(1000);

	// Step 7: Verify axes changed to homing mode
	cy.log("Verifying homing mode activated...");
	cy.get(
		"div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span",
	).should("contain.text", "HX");
	cy.get(
		"div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span",
	).should("contain.text", "HY");
	cy.get(
		"div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span",
	).should("contain.text", "HZ");

	// Step 8: Execute Z-axis homing
	cy.log("Homing Z-axis...");
	cy.get(
		"div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span",
	)
		.contains("HZ")
		.click();
	cy.wait(2000);
	cy.contains(/^idle$/i, { timeout: 30000 }).should("be.visible");
	cy.log("Z-axis homing completed");
	cy.wait(1000);

	// Step 9: Execute Y-axis homing
	cy.log("Homing Y-axis...");
	cy.get(
		"div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span",
	)
		.contains("HY")
		.click();
	cy.wait(2000);
	cy.contains(/^idle$/i, { timeout: 30000 }).should("be.visible");
	cy.log("Y-axis homing completed");
	cy.wait(1000);

	// Step 10: Execute X-axis homing
	cy.log("Homing X-axis...");
	cy.get(
		"div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span",
	)
		.contains("HX")
		.click();
	cy.wait(2000);
	cy.contains(/^idle$/i, { timeout: 30000 }).should("be.visible");
	cy.log("X-axis homing completed");
	cy.wait(1000);

	cy.log("Axis homing sequence completed successfully!");
});

// ----------------------
// 17. Check Homing, Enable if Needed, and Perform Homing
// ----------------------
Cypress.Commands.add("ensureHomingEnabledAndHome", (options = {}) => {
	const {
		verifyHomingStatus = true,
		verifyFinalPosition = true,
		timeout = 60000,
	} = options;

	cy.log("Checking homing configuration...");

	// Navigate to Config page
	cy.get("a:nth-of-type(4) svg").click();
	cy.wait(1000);
	cy.log("Config page opened");

	// Navigate to Homing section
	cy.contains("button", /homing/i).click();
	cy.wait(500);
	cy.log("Homing settings section opened");

	// Check if Enable Homing ($22-0-key) is enabled
	cy.get("button#\\$22-0-key").then(($toggle) => {
		const isEnabled = $toggle.attr("aria-checked") === "true";

		if (isEnabled) {
			cy.log("Homing is already enabled");
		} else {
			cy.log("Homing is disabled - enabling now...");

			// Enable all required homing settings
			const settingsToEnable = [
				{ id: "$22-0-key", name: "Enable Homing" },
				{ id: "$22-2-key", name: "Homing on startup required" },
				{ id: "$22-3-key", name: "Set Machine origin to 0" },
				{ id: "$22-5-key", name: "Allow Manual" },
				{ id: "$22-6-key", name: "Override locks" },
			];

			settingsToEnable.forEach((setting) => {
				cy.get(`button#\\${setting.id}`).then(($btn) => {
					if ($btn.attr("aria-checked") === "false") {
						cy.log(`  Enabling: ${setting.name}`);
						cy.wrap($btn).click();
						cy.wait(300);
					}
				});
			});

			// Apply Settings
			cy.log("Applying homing settings...");
			cy.contains("button", "Apply Settings").then(($button) => {
				if (!$button.is(":disabled")) {
					cy.wrap($button).click();
					cy.wait(2000);
					cy.unlockMachineIfNeeded();
					cy.wait(1000);
					cy.log("Settings applied successfully");
				}
			});
		}

		// Navigate back to Carve page
		cy.log("Returning to Carve page...");
		cy.get("a:nth-of-type(1) img").click();
		cy.wait(1000);
		cy.unlockMachineIfNeeded();
		cy.wait(1000);
		cy.log("Returned to Carve page");

		// Wait for machine to be ready
		cy.log("Waiting for machine ready state...");
		cy.contains(/^Idle$/i, { timeout: 30000 }).should("be.visible");
		cy.wait(1000);
		cy.log("Machine is ready");

		// Perform homing sequence
		cy.log("Performing homing sequence...");


		// Click Home button
		cy.contains("button", "Home").click();
		cy.wait(1000);
		cy.log("Homing command sent");

		if (verifyHomingStatus) {
			// Verify homing in progress
			cy.log("Verifying homing process...");
			cy.contains("span", "Homing", { timeout: 10000 }).should("be.visible");
			cy.log("Homing status displayed");
		}

		// Wait for homing to complete
		cy.log("Waiting for homing to complete...");
		cy.contains(/^Idle$/i, { timeout: timeout }).should("be.visible");
		cy.wait(2000);

		// Handle unlock if needed
		cy.unlockMachineIfNeeded();
		cy.wait(1000);
		cy.log("Homing completed successfully");
	});
});

//4.Auto unlock
// -----------------------
Cypress.Commands.add("autoUnlock", () => {
	cy.get("body", { log: false, timeout: 1000 }).then(
		{ timeout: 1000 },
		($body) => {
			const bodyText = $body.text().toLowerCase();

			if (bodyText.includes("unlock")) {
				cy.log("Unlock popup detected");

				// Find and click unlock button
				cy.get("button", { log: false }).then(($buttons) => {
					let unlocked = false;

					$buttons.each((index, btn) => {
						const $btn = Cypress.$(btn);
						if (
							$btn.text().toLowerCase().includes("unlock") &&
							$btn.is(":visible")
						) {
							$btn.click();
							cy.log("Auto-unlocked");
							unlocked = true;
							return false; // break loop
						}
					});

					if (!unlocked) {
						cy.log("Unlock button not found or not visible");
					}
				});
			} else {
				cy.log("No unlock needed");
			}
		},
	);
});

// ------------------------
// 5. Connect to CNC - GrblHAL (Cross-platform compatible)
// ----------------------
Cypress.Commands.add("connectToGrblHAL", () => {
	cy.log("Starting connection check...");
	cy.wait(2000);

	cy.get("body").then(($body) => {
		const bodyText = $body.text();

		// Already Idle
		if (/\bIdle\b/i.test(bodyText)) {
			cy.log(" Machine is already connected and in Idle state");
			return;
		}

		// Connected but not Idle yet
		if (/\bDisconnect\b/i.test(bodyText)) {
			cy.log(" Machine connected — waiting for Idle...");
			cy.contains(/^Idle$/i, { timeout: 30000 }).should("be.visible");
			return;
		}

		// Not connected — initiate connection
		cy.log(" Machine not connected. Initiating connection...");

		cy.contains(/^connect to CNC$/i, { timeout: 20000 })
			.should("exist")
			.scrollIntoView()
			.should("be.visible")
			.click({ force: true });

		cy.wait(1000);

		// Select first available port (works on Windows/Linux/macOS)
		cy.get("div[data-radix-popper-content-wrapper]", { timeout: 10000 })
			.should("exist")
			.within(() => {
				cy.get("button.m-0")
					.should("have.length.greaterThan", 0)
					.first()
					.then(($btn) => {
						const portName = ($btn.text() || "").trim();
						cy.log(` Selecting port: "${portName}"`);
						cy.wrap($btn).click({ force: true });
					});
			});

		cy.unlockMachineIfNeeded();

		cy.log("Waiting for Idle state...");
		cy.contains(/^Idle$/i, { timeout: 30000 })
			.should("be.visible")
			.then(() => cy.log(" CNC machine connected and in Idle state"));
	});
});
// ----------------------
// 6.Disconnect if Idle
// ----------------------
Cypress.Commands.add("disconnectIfIdle", () => {
	cy.wait(5000);
	cy.contains(/^Idle$/i, { timeout: 20000 }).then((status) => {
		const machineStatus = status.text().trim();
		cy.log(`Machine status: "${machineStatus}"`);

		if (machineStatus.toLowerCase() === "idle") {
			cy.log("Machine is Idle — disconnecting...");

			cy.get("div.group").first().trigger("mouseover", { force: true });

			cy.get("div.group div.w-full")
				.contains(/^disconnect$/i)
				.click({ force: true });

			cy.contains(/Connect to CNC/i, { timeout: 30000 })
				.should("be.visible")
				.then(() => cy.log("Machine disconnect verified successfully."));
		} else {
			cy.log("Machine is not Idle — skipping disconnect.");
		}
	});
});
// ----------------------
//7.Upload G-code file
// ----------------------
Cypress.Commands.add("uploadGcodeFile", (fileName = "sample.gcode") => {
	cy.wait(5000);
	cy.contains("Load File").should("be.visible").click({ force: true });
	cy.get("#fileInput").selectFile(`cypress/fixtures/${fileName}`, {
		force: true,
	});
	cy.wait(5000);
	cy.log(`G-code file ${fileName} uploaded successfully`);
});
-(
	// ----------------------
	//9.Go to location grblHal
	// ----------------------
	Cypress.Commands.add("goToLocation", (options = {}) => {
		const x = options.x ?? 0;
		const y = options.y ?? 0;
		const z = options.z ?? 0;
		const waitTime = options.waitTime ?? 5000;

		cy.log(`Going to location: X=${x}, Y=${y}, Z=${z}`);

  // Step 1: Open Go To Location dialog 
  cy.log('Opening Go To Location popup...');
  cy.get('div.min-h-10 > div:nth-of-type(1) > button', { timeout: 10000 })
    .filter(':visible')
    .first()
    .click({ force: true });
  cy.wait(1500);
  cy.log('"Go to Location" button clicked');

		// Step 2: Enter coordinates inside the Radix dialog
		cy.get('[id^="radix-"]', { timeout: 10000 })
			.should("exist")
			.last()
			.within(() => {
				// X axis
				cy.get("div:nth-of-type(2) input")
					.filter(":visible")
					.clear({ force: true })
					.type(String(x), { force: true })
					.trigger("change", { force: true });
				cy.log(`X coordinate: ${x}`);

				// Y axis
				cy.get("div:nth-of-type(3) input")
					.filter(":visible")
					.clear({ force: true })
					.type(String(y), { force: true })
					.trigger("change", { force: true });
				cy.log(`Y coordinate: ${y}`);

				// Z axis — force value with multiple triggers
				cy.get("div:nth-of-type(4) input")
					.filter(":visible")
					.focus()
					.clear({ force: true })
					.type("{selectall}", { force: true })
					.type(String(z), { force: true })
					.trigger("input", { force: true })
					.trigger("change", { force: true })
					.blur();
				cy.log(`Z coordinate: ${z}`);

				// Step 3: Click Go button
				cy.log("Clicking Go button...");
				cy.contains("button", "Go!").click({ force: true });
				cy.log("Go button clicked");
			});

		cy.wait(2000);

		// Step 4: Close popup
		cy.log("Closing popup...");
		cy.get("body").click(50, 50, { force: true });
		cy.wait(500);

		// Step 5: Wait for machine to return to Idle
		cy.log("Waiting for machine to reach position...");
		cy.contains(/^Idle$/i, { timeout: waitTime }).should("be.visible");
		cy.wait(2000);

		cy.log(` Moved to X=${x}, Y=${y}, Z=${z}`);
	})
);
// ----------------------
//10.Unlock Machine if Needed
// ----------------------
Cypress.Commands.add("unlockMachineIfNeeded", () => {
  cy.wait(4000); // Wait for machine to stabilize

  cy.get("body").then(($body) => {
    const isAlreadyIdle = $body.text().match(/^Idle$/im);

    if (isAlreadyIdle) {
      cy.log("Machine is already Idle — no unlock needed");
      return;
    }

    cy.log("Machine is not Idle — attempting unlock...");

    // --- Option 1: Lock icon button in sidebar ---
    const lockButtonSvg = $body.find(
      "#app > div.flex > div.flex > div:nth-of-type(2) div > svg"
    );

    if (lockButtonSvg.length > 0) {
      cy.log("Option 1: Lock icon found — clicking...");

      cy.get("#app > div.flex > div.flex > div:nth-of-type(2) div > svg")
        .should("exist")
        .click({ force: true });

      cy.wait(2000);

      // --- Option 2 (fallback): "Click to Unlock" dialog button ---
      cy.get("body").then(($bodyAfter) => {
        const unlockDialogBtn = $bodyAfter.find("header div.mt-4 button");

        if (unlockDialogBtn.length > 0) {
          cy.log("Option 1 opened dialog — clicking 'Click to Unlock'...");

          cy.get("header div.mt-4 button")
            .contains(/click to unlock/i)
            .should("be.visible")
            .click({ force: true });

          cy.wait(2000);
          cy.log("Unlocked via Option 2 (dialog button)");
        } else {
          cy.log("Unlocked via Option 1 (lock icon)");
        }
      });

    } else {
      cy.log("No lock button found — machine may already be unlocked");
    }

    // Verify machine reaches Idle after unlock attempt
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should("be.visible")
      .then(() => {
        cy.log("Machine reached Idle state — unlock successful");
      });
  });
});

// ----------------------
//11.Verify Specific Console Line Contains Text
// ----------------------
Cypress.Commands.add("verifyConsoleContains", (text) => {
	cy.log(`Checking if console contains: "${text}"`);

	cy.get("div.xterm-rows")
		.should("be.visible")
		.invoke("text")
		.should("include", text)
		.then(() => {
			cy.log(`Console contains: "${text}"`);
		});
});

// ----------------------
//12.Zero X Axis
// ----------------------
Cypress.Commands.add('zeroXAxis', () => {
    cy.log('Zeroing X axis...');
    cy.get('[aria-label="Zero X axis: Set current position as work zero"]')
        .should('exist')
        .click();
    cy.wait(500);
    cy.log('X axis zeroed');
});

Cypress.Commands.add('zeroYAxis', () => {
  cy.log('Zeroing Y axis...');
  cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
    .contains('Y0')
    .click();
  cy.wait(500);
  cy.log('Y axis zeroed');
});

// ----------------------
//14.Zero Z Axis
// ----------------------
Cypress.Commands.add('zeroZAxis', () => {
  cy.log('Zeroing Z axis...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
    .contains('Z0')
    .click();
  cy.wait(1000);
  cy.log('Z axis zeroed');
});
//-----------------------
// Zero A axis
Cypress.Commands.add('zeroZAxis', () => {
  cy.log('Zeroing Z axis...');
  cy.get('div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
    .contains('Z0')
    .click();
  cy.wait(1000);
  cy.log('Z axis zeroed');
});
// ----------------------
//15.Zero All Axes
// ----------------------
Cypress.Commands.add("zeroAllAxes", () => {
    cy.log("Resetting all axes to zero...");
    // Click the "Zero All" button
    cy.get('div.relative > div.max-xl\\:scale-95 > div:nth-of-type(1) span')
      .click();
    cy.log("All axes zeroed");
});
// ----------------------
//16.Force input into a field
// ----------------------
Cypress.Commands.add("forceInput", (selector, value) => {
	cy.get(selector)
		.clear({ force: true })
		.type(value, { force: true })
		.blur({ force: true })
		.then(($el) => {
			expect($el.val()).to.equal(value);
		});
});
// ----------------------
//17.Send Console Command
// ----------------------
Cypress.Commands.add("sendConsoleCommand", (command) => {
	cy.log(`Sending console command: ${command}`);

	// Find the visible console input field
	cy.get("div.block input")
		.filter(":visible")
		.first()
		.clear({ force: true })
		.type(command, { force: true });

	// Click the Run button
	cy.get("div.block button")
		.contains(/Run/i)
		.should("be.visible")
		.click({ force: true });

	cy.wait(1000);
	cy.log(` Command sent: ${command}`);
});
// ----------------------
//18.Clear Console Command
// ----------------------
Cypress.Commands.add("clearConsole", () => {
	cy.log("Clearing console...");

	// Step 1: Click on Console tab to ensure it's active
	cy.get("div.h-\\[25\\%\\] button:nth-of-type(4)")
		.contains(/Console/i)
		.click({ force: true });

	cy.wait(500);
	cy.log("Console tab activated");

	// Step 2: Click the console options button (three dots icon)
	cy.get("div.block > div.grid > div.flex svg")
		.should("be.visible")
		.click({ force: true });

	cy.wait(500);
	cy.log("Console options menu opened");

	// Step 3: Click "Clear Console" from the dropdown
	cy.get("body > div:nth-of-type(2) div > div:nth-of-type(2) span")
		.contains(/Clear Console/i)
		.should("be.visible")
		.click({ force: true });

	cy.wait(500);
	cy.log("Console cleared successfully");
});
// ----------------------
//19.Verify axes for expected values (flexible with decimals)
// ----------------------
Cypress.Commands.add("verifyAxes",
  (expectedX = 0, expectedY = 0, expectedZ = 0) => {
    cy.log(
      `Verifying axes positions: X=${expectedX}, Y=${expectedY}, Z=${expectedZ}...`,
    );

    cy.get('[data-testid="wcs-input-X"]').invoke('val').then((xValue) => {
      expect(parseFloat(xValue)).to.be.closeTo(parseFloat(expectedX), 0.01);
    });

    cy.get('[data-testid="wcs-input-Y"]').invoke('val').then((yValue) => {
      expect(parseFloat(yValue)).to.be.closeTo(parseFloat(expectedY), 0.01);
    });

    cy.get('[data-testid="wcs-input-Z"]').invoke('val').then((zValue) => {
      expect(parseFloat(zValue)).to.be.closeTo(parseFloat(expectedZ), 0.01);
    });

    cy.log("Axes verified successfully");
  },
);

//23. Checking probing pin is active
Cypress.Commands.add("checkProbingIsActive", (options = {}) => {
	const { maxAttempts = 30, waitTime = 1000 } = options;

	cy.log(" Checking if Probe/TLS is active (green)...");

	const checkGreen = () => {
		return cy.get("body").then(($body) => {
			const $probeTLS = $body.find('div.text-gray-500:contains("Probe/TLS")');
			if ($probeTLS.length === 0) {
				return false;
			}

			const $parent = $probeTLS.closest(".relative");
			return $parent.find(".bg-green-500").length > 0;
		});
	};

	const clickZMinusUntilGreen = (attempt = 1) => {
		if (attempt > maxAttempts) {
			throw new Error(
				` Probe/TLS did not turn green after ${maxAttempts} attempts`,
			);
		}

		cy.log(` Attempt ${attempt}/${maxAttempts}: Clicking Z-`);

		cy.get(
			'path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]',
		)
			.should("exist")
			.click({ force: true });

		cy.wait(waitTime);

		checkGreen().then((isGreen) => {
			if (isGreen) {
				cy.log(" Probe/TLS is GREEN");
			} else {
				cy.log(" Probe/TLS not active yet, retrying...");
				clickZMinusUntilGreen(attempt + 1);
			}
		});
	};

	// Start the process
	clickZMinusUntilGreen();

	// Final assertion (safety check)
	cy.contains("div.text-gray-500", "Probe/TLS")
		.should("be.visible")
		.closest(".relative")
		.find(".bg-green-500")
		.should("exist");

	cy.log(" Probing is ACTIVE and verified");
});

// 24.Jogging every axes
// -------- X axis jogging --------
Cypress.Commands.add("jogXPlusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging X+ ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#xPlus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(`X+ jog ${i}/${times} completed`);
	}
});

Cypress.Commands.add("jogXMinusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging X- ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#xMinus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(`X- jog ${i}/${times} completed`);
	}
});

// -------- Y axis jogging --------
Cypress.Commands.add("jogYPlusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging Y+ ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#yPlus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(`Y+ jog ${i}/${times} completed`);
	}
});

Cypress.Commands.add("jogYMinusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging Y- ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#yMinus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(`Y- jog ${i}/${times} completed`);
	}
});

// -------- Z axis jogging --------
Cypress.Commands.add("jogZPlusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging Z+ ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get(
			'path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]',
		)
			.should("exist")
			.click({ force: true });
		cy.wait(waitTime);
		cy.log(`Z+ jog ${i}/${times} completed`);
	}
});

Cypress.Commands.add("jogZMinusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging Z- ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get(
			'path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]',
		)
			.should("exist")
			.click({ force: true });
		cy.wait(waitTime);
		cy.log(`Z- jog ${i}/${times} completed`);
	}
});

// -------- XY combined jogging --------
Cypress.Commands.add("jogXYPlusPlusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging X+Y+ ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#xPlusYPlus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(`X+Y+ jog ${i}/${times} completed`);
	}
});

Cypress.Commands.add("jogXYPlusMinusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging X+Y- ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#xPlusYMinus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(`X+Y- jog ${i}/${times} completed`);
	}
});

Cypress.Commands.add("jogXYMinusMinusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging X-Y- ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#xMinusYMinus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(` X-Y- jog ${i}/${times} completed`);
	}
});

Cypress.Commands.add("jogXYMinusPlusTimes", (times = 1, waitTime = 2000) => {
	cy.log(`Jogging X-Y+ ${times} time(s)...`);
	for (let i = 1; i <= times; i++) {
		cy.get("path#xMinusYPlus").should("exist").click({ force: true });
		cy.wait(waitTime);
		cy.log(`X-Y+ jog ${i}/${times} completed`);
	}
});

//25.Stop Job and get details
Cypress.Commands.add("stopJobAndGetDetails", () => {
	cy.log("Stopping job and collecting job details");

	// Step 1: Stop the job
	cy.get("div.top-\\[-30px\\] > div:nth-of-type(3) > button", {
		timeout: 10000,
	})
		.contains("Stop")
		.should("be.visible")
		.click({ force: true });

	// Step 2: Wait for Job End popup
	cy.contains("h2", "Job End", { timeout: 20000 })
		.should("be.visible")
		.closest("div")
		.as("jobPopup");

	const jobDetails = {};

	// Step 3: Extract Status
	cy.get("@jobPopup")
		.contains("strong", "Status:")
		.parent()
		.invoke("text")
		.then((text) => {
			jobDetails.status = text.replace("Status:", "").trim();
		});

	// Step 4: Extract Time
	cy.get("@jobPopup")
		.contains("strong", "Time:")
		.parent()
		.invoke("text")
		.then((text) => {
			jobDetails.time = text.replace("Time:", "").trim();
		});

	// Step 5: Extract Errors
	cy.get("@jobPopup")
		.contains("strong", "Errors:")
		.parent()
		.invoke("text")
		.then((text) => {
			jobDetails.errors = text.replace("Errors:", "").trim();
		});

	// Step 6: Return all details as a single object
	cy.then(() => {
		cy.wrap(jobDetails).as("jobDetails");
	});
});

//26. Verify machine status
Cypress.Commands.add("verifyMachineStatus", (expectedStatus, options = {}) => {
	const { timeout = 30000, exact = true } = options;

	cy.log(`Verifying machine status: ${expectedStatus}`);

	const statusRegex = exact
		? new RegExp(`^${expectedStatus}$`, "i")
		: new RegExp(expectedStatus, "i");

	cy.contains(statusRegex, { timeout })
		.should("be.visible")
		.then(($el) => {
			const actualStatus = $el.text().trim();
			cy.log(`Machine status: "${actualStatus}"`);
			expect(actualStatus.toLowerCase()).to.eq(expectedStatus.toLowerCase());
		});
});

//cy.verifyMachineStatus('Idle'); cy.verifyMachineStatus('Running'); cy.verifyMachineStatus('Disconnected'); cy.verifyMachineStatus('Hold');

Cypress.Commands.add("verifyMachineStatus", (expectedStatus, options = {}) => {
	const { timeout = 30000 } = options;

	const allowedStatuses = [
		"Idle",
		"Disconnected",
		"Running",
		"Jogging",
		"Homing",
		"Hold",
	];

	cy.log(`Verifying machine status: ${expectedStatus}`);

	// Validate input
	expect(
		allowedStatuses,
		`Allowed statuses are: ${allowedStatuses.join(", ")}`,
	).to.include(expectedStatus);

	const statusRegex = new RegExp(`^${expectedStatus}$`, "i");

	cy.contains(statusRegex, { timeout })
		.should("be.visible")
		.then(($status) => {
			const actualStatus = $status.text().trim();
			cy.log(`Machine status: "${actualStatus}"`);
			expect(actualStatus.toLowerCase()).to.eq(expectedStatus.toLowerCase());
		});
});

//27. Search items in settings {cy.searchInSettings('search item name');}
Cypress.Commands.add('searchInSettings', (searchText, options = {}) => {
  const { timeout = 10000 } = options;

  cy.log(`Searching for: ${searchText}`);

  cy.get('#simple-search', { timeout })
    .should('be.visible')
    .clear()
    .type(searchText);
});

// 27. Search items in settings { cy.searchInSettings('search item name'); }
Cypress.Commands.add('searchInSettings', (searchText, options = {}) => {
  const { timeout = 10000 } = options;

  cy.log(`Searching for: ${searchText}`);

  cy.get('#simple-search', { timeout })
    .should('exist')
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(searchText);
});
// 27. Search items in settings { cy.searchInSettings('search item name'); }
Cypress.Commands.add('searchInSettings', (searchText, options = {}) => {
  const { timeout = 10000 } = options;

  cy.log(`Searching for: ${searchText}`);

  cy.get('#simple-search', { timeout })
    .should('exist')
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(searchText);
});
// Apply settings { cy.applySettings(); }
Cypress.Commands.add('applySettings', (options = {}) => {
  const { timeout = 10000, waitAfterApply = 3000 } = options;

  cy.log('Applying settings (if changes exist)...');

  cy.contains('button', 'Apply Settings', { timeout })
    .should('exist')
    .then(($button) => {
      if ($button.is(':disabled')) {
        cy.log('No settings changes detected');
        return;
      }

      cy.log('Applying settings...');
      cy.wrap($button).click();

      cy.wait(waitAfterApply);

      cy.unlockMachineIfNeeded();

      cy.log('Settings applied successfully');
    });
});
//======================
// Select ALtMill Profile 
// =====================
Cypress.Commands.add('selectAltMillProfile', () => {
  cy.goToConfig();
  cy.wait(1000);

  // Open the profile combobox
  cy.get('button[role="combobox"]:not([disabled])')
    .filter((i, el) => /Mill/i.test(el.textContent))
    .first()
    .click();

  // Select AltMill 4X4 (first AltMill option)
  cy.get('[role="listbox"]', { timeout: 10000 })
    .should('be.visible')
    .within(() => {
      cy.contains('[role="option"]', 'AltMill 4X4').click();
    });

  // Verify selection committed in the combobox before touching Defaults
  cy.get('button[role="combobox"]:not([disabled])')
    .filter((i, el) => /Mill/i.test(el.textContent))
    .first()
    .should('contain.text', 'AltMill');

  // Click "Defaults"
  cy.contains('span', 'Defaults').click();

  // Confirm the dialog shows the CORRECT profile name before restoring
  cy.contains(
    /are you sure you want to restore your AltMill 4x4 back to its default state\?/i,
    { timeout: 10000 }
  ).should('be.visible');
// Click on restore to defaults on the dialouge boxx
  cy.get('button.bg-blue-500.bg-opacity-20.border-blue-500')
  .contains('Restore Defaults')
  .should('be.visible')
  .click();

  // Final check: profile is still AltMill 4X4 after everything
  cy.get('button[role="combobox"]:not([disabled])')
    .filter((i, el) => /Mill/i.test(el.textContent))
    .first()
    .should('contain.text', 'AltMill 4X4');
});
//==================================
// Select Longmill Profile 
//=================================

Cypress.Commands.add('selectLongMillProfile', () => {
  cy.goToConfig();
  cy.wait(1000);

  // Open the profile combobox
  cy.get('button[role="combobox"]:not([disabled])')
    .filter((i, el) => /Mill/i.test(el.textContent))
    .first()
    .click();

  // Select LongMill MK2 12x30 (first LongMill option)
  cy.get('[role="listbox"]', { timeout: 10000 })
    .should('be.visible')
    .within(() => {
      cy.contains('[role="option"]', 'LongMill MK2 12x30 (MK2)').click();
    });

  // Verify selection committed in the combobox before touching Defaults
  cy.get('button[role="combobox"]:not([disabled])')
    .filter((i, el) => /Mill/i.test(el.textContent))
    .first()
    .should('contain.text', 'LongMill MK2 12x30 (MK2)');

  // Click "Defaults"
  cy.contains('span', 'Defaults').click();

  // Confirm the dialog shows the CORRECT profile name before restoring
  cy.get('[role="alertdialog"], [role="dialog"]', { timeout: 10000 })
  .should('be.visible')
  .and('contain.text', 'LongMill');


  // Click on Restore Defaults in the dialog
  cy.get('button.bg-blue-500.bg-opacity-20.border-blue-500')
    .contains('Restore Defaults')
    .should('be.visible')
    .click();

  // Final check: profile is still LongMill MK2 12x30 after everything
  cy.get('button[role="combobox"]:not([disabled])')
    .filter((i, el) => /Mill/i.test(el.textContent))
    .first()
    .should('contain.text', 'LongMill MK2 12x30 (MK2)');
});
// Simple URL Navigation Commands
// ==============================

// URL Definitions

  Cypress.Commands.add('closePopupIfVisible', () => {
    cy.get('body').then(($body) => {
        if ($body.find('[role="dialog"]').length > 0) {
            cy.log('Popup found - closing...');
            cy.get('[role="dialog"]')
                .find('button')
                .filter('[aria-label="Close"], :last-of-type')
                .first()
                .click({ force: true });
            cy.wait(500);
            cy.log('Popup closed');
        } else {
            cy.log('No popup found - continuing...');
        }
    });
});
//======================================
// CLosing pop up if visible
//======================================
Cypress.Commands.add("closeAccPopupIfVisible", () => {
    cy.get("body").then(($body) => {
        if ($body.find('[role="alertdialog"]').length > 0) {
            cy.log("Popup detected - closing...");
            cy.get('[role="alertdialog"]')
                .contains("button", "OK")
                .click();

            cy.wait(500);
            cy.log("Popup closed");
        } else {
            cy.log("No popup visible - continuing");
        }
    });
});
//=======================================================================
// Check the profile to which gsender is connected and restore to defaults 
//========================================================================
Cypress.Commands.add('detectBoardAndSelectProfile', () => {
  cy.get('#tab-Console').click();
  cy.clearConsole();
  cy.sendConsoleCommand('$i');

  cy.get('#tabpanel-Console .xterm-rows', { timeout: 15000 })
    .should('contain.text', 'ok');

  cy.get('#tabpanel-Console .xterm-viewport').then(($viewport) => {
    const viewportEl = $viewport[0];
    const scrollHeight = viewportEl.scrollHeight;
    const clientHeight = viewportEl.clientHeight;
    const stepCount = Math.ceil(scrollHeight / clientHeight) + 1;

    const seenLines = new Set();

    const scrollStep = (i) => {
      if (i > stepCount) {
        const fullText = Array.from(seenLines).join('\n');
        cy.log('FULL CAPTURED TEXT:', fullText);

        if (/\[BOARD:SuperLongBoard Ext\]/i.test(fullText)) {
          cy.log('Board is SuperLongBoard Ext - switching to AltMill profile');
          cy.selectAltMillProfile();

        } else if (/\[BOARD:SLB Lite\]/i.test(fullText)) {
          cy.log('Board is SLB Lite - switching to LongMill profile');
          cy.selectLongMillProfile();

        } else {
          throw new Error(`Unrecognized board type in console output: ${fullText}`);
        }

        return;
      }

      const scrollPos = i * clientHeight;
      cy.get('#tabpanel-Console .xterm-viewport').scrollTo(0, scrollPos);
      cy.wait(200);

      cy.get('#tabpanel-Console .xterm-rows').invoke('text').then((text) => {
        text.split('\n').forEach((line) => {
          if (line.trim()) seenLines.add(line.trim());
        });
        scrollStep(i + 1);
      });
    };

    scrollStep(0);
  });
});
//================================
// Click to Run homing if needed
//==============================
Cypress.Commands.add("clickToRunHomingIfNeeded", () => {
    cy.wait(3000); // Wait for machine to stabilize after connect

    cy.get("body").then(($body) => {
        const hasHomingButton = $body.find("header div.mt-4 button").length > 0;
        const homingButtonText = hasHomingButton
            ? $body.find("header div.mt-4 button").text()
            : "";
        const isHomingPrompt = /click to run homing/i.test(homingButtonText);

        if (!hasHomingButton || !isHomingPrompt) {
            cy.log("No 'Click to Run Homing' prompt found — skipping");
            return;
        }

        cy.log("'Click to Run Homing' prompt detected — clicking...");

        cy.get("header div.mt-4 button")
            .contains(/click to run homing/i)
            .should("be.visible")
            .click({ force: true });

        cy.wait(2000);

        // Close the OK alertdialog that appears after homing starts
        cy.get("body").then(($bodyAfter) => {
            const hasAlertDialog = $bodyAfter.find('[role="alertdialog"]').length > 0;

            if (hasAlertDialog) {
                cy.log("Alertdialog appeared — clicking OK...");
                cy.get('[role="alertdialog"]')
                    .contains("button", "OK")
                    .should("be.visible")
                    .click();
                cy.wait(1000);
                cy.log(" Homing started — alertdialog dismissed");
            } else {
                cy.log(" Homing started — no dialog to dismiss");
            }
        });
    });
});

// Page URLs
Cypress.Commands.add("goToCarve", () => {
    cy.visit("http://localhost:8000/#/");
});

Cypress.Commands.add("goToStats", () => {
    cy.visit("http://localhost:8000/#/stats");
});

Cypress.Commands.add("goToTools", () => {
    cy.visit("http://localhost:8000/#/tools");
});

Cypress.Commands.add("goToConfig", () => {
    cy.visit("http://localhost:8000/#/configuration");
});
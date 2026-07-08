describe("Machine Connection and Unlock Test", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config("baseUrl")}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000,
    });
  });

  it("Connect to machine and unlock if needed", () => {

    // --- Step 1: Click "Connect to CNC" button ---
    cy.contains('span', 'Connect to CNC', { timeout: 15000 })
      .should('exist')
      .scrollIntoView()
      .parents('button')
      .first()
      .should('be.visible')
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait(1500);

    // --- Step 2: Retry if dropdown didn't open ---
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

    // --- Step 3: Select first available port ---
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

    // --- Step 4: Wait for machine to stabilize after connection ---
    cy.log("Waiting for machine to stabilize after connection...");
    cy.wait(4000);

    // --- Step 5: Check machine status — skip unlock if already Idle ---
    cy.get("body").then(($body) => {
      const isAlreadyIdle = $body.text().match(/^Idle$/im);

      if (isAlreadyIdle) {
        cy.log("✓ Machine is already in Idle state — no unlock needed");
        return;
      }

      cy.log("Machine is not Idle — checking if unlock is needed...");

      // --- Option 1: Lock icon button in sidebar ---
      const lockButtonSvg = $body.find(
        "#app > div.flex > div.flex > div:nth-of-type(2) div > svg"
      );

      if (lockButtonSvg.length > 0) {
        cy.log("Option 1: Lock icon found — clicking lock button...");

        cy.get("#app > div.flex > div.flex > div:nth-of-type(2) div > svg")
          .should("exist")
          .click({ force: true });

        cy.wait(2000);

        // --- Option 2 (fallback): "Click to Unlock" dialog button ---
        cy.get("body").then(($bodyAfter) => {
          const unlockDialogBtn = $bodyAfter.find("header div.mt-4 button");

          if (unlockDialogBtn.length > 0) {
            cy.log("Option 1 opened a dialog — clicking 'Click to Unlock' button...");

            cy.get("header div.mt-4 button")
              .contains(/click to unlock/i)
              .should("be.visible")
              .click({ force: true });

            cy.wait(2000);
            cy.log("Unlocked via Option 2 (dialog button)");
          } else {
            cy.log("Unlocked via Option 1 (lock button click)");
          }
        });

      } else {
        cy.log("No lock button found — machine may already be unlocked");
      }
    });

    // --- Step 6: Verify Idle state — passes if either unlock worked ---
    cy.log("Waiting for machine to reach Idle state...");

    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should("be.visible")
      .then(() => {
        cy.log("✓ Machine is in Idle state — test passed");
      });

    cy.log("Test completed successfully");
  });
});
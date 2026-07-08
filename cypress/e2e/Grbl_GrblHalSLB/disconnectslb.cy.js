describe("Connect and Disconnect from CNC SLB", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config("baseUrl")}/#/`, {
      maxRetries: 3,
      waitTime: 3000,
      timeout: 5000,
    });
  });

  it("connects and disconnects the CNC machine if Idle", () => {

    // Step 1: Connect to machine
    cy.log("Connecting to CNC machine...");
    cy.connectMachine();

    // Step 2: Verify CNC is Idle
    cy.log("Checking Machine is in Idle...");
    cy.verifyMachineStatus("Idle");

    // Step 3: Disconnect
    cy.log("Machine is Idle — disconnecting...");
    cy.get("div.group").first().trigger("mouseover", { force: true });

    cy.get("div.group div.w-full")
      .contains(/^disconnect$/i)
      .click({ force: true });

    cy.log("Disconnect clicked — verifying status...");

    // Step 4: Verify disconnected
    cy.contains(/Connect to CNC/i, { timeout: 30000 })
      .should("be.visible")
      .then(() => cy.log("Machine disconnect verified successfully."));
  });
});
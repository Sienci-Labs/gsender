describe('ATC Options and Tool Sensor Configuration Test', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it("checks ATC options, sets tool length sensor manually, and verifies template sync status", () => {
    cy.log("Step 1: Connecting to CNC...");
    cy.contains("span", "Connect to CNC", { timeout: 15000 }).should("be.visible");
    cy.wait(1000);
    cy.connectMachine();
    cy.wait(3000);

    cy.log('Checking Machine is in idle');
    cy.verifyMachineStatus('Idle');

    // Go to Tools
    cy.goToTools();

    // Step 2: Navigate to Accessory Install page
    cy.log('Choose accessory installation');
    cy.contains("Install various").click();
    cy.wait(1000);
    cy.log('Accessory Installation page opened');

    // Click Sienci ATC
    cy.log('Click on Sienci ATC');
    cy.contains("Sienci ATC").click();
    cy.wait(1000);
    cy.log('Sienci ATC Set up Wizard page opened');

    // Step 3: Click "ATC Options"
    cy.contains('button', 'ATC Options', { timeout: 10000 }).click();
    cy.wait(1000);

    cy.contains('button', 'Exit', { timeout: 10000 }).click();
cy.wait(1000);

   cy.contains('button', 'Template Management', { timeout: 10000 }).click();
        cy.wait(1000);

        cy.contains('P300.macro', { timeout: 10000 }).click();
        cy.wait(500);
        cy.contains('In sync', { timeout: 10000 }).should('be.visible');

        cy.contains('P301.macro', { timeout: 10000 }).click();
        cy.wait(500);
        cy.contains('In sync', { timeout: 10000 }).should('be.visible');
  });
});
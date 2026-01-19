describe('Grblhal Zeroing axis and go to zero', () => {
 beforeEach(() => {
  cy.viewport(1920, 1080);
  // Use loadUI custom command with dynamic baseUrl
  cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
    maxRetries: 3,
    waitTime: 3000,
    timeout: 5000
  });
});

  it('Test Case: jogging using buttons and zeroing axes', () => {
    const waitAfter = 2000; // Define waitAfter variable

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Connected');

    // Step 2: Wait for Idle status
    cy.log('Step 2: Waiting for Idle status...');
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(2000);
    cy.log('Machine is Idle');

    // Step 3: Move to position (0, 0, 0)
    cy.log('Step 3: Moving to position (0, 0, 0)...');
    cy.goToLocation({ x: 0, y: 0, z: 0 });
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('At position (0, 0, 0)');

    // Step 4: Test X-axis movement and zeroing
    cy.log('Step 4: Testing X-axis...');
    cy.contains('button', 'Normal').click();
    cy.wait(500);

    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(1) input', '5');
    cy.wait(500);

    cy.get('#xPlus').click();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.verifyAxes(5, 0, 0);
    cy.log('X moved to 5mm');

    // Zero X axis
    cy.log('Zeroing X axis...');
    cy.get('button', { timeout: 3000 })
      .contains('span.font-mono', 'X0')
      .parent()
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.wait(waitAfter);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('X axis zeroed');

    // Step 5: Test Y-axis movement and zeroing
    cy.log('Step 5: Testing Y-axis...');
    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(1) input', '5');
    cy.wait(500);

    cy.get('#yPlus').click();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.verifyAxes(0, 5, 0);
    cy.log('Y moved to 5mm');

    // Zero Y axis
    cy.log('Zeroing Y axis...');
    cy.get('button', { timeout: 3000 })
      .contains('span.font-mono', 'Y0')
      .parent()
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.wait(waitAfter);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Y axis zeroed');

    // Step 6: Test Z-axis movement and zeroing
    cy.log('Step 6: Testing Z-axis...');
    cy.forceInput('div.gap-1 > div.items-center > div > div:nth-of-type(2) input', '5');
    cy.wait(500);

    cy.get('path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.verifyAxes(0, 0, 5);
    cy.log('Z moved to 5mm');

    // Zero Z axis
    cy.log('Zeroing Z axis...');
    cy.get('button', { timeout: 3000 })
      .contains('span.font-mono', 'Z0')
      .parent()
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.wait(waitAfter);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Z axis zeroed');

    cy.log('All axes tested and zeroed successfully');

    // Testing go to X axis zero
    // Click on console tab 
    cy.log('Step 7: Opening Console tab...');
    cy.get('button')
      .contains('Console')
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log(' Console tab opened');

    // Step 8: Click X button to go to X=0
    cy.log('Step 8: Clicking X button to go to X=0...');
    cy.get('button.bg-robin-500')
      .find('span.font-mono')
      .contains('X')
      .parent()
      .should('be.visible')
      .click();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log(' X button clicked');

    // Verify console lines has values for go to X axis 0 
    cy.log('Step 9: Verifying console contains details about moving to X zero axis...');
    cy.verifyConsoleContains('G90 G0 X0', 'ok');
    cy.log('X axis go to zero verified');

    // Step 10: Click Y button to go to Y=0
    cy.log('Step 10: Clicking Y button to go to Y=0...');
    cy.get('button.bg-robin-500')
      .find('span.font-mono')
      .contains('Y')
      .parent()
      .should('be.visible')
      .click();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log(' Y button clicked');

    // Verify console lines has values for go to Y axis 0 
    cy.log('Step 11: Verifying console contains details about moving to Y zero axis...');
    cy.verifyConsoleContains('G90 G0 Y0', 'ok');
    cy.log('Y axis go to zero verified');

    // Step 12: Click Z button to go to Z=0
    cy.log('Step 12: Clicking Z button to go to Z=0...');
    cy.get('button.bg-robin-500')
      .find('span.font-mono')
      .contains('Z')
      .parent()
      .should('be.visible')
      .click();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('Z button clicked');

    // Verify console lines has values for go to Z axis 0 
    cy.log('Step 13: Verifying console contains details about moving to Z zero axis...');
    cy.verifyConsoleContains('G90 G0 Z0', 'ok');
    cy.log(' Z axis go to zero verified');

    // Step 14: Click XY button to go to XY=0
    cy.log('Step 14: Clicking XY button to go to XY=0...');
    cy.get('button.bg-robin-500')
      .find('span.font-mono')
      .contains('XY')
      .parent()
      .should('be.visible')
      .click();
    cy.wait(3000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('XY button clicked');

    // Verify console lines has values for go to XY axis 0 
    cy.log('Step 15: Verifying console contains details about moving to XY zero axes...');
    cy.verifyConsoleContains('G90 G0 X0 Y0', 'ok');
    cy.log('XY axes go to zero verified');

    cy.log('All go-to-zero operations completed and verified successfully');
  });

});
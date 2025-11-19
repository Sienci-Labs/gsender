// ***********************************************
// cypress/support/commands.js
// Custom commands for Gsender
// ***********************************************

// ----------------------
// Connect to CNC machine
// ----------------------
Cypress.Commands.add('connectMachine', () => {
  cy.wait(5000); // wait 5 secs for UI to load 

  // Log all page text (for debugging)
  cy.get('body').then(($body) => {
    cy.log('Page Text: ', $body.text());
  });

  // Find the Connect button (case-insensitive)
  cy.contains(/^connect to CNC$/i, { timeout: 20000 })
    .should('exist')
    .scrollIntoView()
    .should('be.visible')
    .trigger('mouseover');

  // Click the first COM port (e.g., COM5)
  cy.get('div.absolute', { timeout: 20000 })
    .should('be.visible')
    .find('button')
    .first()
    .should('contain.text', 'COM')
    .click({ force: true });

  cy.log('Successfully selected the first COM port and connected to CNC');
});

// ----------------------
// Disconnect if Idle
// ----------------------
Cypress.Commands.add('disconnectIfIdle', () => {
  cy.wait(5000); // wait 5 secs for UI to load 

  // Check if status is Idle
  cy.contains(/^Idle$/i, { timeout: 20000 })
    .then((status) => {
      const machineStatus = status.text().trim();
      cy.log(`Machine status: "${machineStatus}"`);

      if (machineStatus.toLowerCase() === 'idle') {
        cy.log('Machine is Idle — disconnecting...');

        // Click the Disconnect button
        cy.get('button.bg-red-600.text-white')
          .contains(/^disconnect$/i)
          .click({ force: true });

        // Verify disconnect succeeded
        cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 })
          .should('be.visible')
          .then(() => cy.log('Machine disconnect verified successfully.'));
      } else {
        cy.log('Machine is not Idle — skipping disconnect.');
      }
    });
});

// ----------------------
// Upload G-code file
// ----------------------
Cypress.Commands.add('uploadGcodeFile', (fileName = 'sample.gcode') => {
  cy.wait(5000);

  cy.contains('Load File')
    .should('be.visible')
    .click({ force: true });

  cy.get('#fileInput')
    .selectFile(`cypress/fixtures/${fileName}`, { force: true });

  cy.wait(5000);
  
  cy.log(` G-code file ${fileName} uploaded successfully`);
});

// ----------------------
// Go to location grbl
// ----------------------
Cypress.Commands.add('goToLocation', (options = {}) => {
  const { 
    x = 0, 
    y = 0, 
    z = 0, 
    verifyPosition = true,
    waitTime = 3000
  } = options;

  cy.log(`Opening "Go to Location" dialog for coordinates (${x}, ${y}, ${z})...`);
  
  // Open Go To Location popup
  cy.get('div.min-h-10 button')
  .first()  // Click only the first button
  .should('be.visible')
  .click({ force: true });

  cy.wait(1000);
  cy.log(' "Go to Location" button clicked');

  // Enter coordinates
  cy.log(`Entering coordinates: X=${x}, Y=${y}, Z=${z}...`);

  cy.get('body > div:nth-of-type(2) input[type="number"]').then(($inputs) => {
    cy.log(`Found ${$inputs.length} number inputs`);
    
    // X input
    cy.wrap($inputs[0])
      .clear({ force: true })
      .type(String(x), { force: true })
      .should('have.value', String(x));
    cy.log(` X coordinate: ${x}`);

    // Y input  
    cy.wrap($inputs[1])
      .clear({ force: true })
      .type(String(y), { force: true })
      .should('have.value', String(y));
    cy.log(` Y coordinate: ${y}`);

    // Z input
    cy.wrap($inputs[2])
      .focus()
      .clear({ force: true })
      .invoke('val', '')
      .type(String(z), { force: true })
      .blur()
      .should('have.value', String(z));
    cy.log(` Z coordinate: ${z}`);
  });

  cy.wait(500);

  // Click Go button
  cy.log('Clicking "Go!" button...');
  cy.get('body > div:nth-of-type(2) button')
    .contains('Go!')
    .click({ force: true, multiple: true });
  
  cy.wait(2000);
  cy.log(' Go button clicked');

  // Close popup
  cy.log('Closing popup...');
  cy.get('body').click(50, 50, { force: true });
  cy.wait(500);
  cy.log(' Popup closed');

  // Wait for machine to reach position
  cy.log(`Waiting ${waitTime}ms for machine to reach position...`);
  cy.wait(waitTime);

  // Verify position (if enabled)
  if (verifyPosition) {
    cy.log('Verifying machine position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .should('have.length', 3)
      .then(($inputs) => {
        const xValue = $inputs.eq(0).val();
        const yValue = $inputs.eq(1).val();
        const zValue = $inputs.eq(2).val();
        
        cy.log(`Current position: X=${xValue}, Y=${yValue}, Z=${zValue}`);
        
        const expectedX = parseFloat(x).toFixed(2);
        const expectedY = parseFloat(y).toFixed(2);
        const expectedZ = parseFloat(z).toFixed(2);
        
        cy.wrap($inputs.eq(0)).should('have.value', expectedX);
        cy.wrap($inputs.eq(1)).should('have.value', expectedY);
        cy.wrap($inputs.eq(2)).should('have.value', expectedZ);
        
        if (xValue === expectedX && yValue === expectedY && zValue === expectedZ) {
          cy.log(` POSITION VERIFIED: Machine is at (${expectedX}, ${expectedY}, ${expectedZ}) ✓✓✓`);
        } else {
          cy.log(' POSITION MISMATCH');
          throw new Error(`Expected (${expectedX}, ${expectedY}, ${expectedZ}) but got (${xValue}, ${yValue}, ${zValue})`);
        }
      });
  }

  cy.log(` Successfully moved to location (${x}, ${y}, ${z})`);
});

/// ============Go to location grlHal===============
                //GO TO LOCATION//
Cypress.Commands.add('grblHalGoToLocation', (x = 0, y = 0, z = 0) => {

  // Step 3: Open Go To Location popup
  cy.log('Opening Go to Location popup...');
  cy.get('svg path[d*="M498.1 5.6c10.1 7"]').parent().click({ force: true });

  cy.wait(1000);
  cy.log('"Go to Location" popup opened');

  // Step 4: Enter coordinates in all input fields
  cy.log('Entering X, Y, Z values...');

  cy.get('body > div:nth-of-type(2) input[type="number"]').then(($inputs) => {
    cy.log(`Found ${$inputs.length} number inputs`);

    cy.wrap($inputs[0])
      .clear({ force: true })
      .type(String(x), { force: true })
      .should('have.value', String(x));

    cy.wrap($inputs[1])
      .clear({ force: true })
      .type(String(y), { force: true })
      .should('have.value', String(y));

    cy.wrap($inputs[2])
      .focus()
      .clear({ force: true })
      .invoke('val', '')
      .type(String(z), { force: true })
      .blur()
      .should('have.value', String(z));
  });

  cy.wait(500);

  // Step 5: Click Go button
  cy.log('Clicking Go button...');
  cy.get('body > div:nth-of-type(2) button')
    .contains('Go!')
    .click({ force: true });

  cy.wait(2000);
  cy.log('Go button clicked');

  // Step 6: Close popup
  cy.log('Closing popup...');
  cy.get('body').click(50, 50, { force: true });
  cy.wait(500);
  cy.log('Popup closed');

  // Step 7: Wait for machine movement
  cy.log('Waiting for machine to reach position...');
  cy.wait(3000);
});

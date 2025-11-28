// ***********************************************
// cypress/support/commands.js
// Custom commands for Gsender
// ***********************************************

// ----------------------
// Wait for Idle State
// ----------------------
Cypress.Commands.add('waitForIdle', (timeout = 30000) => {
  cy.log('Waiting for machine to reach Idle state...');
  
  // Try multiple approaches to find Idle status
  cy.get('body', { timeout: timeout }).should(($body) => {
    const bodyText = $body.text();
    expect(bodyText).to.include('Idle');
  }).then(() => {
    cy.log(' Machine is in Idle state');
  });
});

// ----------------------
// Connect to CNC machine grbl
// ----------------------
Cypress.Commands.add('connectMachine', () => {
  cy.log('Starting connection check...');
  cy.wait(2000); // Brief wait for UI to stabilize
  
  cy.get('body').then(($body) => {
    const bodyText = $body.text();
    
    // Check if already in Idle state
    if (/\bIdle\b/i.test(bodyText)) {
      cy.log('Machine is already connected and in Idle state');
      return;
    }
    
    // Check if connected but waiting for Idle
    if (/\b(Disconnect|disconnect)\b/.test(bodyText)) {
      cy.log('Machine is connected, waiting for Idle state...');
      cy.contains(/^Idle$/i, { timeout: 30000 })
        .should('be.visible')
        .then(() => {
          cy.log('Machine reached Idle state');
        });
      return;
    }
    
    // Not connected - initiate connection
    cy.log('Machine not connected. Initiating connection...');
    
    cy.contains(/^connect to CNC$/i, { timeout: 20000 })
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true })
      .then(() => {
        cy.log('Connect button clicked');
        cy.wait(1000);
        
        // Select first available COM port
        cy.get('div.absolute', { timeout: 20000 })
          .should('be.visible')
          .find('button')
          .first()
          .should('contain.text', 'COM')
          .then(($btn) => {
            const portName = $btn.text().trim();
            cy.log(`Selecting port: ${portName}`);
            cy.wrap($btn).click({ force: true });
          });
        
        // Handle unlock if needed
        cy.unlockMachineIfNeeded();
        
        // Wait for Idle state
        cy.log('Waiting for machine to reach Idle state...');
        cy.contains(/^Idle$/i, { timeout: 30000 })
          .should('be.visible')
          .then(() => {
            cy.log('CNC machine connected successfully and is in Idle state');
          });
      });
  });
});

// -----------------------
// Auto unlock 
// -----------------------
Cypress.Commands.add('autoUnlock', () => {
  cy.get('body', { log: false, timeout: 1000 }).then({ timeout: 1000 }, ($body) => {
    const bodyText = $body.text().toLowerCase();
    
    if (bodyText.includes('unlock')) {
      cy.log('Unlock popup detected');
      
      // Find and click unlock button
      cy.get('button', { log: false }).then($buttons => {
        let unlocked = false;
        
        $buttons.each((index, btn) => {
          const $btn = Cypress.$(btn);
          if ($btn.text().toLowerCase().includes('unlock') && $btn.is(':visible')) {
            $btn.click();
            cy.log('Auto-unlocked');
            unlocked = true;
            return false; // break loop
          }
        });
        
        if (!unlocked) {
          cy.log('Unlock button not found or not visible');
        }
      });
    } else {
      cy.log('No unlock needed');
    }
  });
});

// ------------------------
// Connect to CNC - GrblHAL
// ----------------------
Cypress.Commands.add('connectToGrblHAL', (options = {}) => {
  const {
    timeout = 30000,
    unlockIfNeeded = true,
    verifyFirmware = true,
    waitForIdle = true
  } = options;

  cy.log('Starting GrblHAL connection process...');

  // Step 1: Find and click Connect button using SVG icon
  cy.log('Step 1: Looking for Connect to CNC button...');
  
  // Target the specific SVG icon in the Connect button
  cy.get('svg[viewBox="0 0 256 256"]', { timeout: 20000 })
    .parents('div.h-12.max-xl\\:h-10')
    .should('exist')
    .scrollIntoView()
    .should('be.visible')
    .then(($btn) => {
      cy.log('Found Connect button with wrench icon');
      cy.wrap($btn).click({ force: true });
    });

  cy.wait(3000);
  cy.log('Connect button clicked');

  // Step 2: Select COM port
  cy.log('Step 2: Selecting COM port...');
  cy.get('div.absolute', { timeout: 20000 })
    .should('be.visible')
    .find('button')
    .first()
    .should('contain.text', 'COM')
    .then(($btn) => {
      const portName = $btn.text().trim();
      cy.log(`Selecting port: ${portName}`);
      $btn.click();
    });

  cy.wait(3000);
  cy.log(' COM port selected');

  // Step 3: Unlock machine if needed
  if (unlockIfNeeded) {
    cy.log('Step 3: Checking if unlock is needed...');
    cy.unlockMachineIfNeeded();
  }

  // Step 4: Wait for Idle state
  if (waitForIdle) {
    cy.log('Step 4: Waiting for machine to reach Idle state...');
    cy.contains(/^Idle$/i, { timeout })
      .should('be.visible')
      .then(() => {
        cy.log(' Machine is in Idle state');
      });
  }

  // Step 5: Verify firmware type
  if (verifyFirmware) {
    cy.log('Step 5: Verifying GrblHAL firmware...');
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();

      if (text.includes('grblhal')) {
        cy.log('Firmware Detected: GrblHAL');
      } else if (text.includes('grbl')) {
        cy.log('Firmware Detected: Grbl (not GrblHAL)');
      } else {
        cy.log('Firmware information not found');
      }
    });
  }

  cy.log(' GrblHAL connection process completed');
});

// ----------------------
// Disconnect if Idle
// ----------------------
Cypress.Commands.add('disconnectIfIdle', () => {
  cy.wait(5000);
  cy.contains(/^Idle$/i, { timeout: 20000 })
    .then((status) => {
      const machineStatus = status.text().trim();
      cy.log(`Machine status: "${machineStatus}"`);
      if (machineStatus.toLowerCase() === 'idle') {
        cy.log('Machine is Idle — disconnecting...');
        cy.get('button.bg-red-600.text-white')
          .contains(/^disconnect$/i)
          .click({ force: true });
        cy.contains(/(Connect to CNC|Disconnected)/i, { timeout: 10000 })
          .should('be.visible')
          .then(() => cy.log(' Machine disconnect verified successfully.'));
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
  cy.log(`G-code file ${fileName} uploaded successfully`);
});

// ----------------------
// Go to location grbl
// ----------------------
Cypress.Commands.add('goToLocation', (options = {}) => {
  const { x = 0, y = 0, z = 0, verifyPosition = true, waitTime = 3000 } = options;

  cy.log(`Opening "Go to Location" dialog for coordinates (${x}, ${y}, ${z})...`);
  
  cy.get('div.min-h-10 button')
    .first()
    .should('be.visible')
    .click({ force: true });

  cy.wait(1000);
  cy.log('"Go to Location" button clicked');

  cy.log(`Entering coordinates: X=${x}, Y=${y}, Z=${z}...`);
  cy.get('body > div:nth-of-type(2) input[type="number"]').then(($inputs) => {
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

  cy.log('Clicking "Go!" button...');
  cy.get('body > div:nth-of-type(2) button')
    .contains('Go!')
    .click({ force: true, multiple: true });
  
  cy.wait(2000);
  cy.log('Go button clicked');

  cy.log('Closing popup...');
  cy.get('body').click(50, 50, { force: true });
  cy.wait(500);
  cy.log('Popup closed');

  cy.log(`Waiting ${waitTime}ms for machine to reach position...`);
  cy.wait(waitTime);

  if (verifyPosition) {
    cy.log('Verifying machine position...');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .should('have.length', 3)
      .then(($inputs) => {
        const xValue = $inputs.eq(0).val();
        const yValue = $inputs.eq(1).val();
        const zValue = $inputs.eq(2).val();

        const expectedX = parseFloat(x).toFixed(2);
        const expectedY = parseFloat(y).toFixed(2);
        const expectedZ = parseFloat(z).toFixed(2);

        cy.wrap($inputs.eq(0)).should('have.value', expectedX);
        cy.wrap($inputs.eq(1)).should('have.value', expectedY);
        cy.wrap($inputs.eq(2)).should('have.value', expectedZ);

        if (xValue === expectedX && yValue === expectedY && zValue === expectedZ) {
          cy.log(` POSITION VERIFIED: Machine is at (${expectedX}, ${expectedY}, ${expectedZ})`);
        } else {
          throw new Error(`Expected (${expectedX}, ${expectedY}, ${expectedZ}) but got (${xValue}, ${yValue}, ${zValue})`);
        }
      });
  }

  cy.log(`Successfully moved to location (${x}, ${y}, ${z})`);
});

// ----------------------
// Go to location grblHal
// ----------------------
Cypress.Commands.add('grblHalGoToLocation', (x = 0, y = 0, z = 0) => {
  cy.log('Opening Go to Location popup...');
  cy.get('svg path[d*="M498.1 5.6c10.1 7"]').parent().click({ force: true });

  cy.wait(1000);
  cy.log('"Go to Location" popup opened');

  cy.get('body > div:nth-of-type(2) input[type="number"]').then(($inputs) => {
    cy.wrap($inputs[0]).clear({ force: true }).type(String(x), { force: true }).should('have.value', String(x));
    cy.wrap($inputs[1]).clear({ force: true }).type(String(y), { force: true }).should('have.value', String(y));
    cy.wrap($inputs[2]).focus().clear({ force: true }).invoke('val', '').type(String(z), { force: true }).blur().should('have.value', String(z));
  });

  cy.wait(500);

  cy.get('body > div:nth-of-type(2) button')
    .contains('Go!')
    .click({ force: true });

  cy.wait(2000);
  cy.get('body').click(50, 50, { force: true });
  cy.wait(500);
});

// ----------------------
// Unlock Machine if Needed
// ----------------------
Cypress.Commands.add('unlockMachineIfNeeded', () => {
  cy.get('body').then($body => {
    if ($body.find('svg.hidden').length > 0) {
      cy.log('Machine locked - unlocking...');
      cy.get('svg.hidden').parent('button').click({ force: true });
      cy.wait(1000);
      cy.log('Machine unlocked');
    } else {
      cy.log('Machine already unlocked');
    }
  });
});

// ----------------------
// Verify Specific Console Line Contains Text
// ----------------------
Cypress.Commands.add('verifyConsoleContains', (text) => {
  cy.log(`Checking if console contains: "${text}"`);
  
  cy.get('div.xterm-rows')
    .should('be.visible')
    .invoke('text')
    .should('include', text)
    .then(() => {
      cy.log(`Console contains: "${text}"`);
    });
});

// ----------------------
// Zero X Axis
// ----------------------
Cypress.Commands.add('zeroXAxis', () => {
  cy.log('Zeroing X axis...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(1) > div:nth-of-type(1) > button')
    .contains('X0')
    .click();
  cy.wait(500);
  cy.log('X axis zeroed');
});

// ----------------------
// Zero Y Axis
// ----------------------
Cypress.Commands.add('zeroYAxis', () => {
  cy.log('Zeroing Y axis...');
  cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
    .contains('Y0')
    .click();
  cy.wait(500);
  cy.log('Y axis zeroed');
});

// ----------------------
// Zero Z Axis
// ----------------------
Cypress.Commands.add('zeroZAxis', () => {
  cy.log('Zeroing Z axis...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
    .contains('Z0')
    .click();
  cy.wait(1000);
  cy.log('Z axis zeroed');
});

// ----------------------
// Zero All Axes
// ----------------------
Cypress.Commands.add('zeroAllAxes', () => {
  cy.log('Resetting all axes to zero...');
  cy.zeroXAxis();
  cy.zeroYAxis();
  cy.zeroZAxis();
  cy.log('All axes zeroed');
});

// ----------------------
// Force input into a field
// ----------------------
Cypress.Commands.add('forceInput', (selector, value) => {
  cy.get(selector)
    .clear({ force: true })
    .type(value, { force: true })
    .blur({ force: true })
    .then(($el) => {
      expect($el.val()).to.equal(value);
    });
});
// ----------------------
// Send Console Command
// ----------------------
Cypress.Commands.add('sendConsoleCommand', (command) => {
  cy.log(`Sending console command: ${command}`);
  
  // Find the visible console input field
  cy.get('div.block input')
    .filter(':visible')
    .first()
    .clear({ force: true })
    .type(command, { force: true });
  
  // Click the Run button
  cy.get('div.block button')
    .contains(/Run/i)
    .should('be.visible')
    .click({ force: true });
  
  cy.wait(1000);
  cy.log(` Command sent: ${command}`);
});
// ----------------------
// Clear Console Command
// ----------------------
Cypress.Commands.add('clearConsole', () => {
  cy.log('Clearing console...');
  
  // Step 1: Click on Console tab to ensure it's active
  cy.get('div.h-\\[25\\%\\] button:nth-of-type(4)')
    .contains(/Console/i)
    .click({ force: true });
  
  cy.wait(500);
  cy.log('Console tab activated');
  
  // Step 2: Click the console options button (three dots icon)
  cy.get('div.block > div.grid > div.flex svg')
    .should('be.visible')
    .click({ force: true });
  
  cy.wait(500);
  cy.log('Console options menu opened');
  
  // Step 3: Click "Clear Console" from the dropdown
  cy.get('body > div:nth-of-type(2) div > div:nth-of-type(2) span')
    .contains(/Clear Console/i)
    .should('be.visible')
    .click({ force: true });
  
  cy.wait(500);
  cy.log('Console cleared successfully');
});
// ----------------------
// Verify axes for expected values (flexible with decimals)
// ----------------------
Cypress.Commands.add('verifyAxes', (expectedX = 0, expectedY = 0, expectedZ = 0) => {
  cy.log(`Verifying axes positions: X=${expectedX}, Y=${expectedY}, Z=${expectedZ}...`);

  // Convert expected values to strings with proper formatting
  const formatValue = (val) => {
    const num = parseFloat(val);
    return num % 1 === 0 ? num.toFixed(0) : num.toString();
  };

  const expectedXStr = formatValue(expectedX);
  const expectedYStr = formatValue(expectedY);
  const expectedZStr = formatValue(expectedZ);

  // Get the position input fields that display current coordinates
  cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
    .should('have.length', 3)
    .then(($inputs) => {
      const xValue = $inputs.eq(0).val();
      const yValue = $inputs.eq(1).val();
      const zValue = $inputs.eq(2).val();

      cy.log(`Current positions - X: ${xValue}, Y: ${yValue}, Z: ${zValue}`);
      cy.log(`Expected positions - X: ${expectedXStr}, Y: ${expectedYStr}, Z: ${expectedZStr}`);

      // Verify X axis
      expect(parseFloat(xValue)).to.be.closeTo(parseFloat(expectedXStr), 0.01);
      
      // Verify Y axis
      expect(parseFloat(yValue)).to.be.closeTo(parseFloat(expectedYStr), 0.01);
      
      // Verify Z axis
      expect(parseFloat(zValue)).to.be.closeTo(parseFloat(expectedZStr), 0.01);
    });

  cy.log('Axes verified successfully');

});
// ***********************************************
// cypress/support/commands.js
// Custom commands for Gsender
//1. wait for idle status
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
// ***********************************************


// ----------------------
// 1.Wait for Idle State
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
//=======//
//2.Load UI//
//=======//
Cypress.Commands.add('loadUI', (url, options = {}) => {
  const {
    maxRetries = 3,
    waitTime = 3000,
    timeout = 5000
  } = options;

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

    // Check multiple indicators that UI has loaded
    cy.get('body', { timeout }).then(($body) => {
      const hasButton = $body.find('button').length > 0;
      const hasCOM = $body.text().includes('COM');
      const hasConnection = $body.text().includes('Connect') || $body.text().includes('Connection');
      
      const uiLoaded = hasButton && (hasCOM || hasConnection);
      
      cy.log(`Buttons found: ${hasButton}, COM text: ${hasCOM}, Connection text: ${hasConnection}`);
      
      if (uiLoaded) {
        cy.log(' UI loaded successfully');
      } else if (attempt < maxRetries) {
        cy.log(' UI not loaded, refreshing...');
        tryLoadUI(attempt + 1);
      } else {
        throw new Error(`Failed to load UI after ${maxRetries} attempts`);
      }
    });
  }

  tryLoadUI();
});

// ----------------------
//3.Connect to CNC machine grbl
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
//-----------------------
//21.Axis Homing Z< Y & X 
//-----------------------
Cypress.Commands.add('enableAxisHomingAndHome', () => {
  cy.log('Starting axis homing configuration and execution...');

  // Step 1: Navigate to Config page
  cy.log('Navigating to Config page...');
  cy.get('a:nth-of-type(4) span').click();
  cy.wait(1000);

  // Step 2: Navigate to Homing section
  cy.log('Opening Homing settings...');
  cy.get('button:nth-of-type(6) > span:nth-of-type(2)').click();
  cy.wait(500);

  // Step 3: Check and enable all required homing settings if disabled
  cy.log('Checking axis homing conditions...');
  
  const settingsToCheck = [
    { id: '$22-0-key', name: 'Enable Homing' },
    { id: '$22-1-key', name: 'Enable single axis commands'},
    { id: '$22-2-key', name: 'Homing on startup required' },
    { id: '$22-3-key', name: 'Set Machine origin to 0' },
    { id: '$22-5-key', name: 'Allow Manual' },
    { id: '$22-6-key', name: 'Override locks' }
  ];

  let changesDetected = false;

  settingsToCheck.forEach(setting => {
    cy.get(`button#\\${setting.id}`).then($toggle => {
      if ($toggle.attr('aria-checked') === 'false') {
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
  cy.log('Checking if settings need to be applied...');
  cy.contains('button', 'Apply Settings').then($button => {
    if ($button.is(':disabled')) {
      cy.log('No changes detected - ignoring Apply Settings');
    } else {
      cy.log('Applying settings...');
      cy.wrap($button).click();
      cy.wait(2000);
      cy.unlockMachineIfNeeded();
      cy.wait(1000);
    }
  });

  // Step 5: Navigate back to main page
  cy.log('Returning to main view...');
  cy.get('#app > div > div.h-full > div.flex img').click();
  cy.wait(1000);
  cy.unlockMachineIfNeeded();
  cy.wait(1000);

  // Step 6: Enable Homing Toggle
  cy.log('Enabling homing toggle button...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button')
    .click();
  cy.wait(1000);

  // Step 7: Verify axes changed to homing mode
  cy.log('Verifying homing mode activated...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
    .should('contain.text', 'HX');
  cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
    .should('contain.text', 'HY');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
    .should('contain.text', 'HZ');

  // Step 8: Execute Z-axis homing
  cy.log('Homing Z-axis...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div:nth-of-type(3) > div:nth-of-type(1) span')
    .contains('HZ')
    .click();
  cy.wait(2000);
  cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
  cy.log('Z-axis homing completed');
  cy.wait(1000);

  // Step 9: Execute Y-axis homing
  cy.log('Homing Y-axis...');
  cy.get('div.h-\\[75\\%\\] div.flex-col > div:nth-of-type(2) > div:nth-of-type(1) span')
    .contains('HY')
    .click();
  cy.wait(2000);
  cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
  cy.log('Y-axis homing completed');
  cy.wait(1000);

  // Step 10: Execute X-axis homing
  cy.log('Homing X-axis...');
  cy.get('div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(1) > div:nth-of-type(1) span')
    .contains('HX')
    .click();
  cy.wait(2000);
  cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
  cy.log('X-axis homing completed');
  cy.wait(1000);

  cy.log('Axis homing sequence completed successfully!');
});

// ----------------------
// 17. Check Homing, Enable if Needed, and Perform Homing
// ----------------------
Cypress.Commands.add('ensureHomingEnabledAndHome', (options = {}) => {
  const {
    verifyHomingStatus = true,
    verifyFinalPosition = true,
    timeout = 60000
  } = options;

  cy.log('Checking homing configuration...');
  
  // Navigate to Config page
  cy.get('a:nth-of-type(4) svg').click();
  cy.wait(1000);
  cy.log('Config page opened');
  
  // Navigate to Homing section
  cy.contains('button', /homing/i).click();
  cy.wait(500);
  cy.log('Homing settings section opened');
  
  // Check if Enable Homing ($22-0-key) is enabled
  cy.get('button#\\$22-0-key').then($toggle => {
    const isEnabled = $toggle.attr('aria-checked') === 'true';
    
    if (isEnabled) {
      cy.log('Homing is already enabled');
      
    } else {
      cy.log('Homing is disabled - enabling now...');
      
      // Enable all required homing settings
      const settingsToEnable = [
        { id: '$22-0-key', name: 'Enable Homing' },
        { id: '$22-2-key', name: 'Homing on startup required' },
        { id: '$22-3-key', name: 'Set Machine origin to 0' },
        { id: '$22-5-key', name: 'Allow Manual' },
        { id: '$22-6-key', name: 'Override locks' }
      ];

      settingsToEnable.forEach(setting => {
        cy.get(`button#\\${setting.id}`).then($btn => {
          if ($btn.attr('aria-checked') === 'false') {
            cy.log(`  Enabling: ${setting.name}`);
            cy.wrap($btn).click();
            cy.wait(300);
          }
        });
      });

      // Apply Settings
      cy.log('Applying homing settings...');
      cy.contains('button', 'Apply Settings').then($button => {
        if (!$button.is(':disabled')) {
          cy.wrap($button).click();
          cy.wait(2000);
          cy.unlockMachineIfNeeded();
          cy.wait(1000);
          cy.log('Settings applied successfully');
        }
      });
    }

    // Navigate back to Carve page
    cy.log('Returning to Carve page...');
    cy.get('a:nth-of-type(1) img').click();
    cy.wait(1000);
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Returned to Carve page');

    // Wait for machine to be ready
    cy.log('Waiting for machine ready state...');
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(1000);
    cy.log('Machine is ready');

    // Perform homing sequence
    cy.log('Performing homing sequence...');
    
    // Open homing menu
    cy.get('div.flex-shrink-0 > div > div > div > div').click();
    cy.wait(500);
    
    // Click Home button
    cy.contains('button', 'Home').click();
    cy.wait(1000);
    cy.log('Homing command sent');

    if (verifyHomingStatus) {
      // Verify homing in progress
      cy.log('Verifying homing process...');
      cy.contains('span', 'Homing', { timeout: 10000 }).should('be.visible');
      cy.log('Homing status displayed');
    }

    // Wait for homing to complete
    cy.log('Waiting for homing to complete...');
    cy.contains(/^Idle$/i, { timeout: timeout }).should('be.visible');
    cy.wait(2000);
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();
    cy.wait(1000);
    cy.log('Homing completed successfully');

  });
});


//4.Auto unlock 
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
// 5.Connect to CNC - GrblHAL
// ----------------------
Cypress.Commands.add('connectToGrblHAL', (options = {}) => {
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

// ----------------------
// 6.Disconnect if Idle
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
//7.Upload G-code file
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
//8.Go to location grbl
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
//9.Go to location grblHal
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
//10.Unlock Machine if Needed
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
//11.Verify Specific Console Line Contains Text
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
//12.Zero X Axis
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
//13.Zero Y Axis
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

// ----------------------
//15.Zero All Axes
// ----------------------
Cypress.Commands.add('zeroAllAxes', () => {
  cy.log('Resetting all axes to zero...');
  cy.zeroXAxis();
  cy.zeroYAxis();
  cy.zeroZAxis();
  cy.log('All axes zeroed');
});

// ----------------------
//16.Force input into a field
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
//17.Send Console Command
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
//18.Clear Console Command
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
//19.Verify axes for expected values (flexible with decimals)
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

// Delete all macro files
// Custom command to delete all macros (MORE ROBUST)
Cypress.Commands.add('deleteAllMacros', () => {
  cy.log('=== DELETE ALL MACROS - Custom Command ===');
  
  function deleteNextMacro() {
    cy.get('body').then($body => {
      const macros = $body.find('div.flex-grow span');
      
      if (macros.length === 0) {
        cy.log('✅ All macros have been deleted');
        return;
      }
      
      const macroName = macros.first().text().trim();
      cy.log(`🗑️ Deleting: "${macroName}" | Remaining: ${macros.length}`);
      
      // Find and click the three-dot menu
      cy.get('div.flex-grow span')
        .first()
        .closest('div[class*="flex"]')
        .find('button')
        .last()
        .click({ force: true });
      
      cy.wait(2000);  // Give menu time to appear
      
      // Try multiple strategies to find Delete option
      cy.get('body').then($menuBody => {
        // Strategy 1: Look for span with Delete text
        if ($menuBody.find('span:contains("Delete")').length > 0) {
          cy.log('Found Delete in span');
          cy.contains('span', 'Delete')
            .first()
            .click({ force: true });
        }
        // Strategy 2: Look for div with Delete text
        else if ($menuBody.find('div:contains("Delete")').length > 0) {
          cy.log('Found Delete in div');
          cy.contains('div', 'Delete')
            .first()
            .click({ force: true });
        }
        // Strategy 3: Look for menu item role
        else if ($menuBody.find('[role="menuitem"]').length > 0) {
          cy.log('Found menuitem role');
          cy.get('[role="menuitem"]')
            .contains(/Delete/i)
            .click({ force: true });
        }
        // Strategy 4: Just find any element with Delete
        else {
          cy.log('Using fallback - any element with Delete');
          cy.contains(/Delete/i)
            .first()
            .click({ force: true });
        }
      });
      
      cy.wait(2000);
      
      // Confirm deletion in dialog - try multiple approaches
      cy.get('body').then($dialogBody => {
        // Look for button with Delete text that's visible
        const deleteButtons = $dialogBody.find('button:visible:contains("Delete")');
        
        if (deleteButtons.length > 0) {
          cy.log(`Found ${deleteButtons.length} Delete button(s) in dialog`);
          cy.get('button:visible')
            .contains(/Delete/i)
            .click({ force: true });
        } else {
          // Fallback: find any button with blue background (typical confirm button)
          cy.log('Using fallback for confirm button');
          cy.get('button.bg-blue-500, button[class*="blue"]')
            .contains(/Delete/i)
            .click({ force: true });
        }
      });
      
      cy.wait(3000);  // Wait for deletion to complete
      
      // Recursively delete next macro
      deleteNextMacro();
    });
  }
  
  // Start the deletion process
  deleteNextMacro();
});

// Alternative: More defensive version with error handling
Cypress.Commands.add('deleteAllMacrosSafe', () => {
  cy.log('=== DELETE ALL MACROS (SAFE MODE) - Custom Command ===');
  
  function deleteNextMacroSafe() {
    cy.get('body').then($body => {
      const macros = $body.find('div.flex-grow span');
      
      if (macros.length === 0) {
        cy.log(' All macros have been deleted');
        return;
      }
      
      const macroName = macros.first().text().trim();
      cy.log(`Attempting to delete: "${macroName}" | Remaining: ${macros.length}`);
      
      // Click three-dot menu
      cy.get('div.flex-grow span')
        .first()
        .closest('div[class*="flex"]')
        .find('button')
        .last()
        .click({ force: true });
      
      cy.wait(2000);
      
      // Wait for menu to appear and click Delete
      cy.get('body').then($menu => {
        const menuText = $menu.text();
        cy.log(`Menu content: ${menuText.substring(0, 100)}...`);
        
        // Find and click Delete - very lenient
        cy.get('body')
          .find('*')
          .filter((index, el) => {
            const text = el.textContent.trim();
            return text === 'Delete' || text.toLowerCase() === 'delete';
          })
          .filter(':visible')
          .first()
          .click({ force: true });
      });
      
      cy.wait(2000);
      
      // Confirm deletion
      cy.get('button')
        .filter(':visible')
        .filter((index, el) => {
          const text = el.textContent;
          return /delete/i.test(text);
        })
        .first()
        .click({ force: true });
      
      cy.wait(3000);
      
      // Recursively delete next
      deleteNextMacroSafe();
    });
  }
  
  deleteNextMacroSafe();
});




// Simple URL Navigation Commands
// ==============================

// URL Definitions
const BASE_URL = 'http://localhost:8000';

// Page URLs
Cypress.Commands.add('goToCarve', () => {
  cy.visit('http://localhost:8000/#/');
  
});

Cypress.Commands.add('goToStats', () => {
  cy.visit('http://localhost:8000/#/stats');
});

Cypress.Commands.add('goToTools', () => {
  cy.visit('http://localhost:8000/#/tools');
});

Cypress.Commands.add('goToConfig', () => {
  cy.visit('http://localhost:8000/#/configuration');
});
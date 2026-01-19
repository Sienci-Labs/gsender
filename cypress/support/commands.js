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
//23. Checking probing pin is active
//24.Jogging every axes  
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
// 5. Connect to CNC - GrblHAL (Cross-platform compatible)
// ----------------------
Cypress.Commands.add('connectToGrblHAL', (options = {}) => {
  // Get device pattern from environment variable or use default
  const devicePattern = options.deviceName || Cypress.env('deviceName') || 'COM';
  
  cy.log('Starting connection check...');
  cy.log(`Using device pattern: "${devicePattern}"`);
  cy.wait(2000); // Brief wait for UI to stabilize
  
  cy.get('body').then(($body) => {
    const bodyText = $body.text();
    
    // Check if already in Idle state
    if (/\bIdle\b/i.test(bodyText)) {
      cy.log(' Machine is already connected and in Idle state');
      return;
    }
    
    // Check if connected but waiting for Idle
    if (/\b(Disconnect|disconnect)\b/.test(bodyText)) {
      cy.log(' Machine is connected, waiting for Idle state...');
      cy.contains(/^Idle$/i, { timeout: 30000 })
        .should('be.visible')
        .then(() => {
          cy.log(' Machine reached Idle state');
        });
      return;
    }
    
    // Not connected - initiate connection
    cy.log(' Machine not connected. Initiating connection...');
    
    cy.contains(/^connect to CNC$/i, { timeout: 20000 })
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true })
      .then(() => {
        cy.log('Connect button clicked');
        cy.wait(1000);
        
        // Select device port matching the pattern
        cy.get('div.absolute', { timeout: 20000 })
          .should('be.visible')
          .find('button')
          .then(($buttons) => {
            // Find first button that matches the device pattern
            const matchingButton = $buttons.toArray().find(btn => {
              const text = btn.textContent || '';
              return text.includes(devicePattern);
            });

            if (!matchingButton) {
              const availablePorts = $buttons.toArray().map(b => b.textContent).join(', ');
              throw new Error(
                ` No device found matching pattern: "${devicePattern}". ` +
                `Available ports: ${availablePorts}`
              );
            }

            const portName = matchingButton.textContent.trim();
            cy.log(`Selecting port: ${portName}`);
            cy.wrap(matchingButton).click({ force: true });
          });
        
        // Handle unlock if needed
        cy.unlockMachineIfNeeded();
        
        // Wait for Idle state
        cy.log(' Waiting for machine to reach Idle state...');
        cy.contains(/^Idle$/i, { timeout: 30000 })
          .should('be.visible')
          .then(() => {
            cy.log(' CNC machine connected successfully and is in Idle state');
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
Cypress.Commands.add('goToLocation', (x = 0, y = 0, z = 0) => {
  cy.log(`Going to location: X=${x}, Y=${y}, Z=${z}`);
  
  // Open Go To Location dialog using the correct button selector
  cy.log('Step 4: Opening Go to Location popup...');
    cy.get('button[aria-controls="radix-:rn:"]').click(); //to find the excat button 
    ({ force: true });
  
  cy.wait(1500);
  
  // Enter coordinates in the dialog inputs
  cy.get('body > div:nth-of-type(2) input[type="number"]').then(($inputs) => {
    cy.log(`Found ${$inputs.length} number inputs`);
    
    // X input
    cy.wrap($inputs[0])
      .clear({ force: true })
      .type(String(x), { force: true });
    cy.log(`X coordinate: ${x}`);

    // Y input  
    cy.wrap($inputs[1])
      .clear({ force: true })
      .type(String(y), { force: true });
    cy.log(`Y coordinate: ${y}`);

    // Z input
    cy.wrap($inputs[2])
      .focus()
      .clear({ force: true })
      .invoke('val', '')
      .type(String(z), { force: true })
      .blur();
    cy.log(`Z coordinate: ${z}`);
  });

  cy.wait(500);

  // Click Go button
  cy.log('Clicking Go button...');
  cy.get('body > div:nth-of-type(2) button')
    .contains('Go!')
    .click({ force: true });
  
  cy.wait(2000);
  cy.log('Go button clicked');

  // Close popup by clicking outside
  cy.log('Closing popup...');
  cy.get('body').click(50, 50, { force: true });
  cy.wait(500);
  
  // Wait for machine to reach position and return to Idle
  cy.log('Waiting for machine to reach position...');
  cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
  cy.wait(2000);
  
  cy.log(`✓ Moved to X=${x}, Y=${y}, Z=${z}`);
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

//23. Checking probing pin is active
Cypress.Commands.add('checkProbingIsActive', (options = {}) => {
  const {
    maxAttempts = 30,
    waitTime = 1000,
  } = options;

  cy.log(' Checking if Probe/TLS is active (green)...');

  const checkGreen = () => {
    return cy.get('body').then(($body) => {
      const $probeTLS = $body.find('div.text-gray-500:contains("Probe/TLS")');
      if ($probeTLS.length === 0) {
        return false;
      }

      const $parent = $probeTLS.closest('.relative');
      return $parent.find('.bg-green-500').length > 0;
    });
  };

  const clickZMinusUntilGreen = (attempt = 1) => {
    if (attempt > maxAttempts) {
      throw new Error(` Probe/TLS did not turn green after ${maxAttempts} attempts`);
    }

    cy.log(` Attempt ${attempt}/${maxAttempts}: Clicking Z-`);

    cy.get(
      'path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]'
    )
      .should('exist')
      .click({ force: true });

    cy.wait(waitTime);

    checkGreen().then((isGreen) => {
      if (isGreen) {
        cy.log(' Probe/TLS is GREEN');
      } else {
        cy.log(' Probe/TLS not active yet, retrying...');
        clickZMinusUntilGreen(attempt + 1);
      }
    });
  };

  // Start the process
  clickZMinusUntilGreen();

  // Final assertion (safety check)
  cy.contains('div.text-gray-500', 'Probe/TLS')
    .should('be.visible')
    .closest('.relative')
    .find('.bg-green-500')
    .should('exist');

  cy.log(' Probing is ACTIVE and verified');
});

// 24.Jogging every axes 
// -------- X axis jogging --------
Cypress.Commands.add('jogXPlusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging X+ ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#xPlus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(`X+ jog ${i}/${times} completed`);
  }
});

Cypress.Commands.add('jogXMinusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging X- ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#xMinus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(`X- jog ${i}/${times} completed`);
  }
});

// -------- Y axis jogging --------
Cypress.Commands.add('jogYPlusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging Y+ ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#yPlus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(`Y+ jog ${i}/${times} completed`);
  }
});

Cypress.Commands.add('jogYMinusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging Y- ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#yMinus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(`Y- jog ${i}/${times} completed`);
  }
});

// -------- Z axis jogging --------
Cypress.Commands.add('jogZPlusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging Z+ ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(waitTime);
    cy.log(`Z+ jog ${i}/${times} completed`);
  }
});

Cypress.Commands.add('jogZMinusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging Z- ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]')
      .should('exist')
      .click({ force: true });
    cy.wait(waitTime);
    cy.log(`Z- jog ${i}/${times} completed`);
  }
});

// -------- XY combined jogging --------
Cypress.Commands.add('jogXYPlusPlusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging X+Y+ ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#xPlusYPlus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(`X+Y+ jog ${i}/${times} completed`);
  }
});

Cypress.Commands.add('jogXYPlusMinusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging X+Y- ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#xPlusYMinus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(`X+Y- jog ${i}/${times} completed`);
  }
});

Cypress.Commands.add('jogXYMinusMinusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging X-Y- ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#xMinusYMinus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(` X-Y- jog ${i}/${times} completed`);
  }
});

Cypress.Commands.add('jogXYMinusPlusTimes', (times = 1, waitTime = 2000) => {
  cy.log(`Jogging X-Y+ ${times} time(s)...`);
  for (let i = 1; i <= times; i++) {
    cy.get('path#xMinusYPlus').should('exist').click({ force: true });
    cy.wait(waitTime);
    cy.log(`X-Y+ jog ${i}/${times} completed`);
  }
});



// Simple URL Navigation Commands
// ==============================

// URL Definitions

Cypress.Commands.add('loadUI', (url, options = {}) => {
  cy.visit(url, { timeout: options.timeout || 10000 });
  // You can also handle retries or waits here if needed
});

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
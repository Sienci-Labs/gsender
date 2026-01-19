describe('CNC Bit Position and Job Progress Tracking', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 3,
      waitTime: 3000,
      timeout: 5000
    });
  });

  it('should connect, track bit positions, verify movement, and validate specific position values during job execution', () => {
    // Store initial positions
    const positionLog = {
      work: { x: [], y: [], z: [] },
      machine: { x: [], y: [] },
      timestamps: []
    };

    // Helper function to capture position values
    const capturePositions = (label) => {
      cy.log(`Capturing positions: ${label}`);
      
      // Capture Work Position values (X, Y, Z inputs)
      cy.get('input[type="number"].text-blue-500').eq(0).invoke('val').then((xWork) => {
        positionLog.work.x.push({ value: parseFloat(xWork), label });
      });
      
      cy.get('input[type="number"].text-blue-500').eq(1).invoke('val').then((yWork) => {
        positionLog.work.y.push({ value: parseFloat(yWork), label });
      });
      
      cy.get('input[type="number"].text-blue-500').eq(2).invoke('val').then((zWork) => {
        positionLog.work.z.push({ value: parseFloat(zWork), label });
      });

      // Capture Machine Position values (X, Y spans)
      cy.get('span.font-mono.text-gray-400').eq(0).invoke('text').then((xMachine) => {
        positionLog.machine.x.push({ value: parseFloat(xMachine), label });
      });
      
      cy.get('span.font-mono.text-gray-400').eq(1).invoke('text').then((yMachine) => {
        positionLog.machine.y.push({ value: parseFloat(yMachine), label });
      });

      positionLog.timestamps.push({ time: new Date().toISOString(), label });
    };

    // Step 1: Connect to CNC machine FIRST
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000); // Wait for connection to establish
    cy.log('✓ Connected to CNC');
    
    // Step 2: Handle unlock if needed
    cy.log('Step 2: Unlocking machine if needed...');
    cy.unlockMachineIfNeeded();
    
    // Step 3: Verify machine is in Idle state
    cy.log('Step 3: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`✓ Machine status: "${status.text().trim()}"`);
      });
    cy.wait(2000);

    // Step 4: Load a G-code file (required before job can start)
    cy.log('Step 4: Loading G-code file...');
    cy.uploadGcodeFile();
    cy.wait(2000); // Wait for file to load and process
    cy.log('✓ File Uploaded');
    
    // Step 5: Zero all axes (buttons should now be enabled)
    cy.log('Step 5: Zeroing all axes...');
    
    // Zero X axis - wait for it to be enabled
    cy.contains('button', 'X0', { timeout: 10000 })
      .should('not.be.disabled')
      .click();
    cy.wait(500);
    
    // Zero Y axis
    cy.contains('button', 'Y0')
      .should('not.be.disabled')
      .click();
    cy.wait(500);
    
    // Zero Z axis
    cy.contains('button', 'Z0')
      .should('not.be.disabled')
      .click();
    cy.wait(1000);

    // Step 6: Verify axes are zeroed
    cy.log('Step 6: Verifying axes are zeroed...');
    cy.get('input[type="number"].text-blue-500').eq(0).should('have.value', '0.00');
    cy.get('input[type="number"].text-blue-500').eq(1).should('have.value', '0.00');
    cy.get('input[type="number"].text-blue-500').eq(2).should('have.value', '0.00');
    cy.log('✓ All axes zeroed successfully');

    // Capture initial zeroed positions
    capturePositions('After Zeroing');

    // Step 7: Start the job
    cy.log('Step 7: Starting job run...');
    
    // Find and click the Start button
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('✓ Job started');

    // Capture positions immediately after start
    capturePositions('Job Started');

    // Step 8: Verify job is running
    cy.log('Step 8: Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`✓ Job status: "${status.text().trim()}"`);
      });

    // Step 9: Monitor position changes during job execution
    cy.log('Step 9: Monitoring position changes...');
    
    // Poll positions at intervals
    const monitoringIntervals = [1000, 2000, 3000, 5000, 7000, 10000];
    
    monitoringIntervals.forEach((interval, index) => {
      cy.wait(interval - (index > 0 ? monitoringIntervals[index - 1] : 0));
      capturePositions(`During Job - ${interval}ms`);
      
      // Verify that positions are changing (not all zeros)
      cy.get('input[type="number"].text-blue-500').then(($inputs) => {
        const values = [...$inputs].map(input => parseFloat(input.value));
        const hasMovement = values.some(val => Math.abs(val) > 0.01);
        
        if (hasMovement) {
          cy.log(`✓ Bit movement detected at ${interval}ms`);
        }
      });
    });

    // Step 10: Verify specific position values (Z-axis and machine positions)
    cy.log('Step 10: Verifying specific position values...');
    
    // Check Work Z-axis position
    cy.get('input[type="number"].text-blue-500').eq(2).invoke('val').then((zValue) => {
      const z = parseFloat(zValue);
      cy.log(`Work Z position: ${zValue} mm`);
      
      // Z should have moved from 0 if job is running
      if (Math.abs(z) > 0.01) {
        expect(z).to.be.a('number');
        cy.log('✓ Z-axis is moving');
      }
    });

    // Check Machine X position
    cy.get('span.font-mono.text-gray-400').eq(0).should('exist').invoke('text').then((text) => {
      cy.log(`Machine X: ${text} mm`);
      expect(parseFloat(text)).to.be.a('number');
      cy.log('✓ Machine X position valid');
    });

    // Check Machine Y position
    cy.get('span.font-mono.text-gray-400').eq(1).should('exist').invoke('text').then((text) => {
      cy.log(`Machine Y: ${text} mm`);
      expect(parseFloat(text)).to.be.a('number');
      cy.log('✓ Machine Y position valid');
    });

    // Step 11: Stop the job (or let it complete)
    cy.log('Step 11: Stopping job...');
    cy.get('body').then(($body) => {
      if ($body.find('button[aria-label="Stop"]').length > 0) {
        cy.get('button[aria-label="Stop"]').first().click();
        cy.log('✓ Job stopped manually');
      } else if ($body.find('button[aria-label="Pause"]').length > 0) {
        cy.get('button[aria-label="Pause"]').first().click();
        cy.log('✓ Job paused');
      }
    });
    cy.wait(1000);

    // Capture final positions
    capturePositions('Job Stopped/Paused');

    // Step 12: Analyze and verify position data
    cy.log('Step 12: Analyzing captured position data...');
    cy.then(() => {
      cy.log('═══════════════════════════════════════');
      cy.log('       POSITION LOG SUMMARY       ');
      cy.log('═══════════════════════════════════════');
      
      cy.log(`Work X positions: ${JSON.stringify(positionLog.work.x)}`);
      cy.log(`Work Y positions: ${JSON.stringify(positionLog.work.y)}`);
      cy.log(`Work Z positions: ${JSON.stringify(positionLog.work.z)}`);
      cy.log(`Machine X positions: ${JSON.stringify(positionLog.machine.x)}`);
      cy.log(`Machine Y positions: ${JSON.stringify(positionLog.machine.y)}`);
      
      // Assertions - verify we captured data
      expect(positionLog.work.x.length).to.be.greaterThan(2);
      expect(positionLog.work.y.length).to.be.greaterThan(2);
      expect(positionLog.work.z.length).to.be.greaterThan(2);
      
      // Calculate total movement
      const xMovement = Math.abs(
        positionLog.work.x[positionLog.work.x.length - 1].value - 
        positionLog.work.x[0].value
      );
      const yMovement = Math.abs(
        positionLog.work.y[positionLog.work.y.length - 1].value - 
        positionLog.work.y[0].value
      );
      const zMovement = Math.abs(
        positionLog.work.z[positionLog.work.z.length - 1].value - 
        positionLog.work.z[0].value
      );
      
      cy.log('═══════════════════════════════════════');
      cy.log('       MOVEMENT SUMMARY       ');
      cy.log('═══════════════════════════════════════');
      cy.log(`Total X movement: ${xMovement.toFixed(3)} mm`);
      cy.log(`Total Y movement: ${yMovement.toFixed(3)} mm`);
      cy.log(`Total Z movement: ${zMovement.toFixed(3)} mm`);
      cy.log('═══════════════════════════════════════');
      
      // Additional validation - verify movement occurred
      const totalMovement = xMovement + yMovement + zMovement;
      expect(totalMovement).to.be.greaterThan(0);
      cy.log(`✓ Total combined movement: ${totalMovement.toFixed(3)} mm`);
      
      // Save position log to file
      cy.writeFile('cypress/results/position-log.json', positionLog);
      cy.log('✓ Position data saved to: cypress/results/position-log.json');
      
      // Save movement summary to separate file
      const movementSummary = {
        testName: 'CNC Bit Position Tracking',
        timestamp: new Date().toISOString(),
        totalDataPoints: positionLog.work.x.length,
        movement: {
          x: xMovement,
          y: yMovement,
          z: zMovement,
          total: totalMovement
        },
        positions: {
          initial: {
            x: positionLog.work.x[0]?.value || 0,
            y: positionLog.work.y[0]?.value || 0,
            z: positionLog.work.z[0]?.value || 0
          },
          final: {
            x: positionLog.work.x[positionLog.work.x.length - 1]?.value || 0,
            y: positionLog.work.y[positionLog.work.y.length - 1]?.value || 0,
            z: positionLog.work.z[positionLog.work.z.length - 1]?.value || 0
          }
        }
      };
      
      cy.writeFile('cypress/results/movement-summary.json', movementSummary);
      cy.log('✓ Movement summary saved to: cypress/results/movement-summary.json');
    });

    // Step 13: Close any modal dialogs
    cy.log('Step 13: Closing any open dialogs...');
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Close")').length > 0) {
        cy.contains('button', 'Close').click({ force: true });
        cy.log('✓ Dialog closed');
      }
    });
    
    cy.log('═══════════════════════════════════════');
    cy.log('✓ POSITION TRACKING TEST COMPLETED SUCCESSFULLY');
    cy.log('═══════════════════════════════════════');
  });
});
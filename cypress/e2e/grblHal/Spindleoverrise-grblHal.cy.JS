describe('Job run and spindle override', () => {

  // Ignore known hydration-related UI errors and undefined.get() error
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
    ];
    
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false; // ignore these exceptions
    }
    return true;
  });

  beforeEach(() => {
    cy.viewport(1280, 800);
    
    // Use custom loadUI command
    cy.loadUI('http://localhost:8000/#/', {
      maxRetries: 3,
      waitTime: 2000,
      timeout: 20000
    });
  });

  it('Job run and spindle override', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    // Handle unlock if needed
    cy.unlockMachineIfNeeded();

    // Step 2: Verify CNC machine status is Idle
    cy.log('Step 2: Verifying machine status...');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Machine status: "${status.text().trim()}"`);
      });

    cy.wait(2000);

    cy.log("Make all axes 0");
    cy.zeroAllAxes();
    cy.log("All axes are zero now..!!!");

    // Load file 
    cy.log("Uploading file...!");
    cy.uploadGcodeFile();
    cy.log("File uploaded.");

    cy.log("Start the job");

    // Step 3: Starting Job
    cy.log('Step 3: Starting Job...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    // Step 4: Verifying job run status 
    cy.log('Step 4: Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status: "${status.text().trim()}"`);
      });

    // Wait for 5 seconds after job starts
    cy.wait(5000);
    cy.log('Waited 5 seconds after job started');

    // Step 5: Get initial spindle override value
    cy.log('Step 5: Getting initial spindle override...');
    cy.get('span:nth-of-type(3) > span')
      .should('be.visible')
      .invoke('text')
      .then((initialSpindle) => {
        cy.log(`Initial Spindle Override: ${initialSpindle}`);
        cy.wrap(initialSpindle).as('initialSpindle');
      });

    cy.wait(1000);

    // Step 6: Click to decrease spindle override
    cy.log('Step 6: Clicking to decrease spindle override...');
    cy.get('span:nth-of-type(3) > span')
      .should('be.visible')
      .click({ force: true });
    
    cy.wait(1300);

    // Get spindle override after clicking
    cy.get('span:nth-of-type(3) > span')
      .invoke('text')
      .then((decreasedSpindle) => {
        cy.log(`Spindle override after clicking: ${decreasedSpindle}`);
        cy.get('@initialSpindle').then((initial) => {
          cy.log(`Spindle override changed from ${initial} to ${decreasedSpindle}`);
        });
        cy.wrap(decreasedSpindle).as('afterFirstClick');
      });

    cy.wait(1500);

    // Step 7: Double-click to increase spindle override
    cy.log('Step 7: Double-clicking to increase spindle override...');
    cy.get('span.w-12')
      .contains(/\d+%/)
      .eq(1) // Get the second occurrence for spindle (first is feedrate)
      .should('be.visible')
      .dblclick({ force: true });
    
    cy.wait(1000);

    // Get spindle override after double-clicking
    cy.get('span:nth-of-type(3) > span')
      .invoke('text')
      .then((increasedSpindle) => {
        cy.log(`Spindle override after double-clicking: ${increasedSpindle}`);
        cy.get('@afterFirstClick').then((previous) => {
          cy.log(`Spindle override changed from ${previous} to ${increasedSpindle}`);
        });
        cy.wrap(increasedSpindle).as('afterDoubleClick');
      });

    cy.wait(1500);

    // Step 8: Click + button to increase spindle override (5 times)
    cy.log('Step 8: Clicking + button to increase spindle override...');
    for (let i = 0; i < 5; i++) {
      cy.get('div.relative > div.h-full div.gap-2 > div:nth-of-type(3) svg')
        .eq(1) // Get the second set of controls for spindle
        .should('be.visible')
        .click({ force: true });
      cy.wait(300);
    }

    // Get spindle override after clicking +
    cy.get('span:nth-of-type(3) > span')
      .invoke('text')
      .then((increasedByButton) => {
        cy.log(`Spindle override after clicking + button: ${increasedByButton}`);
        cy.get('@afterDoubleClick').then((previous) => {
          cy.log(`Spindle override changed from ${previous} to ${increasedByButton}`);
        });
        cy.wrap(increasedByButton).as('afterPlusButton');
      });

    cy.wait(1500);

    // Step 9: Click - button to decrease spindle override (5 times)
    cy.log('Step 9: Clicking - button to decrease spindle override...');
    for (let i = 0; i < 5; i++) {
      cy.get('div.relative > div.h-full > div > div > div > div > div.gap-2 > div:nth-of-type(2) svg')
        .eq(1) // Get the second set of controls for spindle
        .should('be.visible')
        .click({ force: true });
      cy.wait(300);
    }

    // Get spindle override after clicking -
    cy.get('span:nth-of-type(3) > span')
      .invoke('text')
      .then((decreasedByButton) => {
        cy.log(`Spindle override after clicking - button: ${decreasedByButton}`);
        cy.get('@afterPlusButton').then((previous) => {
          cy.log(`Spindle override changed from ${previous} to ${decreasedByButton}`);
        });
      });

    cy.wait(2000);

    // Step 10: Verify job is still running after all spindle override changes
    cy.log('Step 10: Verifying job is still running after all spindle override changes...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status after spindle override changes: "${status.text().trim()}"`);
      });

    // Final spindle override comparison
    cy.get('@initialSpindle').then((initial) => {
      cy.get('span:nth-of-type(3) > span')
        .invoke('text')
        .then((finalSpindle) => {
          cy.log(`=== Spindle Override Summary ===`);
          cy.log(`Initial: ${initial}`);
          cy.log(`Final: ${finalSpindle}`);
        });
    });

    cy.log('Spindle override test completed successfully');
  });
});
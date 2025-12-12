describe('Job run and feedrate rate ', () => {

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

  it('Job run and feedrate', () => {

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

    /*
    cy.log("Enabling single axis homing.....!!!");
    cy.enableAxisHomingAndHome();
    cy.unlockMachineIfNeeded();
    cy.log("All axes homed");
    Click on Toggle button to disable axis homing now ( because the button now is HX not X) 
    cy.log('Enabling homing toggle button...');
    cy.get('div.flex-shrink-0 > div > div > div > div > div.relative div.flex > button')
      .click();
    cy.wait(1000);
    */

    cy.log("Make all axes 0");
    
    cy.zeroAllAxes();
    cy.log("All axes are zero now..!!!");

    //Load file 
    cy.log("Uploading file...!");
    cy.uploadGcodeFile();
    cy.log("File uploaded.");

    cy.log("Start the job");

    cy.log('Step 6: Starting Job...');
    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    //Verifying job run status 
    cy.log('Step 7: Verifying job is running...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status: "${status.text().trim()}"`);
      });

    // Wait for 5 seconds after job starts
    cy.wait(5000);
    cy.log('Waited 5 seconds after job started');

    // Step 8: Get initial feedrate value
    cy.log('Step 8: Getting initial feedrate...');
    cy.get('span:nth-of-type(2) > span')
      .should('be.visible')
      .invoke('text')
      .then((initialFeedrate) => {
        cy.log(`Initial Feedrate: ${initialFeedrate}`);
        cy.wrap(initialFeedrate).as('initialFeedrate');
      });

    cy.wait(1000);

    // Step 9: Drag left to decrease feedrate
    cy.log('Step 9: Dragging left to decrease feedrate...');
    cy.get('span:nth-of-type(2) > span')
      .should('be.visible')
      .click({ force: true });
    
    cy.wait(1300);

    // Get feedrate after dragging left
    cy.get('span:nth-of-type(2) > span')
      .invoke('text')
      .then((decreasedFeedrate) => {
        cy.log(`Feedrate after dragging left: ${decreasedFeedrate}`);
        cy.get('@initialFeedrate').then((initial) => {
          cy.log(`Feedrate changed from ${initial} to ${decreasedFeedrate}`);
        });
        cy.wrap(decreasedFeedrate).as('afterDragLeft');
      });

    cy.wait(1500);

    // Step 10: Drag right to increase feedrate
    cy.log('Step 10: Dragging right to increase feedrate...');
    cy.get('span.w-12')
      .contains(/\d+%/)
      .should('be.visible')
      .dblclick({ force: true });
    
    cy.wait(1000);

    // Get feedrate after dragging right
    cy.get('span:nth-of-type(2) > span')
      .invoke('text')
      .then((increasedFeedrate) => {
        cy.log(`Feedrate after dragging right: ${increasedFeedrate}`);
        cy.get('@afterDragLeft').then((previous) => {
          cy.log(`Feedrate changed from ${previous} to ${increasedFeedrate}`);
        });
        cy.wrap(increasedFeedrate).as('afterDragRight');
      });

    cy.wait(1500);

    // Step 11: Click + button to increase feedrate (5 times)
    cy.log('Step 11: Clicking + button to increase feedrate...');
    for (let i = 0; i < 5; i++) {
      cy.get('div.relative > div.h-full div.gap-2 > div:nth-of-type(3) svg')
        .should('be.visible')
        .click({ force: true });
      cy.wait(300);
    }

    // Get feedrate after clicking +
    cy.get('span:nth-of-type(2) > span')
      .invoke('text')
      .then((increasedByButton) => {
        cy.log(`Feedrate after clicking + button: ${increasedByButton}`);
        cy.get('@afterDragRight').then((previous) => {
          cy.log(`Feedrate changed from ${previous} to ${increasedByButton}`);
        });
        cy.wrap(increasedByButton).as('afterPlusButton');
      });

    cy.wait(1500);

    // Step 12: Click - button to decrease feedrate (5 times)
    cy.log('Step 12: Clicking - button to decrease feedrate...');
    for (let i = 0; i < 5; i++) {
      cy.get('div.relative > div.h-full > div > div > div > div > div.gap-2 > div:nth-of-type(2) svg')
        .should('be.visible')
        .click({ force: true });
      cy.wait(300);
    }

    // Get feedrate after clicking -
    cy.get('span:nth-of-type(2) > span')
      .invoke('text')
      .then((decreasedByButton) => {
        cy.log(`Feedrate after clicking - button: ${decreasedByButton}`);
        cy.get('@afterPlusButton').then((previous) => {
          cy.log(`Feedrate changed from ${previous} to ${decreasedByButton}`);
        });
      });

    cy.wait(2000);

    // Step 13: Verify job is still running after all feedrate changes
    cy.log('Step 13: Verifying job is still running after all feedrate changes...');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log(`Job status after feedrate changes: "${status.text().trim()}"`);
      });

    // Final feedrate comparison
    cy.get('@initialFeedrate').then((initial) => {
      cy.get('span:nth-of-type(2) > span')
        .invoke('text')
        .then((finalFeedrate) => {
          cy.log(`=== Feedrate Summary ===`);
          cy.log(`Initial: ${initial}`);
          cy.log(`Final: ${finalFeedrate}`);
        });
    });

    cy.log('Feedrate test completed successfully');
  });
});

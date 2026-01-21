describe('Spindle Configuration and Control Test', () => {

  beforeEach(() => {
    cy.viewport(1689, 810);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/configuration`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 120000
    });
  });

  it('Connect, Configure Spindle, Upload File, Control Spindle, and Complete Job', () => {
    
    let minSpindleSpeed = null;
    let maxSpindleSpeed = null;
    let jobStartTime = null;
    let jobEndTime = null;

    cy.log('Step 1: Connect to CNC');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');
    
    cy.unlockMachineIfNeeded();

    cy.log('Step 2: Verify machine status is Idle');
    cy.contains(/^Idle$/i, { timeout: 30000 })
      .should('be.visible')
      .then(status => {
        cy.log('Machine status: ' + status.text().trim());
      });
    cy.wait(2000);

    cy.log('Step 3: Search for Spindle settings');
    cy.get('#simple-search').clear().type('spindle');
    cy.wait(1000);

    cy.log('Step 4: Enable spindle toggle');
    cy.get('fieldset:nth-of-type(1) span.sm\\:order-none button').click({ force: true });
    cy.wait(1000);

    cy.log('Step 5: Record Maximum and Minimum Spindle Speed');
    cy.get('input[type="number"]').then(($inputs) => {
      $inputs.each((index, input) => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
          if (!maxSpindleSpeed || val > maxSpindleSpeed) {
            maxSpindleSpeed = val;
          }
          if (!minSpindleSpeed || val < minSpindleSpeed) {
            minSpindleSpeed = val;
          }
        }
      });
      cy.log('Maximum Spindle Speed: ' + maxSpindleSpeed);
      cy.log('Minimum Spindle Speed: ' + minSpindleSpeed);
    });

    cy.log('Step 6: Apply settings');
    cy.get('div.ring > button').contains('Apply Settings').click({ force: true });
    cy.wait(2000);

    cy.log('Step 7: Navigate to Carve page');
    cy.get('#app > div > div.h-full > div.flex img').first().click({ force: true });
    cy.wait(2000);

    cy.log('Step 8: Upload G-code file');
    cy.uploadGcodeFile();
    cy.log('File Uploaded');
    cy.wait(2000);

    cy.log('Step 9: Start job');
    cy.then(() => {
      jobStartTime = Date.now();
      cy.log('Job Start Time: ' + new Date(jobStartTime).toISOString());
    });

    cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
      .contains('Start')
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
    cy.log('Job started');

    cy.log('Step 10: Verify job is running');
    cy.contains(/running|run/i, { timeout: 10000 })
      .should('be.visible')
      .then(status => {
        cy.log('Job status: ' + status.text().trim());
      });
// move slider to the left 
cy.get('span[role="slider"]')
  .filter('[aria-valuemin="20"][aria-valuemax="200"]')
  .first()
  .then($slider => {
    const rect = $slider[0].getBoundingClientRect()

    cy.wrap($slider)
      .trigger('mousedown', {
        button: 0,
        clientX: rect.x + rect.width / 2,
        clientY: rect.y + rect.height / 2,
        force: true
      })
      .trigger('mousemove', {
        clientX: rect.x - 40,
        clientY: rect.y + rect.height / 2,
        force: true
      })
      .trigger('mouseup', { force: true })
  })

    cy.log('Step 12: Wait until spindle reaches minimum speed');
    cy.wait(3000);
    
    cy.log('Step 13: Verify minimum spindle speed reached');
    cy.get('span.text-blue-500').invoke('text').then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      const currentRpm = match ? parseInt(match[1], 10) : 0;
      cy.log('Current Spindle Speed: ' + currentRpm + ' RPM');
    });

    cy.log('Step 14: Click reset button');
    // Fixed: Changed from .contains('svg') to .find('svg')
    // This properly finds a button that contains an SVG element
    cy.get('button').find('svg').first().parent().click({ force: true });
    cy.wait(2000);
    cy.log('Reset button clicked');

    cy.log('Step 15: Verify spindle speed after reset');
    cy.get('span.text-blue-500').invoke('text').then((text) => {
      const match = text.match(/(\d+)\s*RPM/i);
      const resetRpm = match ? parseInt(match[1], 10) : 0;
      cy.log('Spindle Speed After Reset: ' + resetRpm + ' RPM');
    });

    cy.log('Step 16: Wait for job completion');
    cy.contains(/^Idle$/i, { timeout: 120000 })
      .should('be.visible')
      .then(status => {
        jobEndTime = Date.now();
        cy.log('Job completed. Status: ' + status.text().trim());
        cy.log('Job End Time: ' + new Date(jobEndTime).toISOString());
        cy.log('Total Job Duration: ' + ((jobEndTime - jobStartTime) / 1000).toFixed(2) + 's');
      });
    cy.wait(3000);

    cy.log('Step 17: Extract job completion details from popup');
    
    cy.contains('h2', 'Job End').should('be.visible');

    cy.contains('strong', 'Status:')
      .parent()
      .find('span.text-green-500')
      .should('be.visible')
      .invoke('text')
      .then((statusText) => {
        const status = statusText.trim();
        cy.log('Job Status: ' + status);
        expect(status).to.equal('COMPLETE');
        cy.wrap(status).as('jobStatus');
      });

    cy.contains('strong', 'Time:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((timeText) => {
        const timeTaken = timeText.trim();
        cy.log('Time Taken: ' + timeTaken);
        cy.wrap(timeTaken).as('timeTaken');
      });

    cy.contains('strong', 'Errors:')
      .next('span')
      .should('be.visible')
      .invoke('text')
      .then((errorText) => {
        const errors = errorText.trim();
        cy.log('Errors: ' + errors);
        expect(errors).to.equal('None');
        cy.wrap(errors).as('jobErrors');
      });

    cy.wait(1000);

    cy.log('Step 18: Display final summary');
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          cy.log('SPINDLE TEST SUMMARY');
          cy.log('Configuration:');
          cy.log('  Min Spindle Speed: ' + minSpindleSpeed);
          cy.log('  Max Spindle Speed: ' + maxSpindleSpeed);
          cy.log('Job Details:');
          cy.log('  Status: ' + status);
          cy.log('  Time Taken: ' + time);
          cy.log('  Errors: ' + errors);
          
          const duration = jobEndTime && jobStartTime ? ((jobEndTime - jobStartTime) / 1000).toFixed(2) : 'N/A';
          cy.log('  Total Duration: ' + duration + 's');
        });
      });
    });

    cy.log('Step 19: Close the job completion popup');
    cy.contains('button', 'Close')
      .should('be.visible')
      .click({ force: true });
    cy.wait(1000);
    cy.log('Popup closed');

    cy.log('Step 20: Verify popup is closed');
    cy.contains('h2', 'Job End').should('not.exist');
    cy.log('Popup successfully closed');

    cy.log('Step 21: Save job and spindle details to file');
    cy.get('@jobStatus').then((status) => {
      cy.get('@timeTaken').then((time) => {
        cy.get('@jobErrors').then((errors) => {
          const testDetails = {
            testName: 'Spindle Configuration and Control Test',
            timestamp: new Date().toISOString(),
            spindleConfiguration: {
              minSpindleSpeed: minSpindleSpeed,
              maxSpindleSpeed: maxSpindleSpeed
            },
            jobDetails: {
              jobStartTime: new Date(jobStartTime).toISOString(),
              jobEndTime: new Date(jobEndTime).toISOString(),
              jobDuration: jobEndTime && jobStartTime ? (jobEndTime - jobStartTime) / 1000 : 0,
              status: status,
              timeTaken: time,
              errors: errors
            }
          };
          
          cy.writeFile('cypress/results/spindle-test-details.json', testDetails);
          cy.log('Test details saved to: cypress/results/spindle-test-details.json');
        });
      });
    });

    cy.log('SPINDLE TEST COMPLETED SUCCESSFULLY');
  });
});
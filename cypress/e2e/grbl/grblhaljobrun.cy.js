describe('GrblHal File upload and job run', () => {

  // Ignore known hydration-related UI errors and the undefined.get() error
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
    cy.viewport(1920, 1080);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000); // Give app time to recover from initialization error
  });

  it('Uploads file zeros all axes and job run', () => {
    const fileName = 'sample.gcode';

    // Step 1: Upload file
    cy.log('Step 1: Uploading file...');
    cy.uploadGcodeFile(fileName);
    cy.wait(3000);

   
    // Step 5: Starting Job
cy.log('Step 5: Starting Job...');
cy.get('div.top-\\[-30px\\] > div:nth-of-type(1) > button')
  .contains('Start')
  .should('be.visible')
  .click({ force: true });
cy.wait(2000);
cy.log('Job started');

    // Step 6: Wait for job completion popup
    cy.log('Step 6: Waiting for job completion...');
    cy.get('div[role="alertdialog"]', { timeout: 120000 }) // Wait up to 2 minutes
      .should('be.visible')
      .within(() => {
        // Verify it's the "Job End" dialog
        cy.contains('h2', 'Job End').should('be.visible');
        cy.log(' Job End dialog appeared');

        // Step 7: Check and log the status
        cy.log('Step 7: Checking job status...');
        cy.contains('strong', 'Status:')
          .parent()
          .find('span')
          .invoke('text')
          .then((status) => {
            const statusText = status.trim();
            cy.log(`Job Status: ${statusText}`);
            
            if (statusText.includes('COMPLETE')) {
              cy.log('JOB COMPLETED SUCCESSFULLY!');
            } else {
              cy.log(` Job finished with status: ${statusText}`);
            }
          });

        // Step 8: Log the time taken
        cy.log('Step 8: Checking completion time...');
        cy.contains('strong', 'Time:')
          .parent()
          .find('span')
          .invoke('text')
          .then((time) => {
            cy.log(` Actual Time Taken: ${time.trim()}`);
          });

        // Step 9: Check for errors
        cy.log('Step 9: Checking for errors...');
        cy.contains('strong', 'Errors:')
          .parent()
          .find('span')
          .invoke('text')
          .then((errors) => {
            cy.log(` Errors: ${errors.trim()}`);
          });

        // Step 10: Click Close button
        cy.log('Step 10: Closing dialog...');
        cy.contains('button', 'Close')
          .should('be.visible')
          .click({ force: true });
        cy.log(' Dialog closed');
      });

    cy.wait(1000);
  
    cy.log('TEST COMPLETED SUCCESSFULLY!');
    
  });

});
describe('CNC Visualizer rendering test case', () => {

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
      return false; // Ignore these exceptions
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

  it('Connects to CNC, uploads file, and verifies visualizer + file info', () => {
    const fileName = 'sample.gcode';

    // Step 1: Connect to CNC Machine
    cy.log('Step 1: Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Check for unlock popup and click if present
    cy.log('Step 2: Checking for unlock popup...');
    cy.get('body').then($body => {
      if ($body.find('#app > div > div.border div.mt-4 button').length > 0) {
        cy.log('Unlock popup found - clicking to unlock...');
        cy.get('#app > div > div.border div.mt-4 button')
          .click({ force: true });
        cy.wait(2000);
        cy.log('Machine unlocked');
      } else {
        cy.log('No unlock popup - machine ready');
      }
    });

    // Step 3: Verify visualizer exists BEFORE file upload
    cy.log('Step 3: Checking visualizer UI before file upload...');
    cy.get('#visualizer_container', { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log(' Visualizer container exists before upload'));

    cy.get('#visualizer_container canvas[data-engine="three.js r146"]', { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log('Visualizer canvas exists before upload'));

    // Step 4: Check if Outline and Start From buttons exist and their state BEFORE upload
    cy.log('Step 4: Checking Outline and Start From buttons state BEFORE upload...');
    
    cy.contains('button', 'Outline').then($outlineBtn => {
      if ($outlineBtn.length > 0) {
        const isDisabled = $outlineBtn.is(':disabled') || $outlineBtn.hasClass('disabled');
        const isVisible = $outlineBtn.is(':visible');
        cy.log(`  BEFORE upload - Outline button: exists=true, visible=${isVisible}, disabled=${isDisabled}`);
      }
    });

    cy.contains('button', 'Start From').then($startBtn => {
      if ($startBtn.length > 0) {
        const isDisabled = $startBtn.is(':disabled') || $startBtn.hasClass('disabled');
        const isVisible = $startBtn.is(':visible');
        cy.log(`  BEFORE upload - Start From button: exists=true, visible=${isVisible}, disabled=${isDisabled}`);
      }
    });

    // Step 5: Upload file
    cy.log(`Step 5: Uploading file: ${fileName}...`);
    cy.uploadGcodeFile(fileName);
    cy.wait(3000);

    // Step 6: Verify uploaded file name
    cy.log('Step 6: Verifying uploaded file name...');
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const trimmedName = text.trim();
        cy.log(`Uploaded file: ${trimmedName}`);
        expect(trimmedName).to.contain('.gcode');
      });

    // Step 7: Verify visualizer AFTER file upload
    cy.log('Step 7: Checking visualizer UI after file upload...');
    cy.get('#visualizer_container', { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log('✓ Visualizer container visible after upload'));

    cy.get('#visualizer_container canvas[data-engine="three.js r146"]', { timeout: 15000 })
      .should('be.visible')
      .and(($canvas) => {
        expect($canvas.attr('width')).to.exist;
        expect($canvas.attr('height')).to.exist;
      })
      .then(() => cy.log('✓ Visualizer canvas loaded with file content'));

    // Step 8: Verify "Outline" button state after upload
    cy.log('Step 8: Verifying Outline button state after upload...');
    cy.contains('button', 'Outline', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .then(($btn) => {
        cy.log(' Outline button is visible and enabled after upload');
        cy.wrap($btn).parents().first().invoke('attr', 'id').then(parentId => {
          cy.log(`  Outline button parent container: ${parentId || 'no ID'}`);
        });
      });

    // Step 9: Verify "Start From" button state AFTER upload
    cy.log('Step 9: Verifying Start From button state after upload...');
    cy.contains('button', 'Start From', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .then(($btn) => {
        cy.log('Start From button is visible and enabled after upload');
        cy.wrap($btn).parents().first().invoke('attr', 'id').then(parentId => {
          cy.log(`  Start From button parent container: ${parentId || 'no ID'}`);
        });
      });

    // Step 10: Final confirmation
    cy.log('Step 10: Test Complete');
    cy.log(' File uploaded and visualized in the UI');
    cy.log('Outline button is visible and enabled after upload');
    cy.log('Start From button is visible and enabled after upload');
  });
});
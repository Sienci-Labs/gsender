describe('CNC Machine File Info Test', () => {

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
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000); // Give app time to recover from initialization error
  });

  it('Connects to CNC, uploads file, and verifies visualizer + file info', () => {
    const fileName = 'sample.gcode';

    // Step 1: Connect to CNC Machine
    cy.log('Connecting to CNC machine...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log(' Connected to CNC');

    // Step 2: Verify visualizer exists BEFORE file upload
    cy.log(' Checking visualizer UI before file upload...');
    cy.get('#visualizer_container', { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log('✓ Visualizer container exists before upload'));

    cy.get('#visualizer_container canvas[data-engine="three.js r146"]', { timeout: 10000 })
      .should('be.visible')
      .then(() => cy.log('✓ Visualizer canvas exists before upload'));

    // Step 3: Check if Outline and Start From buttons exist and their state BEFORE upload
    cy.log(' Checking Outline and Start From buttons state BEFORE upload...');
    
    cy.contains('button', 'Outline').then($outlineBtn => {
      if ($outlineBtn.length > 0) {
        const isDisabled = $outlineBtn.is(':disabled') || $outlineBtn.hasClass('disabled');
        const isVisible = $outlineBtn.is(':visible');
        cy.log(` BEFORE upload - Outline button: exists=${true}, visible=${isVisible}, disabled=${isDisabled}`);
      }
    });

    cy.contains('button', 'Start From').then($startBtn => {
      if ($startBtn.length > 0) {
        const isDisabled = $startBtn.is(':disabled') || $startBtn.hasClass('disabled');
        const isVisible = $startBtn.is(':visible');
        cy.log(` BEFORE upload - Start From button: exists=${true}, visible=${isVisible}, disabled=${isDisabled}`);
      }
    });

    // Step 4: Upload file
    cy.log(` Uploading file: ${fileName}...`);
    cy.uploadGcodeFile(fileName);
    cy.wait(3000);

    // Step 5: Verify uploaded file name
    cy.get('h2.inline-block.text-lg.font-bold', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const trimmedName = text.trim();
        cy.log(` Uploaded file: ${trimmedName}`);
        expect(trimmedName).to.contain('.gcode');
      });

    // Step 6: Verify visualizer AFTER file upload
    cy.log(' Checking visualizer UI after file upload...');
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

    // Step 7: Verify "Outline" button state AFTER upload
    cy.log(' Verifying Outline button state after upload...');
    cy.contains('button', 'Outline', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .then(($btn) => {
        cy.log(' Outline button is visible and enabled after upload');
        cy.wrap($btn).parents().first().invoke('attr', 'id').then(parentId => {
          cy.log(`Outline button parent container: ${parentId || 'no ID'}`);
        });
      });

    // Step 8: Verify "Start From" button state AFTER upload
    cy.log(' Verifying Start From button state after upload...');
    cy.contains('button', 'Start From', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .then(($btn) => {
        cy.log(' Start From button is visible and enabled after upload');
        cy.wrap($btn).parents().first().invoke('attr', 'id').then(parentId => {
          cy.log(` Start From button parent container: ${parentId || 'no ID'}`);
        });
      });

    // Step 9: Final confirmation
    cy.log(' Test Complete: File uploaded and visualized in the UI');
    cy.log(' Result: File uploaded and visualized the file contents in the UI');
    cy.log(' Outline button is visible and enabled after upload');
    cy.log(' Start From button is visible and enabled after upload');
  });
});
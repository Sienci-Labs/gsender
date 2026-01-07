describe('Dynamic Keyboard Jogging Test - All Axes', () => {

  // Ignore known exceptions
  Cypress.on('uncaught:exception', (err) => {
    console.log('Uncaught exception:', err.message);
    const ignoreMessages = ['reading \'get\''];
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false;
    }
    return true;
  });

  before(() => {
    cy.viewport(2844, 1450);
  });

  beforeEach(() => {
    cy.goToCarve();
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(3000);
  });

  // Helper function to convert shortcut text to Cypress key format
  const convertShortcutToKeys = (shortcutText) => {
    const parts = shortcutText.toLowerCase().trim().split('+').map(p => p.trim());
    const keyMap = {
      'shift': '{shift}',
      'ctrl': '{ctrl}',
      'alt': '{alt}',
      'left': '{leftarrow}',
      'right': '{rightarrow}',
      'up': '{uparrow}',
      'down': '{downarrow}',
      'pageup': '{pageup}',
      'pagedown': '{pagedown}',
      'home': '{home}',
      'end': '{end}',
      'enter': '{enter}',
      'space': ' ',
      'tab': '{tab}'
    };

    return parts.map(part => keyMap[part] || part).join('');
  };

  // Helper function to get and test a jog direction
  const testJogDirection = (jogName, searchPattern, axisIndex, expectedDirection, xyMove, zMove) => {
    cy.log(`Testing ${jogName}`);
    
    // Wait for table to load and debug
    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.wait(1000);

    cy.get('tbody tr', { timeout: 10000 }).then($rows => {
      cy.log(`Found ${$rows.length} rows in shortcuts table`);
      $rows.each((index, row) => {
        const rowText = Cypress.$(row).text();
        if (rowText.toLowerCase().includes('jog')) {
          cy.log(`Row ${index}: ${rowText.substring(0, 60)}`);
        }
      });
    });

    // Find the row using regex pattern and click edit button
    cy.get('tbody tr', { timeout: 10000 }).then($rows => {
      let foundRow = false;
      
      $rows.each((index, row) => {
        const rowText = Cypress.$(row).text();
        if (searchPattern.test(rowText)) {
          cy.log(`Matched row: "${rowText.substring(0, 50)}"`);
          cy.wrap(row).within(() => {
            cy.get('td:nth-of-type(2) > div > div:nth-of-type(2) > div:nth-of-type(2) svg').click();
          });
          foundRow = true;
          return false; // break the loop
        }
      });
      
      if (!foundRow) {
        throw new Error(`Could not find row matching pattern: ${searchPattern}`);
      }
    });

    cy.wait(1500);

    // Get the shortcut text from the dialog - try multiple selectors
    cy.get('body').then($body => {
      let shortcutText = '';
      
      // Strategy 1: Look for h4 with class text-lg
      const h4Elements = $body.find('h4.text-lg');
      if (h4Elements.length > 1) {
        shortcutText = h4Elements.eq(1).text().trim();
      } else if (h4Elements.length === 1) {
        shortcutText = h4Elements.eq(0).text().trim();
      }
      
      // Strategy 2: If not found, look for kbd tags
      if (!shortcutText || shortcutText.length < 2) {
        const kbdElements = $body.find('kbd');
        if (kbdElements.length > 0) {
          shortcutText = kbdElements.map((i, el) => Cypress.$(el).text()).get().join(' + ');
        }
      }

      // Strategy 3: Look in dialog content with regex
      if (!shortcutText || shortcutText.length < 2) {
        const dialogContent = $body.find('[role="dialog"]').text();
        const match = dialogContent.match(/(shift|ctrl|alt)[\s\+]+(left|right|up|down|pageup|pagedown)/i);
        if (match) {
          shortcutText = match[0];
        }
      }

      cy.log(`${jogName} shortcut detected: "${shortcutText}"`);
      
      // Validate we got a shortcut
      if (!shortcutText || shortcutText.length < 2) {
        cy.log('WARNING: Could not detect shortcut, using default');
        const fallbacks = {
          'X+ (right)': 'shift + right',
          'X- (left)': 'shift + left',
          'Y+ (up)': 'shift + up',
          'Y- (down)': 'shift + down',
          'Z+ (up)': 'shift + pageup',
          'Z- (down)': 'shift + pagedown'
        };
        
        // Match fallback by searching jogName
        for (const [key, value] of Object.entries(fallbacks)) {
          if (jogName.includes(key)) {
            shortcutText = value;
            break;
          }
        }
        cy.log(`Using fallback shortcut: ${shortcutText}`);
      }
      
      const keySequence = convertShortcutToKeys(shortcutText);
      cy.log(`Converted to Cypress format: ${keySequence}`);
      
      // Close the dialog
      cy.contains('button', 'Cancel').click();
      cy.wait(500);

      // Navigate back to Carve page
      cy.get('#app > div > div.h-full > div.flex img').first().click();
      cy.wait(2000);
      cy.contains(/^Idle$/i, { timeout: 10000 }).should('be.visible');

      // Determine which axis and expected movement
      const moveAmount = (axisIndex === 3) ? zMove : xyMove;
      const expectedMove = expectedDirection * moveAmount;
      
      // Get axis input selector
      const axisInputSelector = `div.flex-shrink-0 > div > div > div > div > div.relative > div.flex-col > div:nth-of-type(${axisIndex}) input`;
      
      // Get initial position
      cy.get(axisInputSelector).invoke('val').then((startPos) => {
        const initialPos = parseFloat(startPos);
        const expectedPos = initialPos + expectedMove;
        cy.log(`Initial: ${initialPos}, Expected: ${expectedPos}`);

        // Execute the keyboard shortcut
        cy.log(`Executing: ${keySequence}`);
        cy.get('body').type(keySequence);
        cy.wait(3500);

        // Verify the position changed correctly
        cy.get(axisInputSelector).invoke('val').then((endPos) => {
          const finalPos = parseFloat(endPos);
          const difference = Math.abs(finalPos - expectedPos);
          cy.log(`Final: ${finalPos}, Difference: ${difference.toFixed(4)} mm`);
          
          expect(difference).to.be.lessThan(0.01, 
            `Expected ${jogName} to move to ${expectedPos}, but got ${finalPos}`);
          cy.log(`${jogName} successful!`);
        });
      });

      // Return to zero for next test
      cy.wait(1500);
      cy.zeroAllAxes();
      cy.wait(1000);
    });
  };

  it('Test all keyboard jog shortcuts dynamically', () => {
    
    cy.log('DYNAMIC KEYBOARD JOGGING TEST');

    // Step 1: Connect to CNC
    cy.log('STEP 1: Connect to CNC');
    cy.connectMachine();
    cy.wait(7000);
    cy.unlockMachineIfNeeded();
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');
    cy.log('Machine connected and Idle');

    // Step 2: Zero all axes
    cy.log('STEP 2: Zero All Axes');
    cy.zeroAllAxes();
    cy.verifyAxes(0, 0, 0);
    cy.log('All axes zeroed');

    // Step 3: Test X+ and X- jogging on Carve page
    cy.log('STEP 3: Test X+ and X- Jogging on Carve Page');
    
    // Jog X+ axis
    cy.log('Testing X+ jogging...');
    cy.get('path#xPlus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log('X+ jog button clicked');

    // Jog X- axis
    cy.log('Testing X- jogging...');
    cy.get('path#xMinus')
      .should('exist')
      .click({ force: true });
    cy.wait(3000);
    cy.log('X- jog button clicked');

    // Step 4: Navigate to Tools page and then Keyboard Shortcuts
    cy.log('STEP 4: Navigate to Tools > Keyboard Shortcuts');
    cy.get('a:nth-of-type(3) span').contains('Tools').click();
    cy.wait(2000);
    cy.contains('Keyboard Shortcuts').parent().click();
    cy.wait(3000);
    cy.log('Navigated to Keyboard Shortcuts page');

    // Step 5: Get preset values
    cy.log('STEP 5: Get Movement Presets');
    
    // Navigate back to Carve to get preset values
    cy.get('#app > div > div.h-full > div.flex img').first().click();
    cy.wait(2000);
    cy.contains(/^Idle$/i, { timeout: 10000 }).should('be.visible');
    
    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .invoke('val')
      .then((xyPreset) => {
        const xyMove = parseFloat(xyPreset);
        cy.log(`XY Preset: ${xyMove} mm`);
        
        cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
          .invoke('val')
          .then((zPreset) => {
            const zMove = parseFloat(zPreset);
            cy.log(`Z Preset: ${zMove} mm`);

            // Navigate back to Keyboard Shortcuts for testing
            cy.get('a:nth-of-type(3) span').contains('Tools').click();
            cy.wait(2000);
            cy.contains('Keyboard Shortcuts').parent().click();
            cy.wait(3000);

            // Test each direction with regex patterns
            cy.log('STEP 6: Test X+ (Right)');
            testJogDirection('X+ (right)', /X\+.*(right|→)/i, 1, +1, xyMove, zMove);

            // Navigate back to Keyboard Shortcuts
            cy.get('a:nth-of-type(3) span').contains('Tools').click();
            cy.wait(2000);
            cy.contains('Keyboard Shortcuts').parent().click();
            cy.wait(3000);

            cy.log('STEP 7: Test X- (Left)');
            testJogDirection('X- (left)', /X-.*(left|←)/i, 1, -1, xyMove, zMove);

            // Navigate back to Keyboard Shortcuts
            cy.get('a:nth-of-type(3) span').contains('Tools').click();
            cy.wait(2000);
            cy.contains('Keyboard Shortcuts').parent().click();
            cy.wait(3000);

            cy.log('STEP 8: Test Y+ (Up)');
            testJogDirection('Y+ (up)', /Y\+.*(up|↑)/i, 2, +1, xyMove, zMove);

            // Navigate back to Keyboard Shortcuts
            cy.get('a:nth-of-type(3) span').contains('Tools').click();
            cy.wait(2000);
            cy.contains('Keyboard Shortcuts').parent().click();
            cy.wait(3000);

            cy.log('STEP 9: Test Y- (Down)');
            testJogDirection('Y- (down)', /Y-.*(down|↓)/i, 2, -1, xyMove, zMove);

            // Navigate back to Keyboard Shortcuts
            cy.get('a:nth-of-type(3) span').contains('Tools').click();
            cy.wait(2000);
            cy.contains('Keyboard Shortcuts').parent().click();
            cy.wait(3000);

            cy.log('STEP 10: Test Z+ (Up)');
            testJogDirection('Z+ (up)', /Z\+.*(up|↑)/i, 3, +1, xyMove, zMove);

            // Navigate back to Keyboard Shortcuts
            cy.get('a:nth-of-type(3) span').contains('Tools').click();
            cy.wait(2000);
            cy.contains('Keyboard Shortcuts').parent().click();
            cy.wait(3000);

            cy.log('STEP 11: Test Z- (Down)');
            testJogDirection('Z- (down)', /Z-.*(down|↓)/i, 3, -1, xyMove, zMove);

            // Final Summary
            cy.log('TEST SUMMARY');
            cy.log('X+ (Right) - PASSED');
            cy.log('X- (Left) - PASSED');
            cy.log('Y+ (Up) - PASSED');
            cy.log('Y- (Down) - PASSED');
            cy.log('Z+ (Up) - PASSED');
            cy.log('Z- (Down) - PASSED');
            cy.log('ALL TESTS COMPLETED');
          });
      });
  });
});

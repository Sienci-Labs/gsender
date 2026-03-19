describe('Dynamic Keyboard Jogging Test - All Axes', () => {
  before(() => {
    cy.viewport(1920, 1080);
  });

  beforeEach(() => {
    cy.goToCarve();
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(3000);
  });

  // Map axisIndex to data-testid selectors from recording
  const axisSelector = {
    1: "[data-testid='wcs-input-X']",
    2: "[data-testid='wcs-input-Y']",
    3: "[data-testid='wcs-input-Z']",
  };

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

  const testJogDirection = (jogName, searchPattern, axisIndex, expectedDirection, xyMove, zMove) => {
    cy.log(`Testing ${jogName}`);

    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.wait(1000);

    // Find the row and click its edit button
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
          return false;
        }
      });
      if (!foundRow) throw new Error(`Could not find row matching: ${searchPattern}`);
    });

    cy.wait(1500);

    cy.get('body').then($body => {
      let shortcutText = '';

      const h4Elements = $body.find('h4.text-lg');
      if (h4Elements.length > 1) shortcutText = h4Elements.eq(1).text().trim();
      else if (h4Elements.length === 1) shortcutText = h4Elements.eq(0).text().trim();

      if (!shortcutText || shortcutText.length < 2) {
        const kbdElements = $body.find('kbd');
        if (kbdElements.length > 0)
          shortcutText = kbdElements.map((i, el) => Cypress.$(el).text()).get().join(' + ');
      }

      if (!shortcutText || shortcutText.length < 2) {
        const dialogContent = $body.find('[role="dialog"]').text();
        const match = dialogContent.match(/(shift|ctrl|alt)[\s\+]+(left|right|up|down|pageup|pagedown)/i);
        if (match) shortcutText = match[0];
      }

      cy.log(`${jogName} shortcut detected: "${shortcutText}"`);

      if (!shortcutText || shortcutText.length < 2) {
        const fallbacks = {
          'X+ (right)': 'shift + right',
          'X- (left)':  'shift + left',
          'Y+ (up)':    'shift + up',
          'Y- (down)':  'shift + down',
          'Z+ (up)':    'shift + pageup',
          'Z- (down)':  'shift + pagedown'
        };
        for (const [key, value] of Object.entries(fallbacks)) {
          if (jogName.includes(key)) { shortcutText = value; break; }
        }
        cy.log(`Using fallback shortcut: ${shortcutText}`);
      }

      const keySequence = convertShortcutToKeys(shortcutText);
      cy.log(`Converted to Cypress format: ${keySequence}`);

      cy.contains('button', 'Cancel').click();
      cy.wait(500);

      cy.get('#app > div.flex > div.flex > div.flex img').first().click();
      cy.wait(2000);
      cy.contains(/^Idle$/i, { timeout: 10000 }).should('be.visible');

      const moveAmount  = (axisIndex === 3) ? zMove : xyMove;
      const expectedMove = expectedDirection * moveAmount;

      const selector = axisSelector[axisIndex];

      cy.get(selector).invoke('val').then((startPos) => {
        const initialPos  = parseFloat(startPos);
        const expectedPos = initialPos + expectedMove;
        cy.log(`Initial: ${initialPos}, Expected: ${expectedPos}`);

        cy.log(`Executing: ${keySequence}`);
        cy.get('body').type(keySequence);
        cy.wait(3500);

        cy.get(selector).invoke('val').then((endPos) => {
          const finalPos   = parseFloat(endPos);
          const difference = Math.abs(finalPos - expectedPos);
          cy.log(`Final: ${finalPos}, Difference: ${difference.toFixed(4)} mm`);
          expect(difference).to.be.lessThan(0.01,
            `Expected ${jogName} to move to ${expectedPos}, but got ${finalPos}`);
          cy.log(`${jogName} successful!`);
        });
      });

      cy.wait(1500);
      cy.zeroAllAxes();
      cy.wait(1000);
    });
  };

  it('Test all keyboard jog shortcuts dynamically', () => {
    cy.log('DYNAMIC KEYBOARD JOGGING TEST');

    cy.log('STEP 1: Connect to CNC');
    cy.connectMachine();
    cy.wait(7000);
    cy.unlockMachineIfNeeded();
    cy.contains(/^Idle$/i, { timeout: 30000 }).should('be.visible');

    cy.log('STEP 2: Zero All Axes');
    cy.zeroAllAxes();
    cy.verifyAxes(0, 0, 0);

    cy.log('STEP 3: Test X+ and X- Jogging');
    cy.get('path#xPlus').should('exist').click({ force: true });
    cy.wait(3000);
    cy.get('path#xMinus').should('exist').click({ force: true });
    cy.wait(3000);

    const goToKeyboardShortcuts = () => {
      cy.get('div.flex > div.flex > div.flex a:nth-of-type(3) svg').click();
      cy.wait(2000);
      cy.contains('Keyboard Shortcuts').parent().click();
      cy.wait(3000);
    };

    cy.log('STEP 4: Navigate to Keyboard Shortcuts');
    goToKeyboardShortcuts();

    cy.log('STEP 5: Get Movement Presets');
    cy.get('#app > div.flex > div.flex > div.flex img').first().click();
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

            goToKeyboardShortcuts();
            cy.log('STEP 6: Test X+ (Right)');
            testJogDirection('X+ (right)', /X\+.*(right|→)/i, 1, +1, xyMove, zMove);

            goToKeyboardShortcuts();
            cy.log('STEP 7: Test X- (Left)');
            testJogDirection('X- (left)', /X-.*(left|←)/i, 1, -1, xyMove, zMove);

            goToKeyboardShortcuts();
            cy.log('STEP 8: Test Y+ (Up)');
            testJogDirection('Y+ (up)', /Y\+.*(up|↑)/i, 2, +1, xyMove, zMove);

            goToKeyboardShortcuts();
            cy.log('STEP 9: Test Y- (Down)');
            testJogDirection('Y- (down)', /Y-.*(down|↓)/i, 2, -1, xyMove, zMove);

            goToKeyboardShortcuts();
            cy.log('STEP 10: Test Z+ (Up)');
            testJogDirection('Z+ (up)', /Z\+.*(up|↑)/i, 3, +1, xyMove, zMove);

            goToKeyboardShortcuts();
            cy.log('STEP 11: Test Z- (Down)');
            testJogDirection('Z- (down)', /Z-.*(down|↓)/i, 3, -1, xyMove, zMove);

            cy.log('ALL TESTS COMPLETED');
          });
      });
  });
});
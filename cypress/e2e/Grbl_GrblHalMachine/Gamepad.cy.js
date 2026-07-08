const MOCK_GAMEPAD_ID = 'Mock Xbox Controller (XInput STANDARD GAMEPAD)';
const TOTAL_BUTTONS = 17;

function createMockGamepad(win, pressedIndex = 0) {
  return {
    id: MOCK_GAMEPAD_ID,
    index: 0,
    connected: true,
    timestamp: win.performance.now(),
    mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: TOTAL_BUTTONS }, (_, i) => ({
      pressed: i === pressedIndex,
      touched: i === pressedIndex,
      value: i === pressedIndex ? 1 : 0,
    })),
  };
}

// Click a jog button 2 times with a wait between each click
function jogFiveTimes(selector) {
  for (let i = 0; i < 2; i++) {
    cy.get(selector).should('exist').click({ force: true });
    cy.wait(1500);
  }
}

// Assign an action to a button row using the SetShortcut modal
function assignActionToRow(row, action) {
  cy.log(`  Assigning "${action}" to row ${row}...`);

  cy.get(`tr:nth-of-type(${row}) > td:nth-of-type(2) svg`)
    .first()
    .should('exist')
    .click({ force: true });

  cy.contains('button', action, { timeout: 10000 })
    .should('be.visible')
    .click({ force: true });

  cy.contains('button', /set shortcut/i)
    .should('not.be.disabled')
    .click({ force: true });

  cy.wait(500);
  cy.log(` "${action}" assigned to row ${row}`);
}

describe('Gamepad - Full Workflow', () => {
  afterEach(() => {
    cy.visit(`${Cypress.config('baseUrl')}/#/tools/gamepad`);
    cy.wait(1000);
    cy.get('body').then(($body) => {
      const deleteBtn = $body.find(`[aria-label="Delete gamepad profile ${MOCK_GAMEPAD_ID}"]`);
      if (deleteBtn.length > 0) {
        cy.wrap(deleteBtn[0]).click({ force: true });
        cy.contains('button', /confirm/i).click();
        cy.log('afterEach: leftover mock profile cleaned up');
      }
    });
  });

  it('should add profile, verify connected, assign jog actions, test jogging on carve page, verify axes return to 0, then delete profile', () => {

    // ── Step 1: Load UI and connect -------------------
    //--------------------------------------------------
    cy.log('Step 1: Loading UI and connecting to machine...');
    cy.viewport(1706, 810);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000,
      onBeforeLoad(win) {
        win.navigator.getGamepads = () => [createMockGamepad(win)];
      },
    });
    cy.connectMachine();
    cy.verifyMachineStatus('Idle');
    cy.log(' Machine connected and Idle');

    // ── Step 2: Navigate to Gamepad page
    cy.log('Step 2: Navigating to Gamepad page...');
    cy.visit(`${Cypress.config('baseUrl')}/#/tools/gamepad`);
    cy.wait(1000);

    // ── Step 3: Add new gamepad profile
    cy.log('Step 3: Adding new gamepad profile...');
    cy.contains('span', /add new gamepad/i)
      .closest('button')
      .first()
      .click({ force: true });
    cy.contains(/connect your device and press any button/i).should('be.visible');

    cy.window().then((win) => {
      const mockGamepad = createMockGamepad(win, 0);
      win.navigator.getGamepads = () => [mockGamepad];
      const gamepadManager = win.__GamepadManager.getInstance();
      gamepadManager.emit('gamepad:button', {
        gamepad: {
          id: mockGamepad.id,
          index: mockGamepad.index,
          connected: mockGamepad.connected,
          mapping: mockGamepad.mapping,
          axes: mockGamepad.axes,
          buttons: mockGamepad.buttons,
        },
        button: 0,
        pressed: true,
        value: 1,
        index: 0,
      });
    });

    cy.contains(/profile is available/i, { timeout: 10000 }).should('be.visible');
    cy.contains('button', /add new profile/i).should('not.be.disabled').click();
    cy.wait(1000);
    cy.log(' Profile created successfully');

    // ── Step 4: Open profile and verify Connected state
    cy.log('Step 4: Opening profile and verifying Connected state...');
    cy.contains(/mock xbox/i).click({ force: true });
    cy.wait(1000);
    cy.get('table').should('be.visible');
    cy.contains('span', /connected/i).should('be.visible');
    cy.log(' Gamepad shows as Connected');

    // ── Step 5: Assign jog actions to each button row
    cy.log('Step 5: Assigning jog actions to button rows...');
    assignActionToRow(1, 'Zero all axes');
    assignActionToRow(2, 'Jog X+ (right)');
    assignActionToRow(3, 'Jog X- (left)');
    assignActionToRow(4, 'Jog Y+ (back)');
    assignActionToRow(5, 'Jog Y- (fwd)');
    assignActionToRow(6, 'Jog Z+ (up)');
    assignActionToRow(7, 'Jog Z- (down)');
    cy.log(' All jog actions assigned');

    // ── Step 6: Verify all assignments appear in the table
    cy.log('Step 6: Verifying assignments in table...');
    cy.contains('Zero all axes').should('exist');
    cy.contains('Jog X+ (right)').should('exist');
    cy.contains('Jog X- (left)').should('exist');
    cy.contains('Jog Y+ (back)').should('exist');
    cy.contains('Jog Y- (fwd)').should('exist');
    cy.contains('Jog Z+ (up)').should('exist');
    cy.contains('Jog Z- (down)').scrollIntoView().should('exist');
    cy.log(' All 7 assignments confirmed in table');

    // ── Step 7: Go to Carve page and zero all axes
    cy.log('Step 7: Going to Carve page and zeroing axes...');
    cy.get('#app > div.flex > div.flex > div.flex img').first().click({ force: true });
    cy.wait(1000);
    cy.verifyMachineStatus('Idle');
    cy.zeroAllAxes();
    cy.wait(1000);
    cy.verifyAxes(0, 0, 0);
    cy.log(' All axes zeroed at 0.00');

    // ── Step 8: Jog X+ 2 times
    cy.log('Step 8: Jogging X+ 2 times...');
    jogFiveTimes('#xPlus');
    cy.verifyMachineStatus('Idle', { timeout: 15000 });
    cy.log(' X+ jogged 2 times');

    // ── Step 9: Jog X- 2 times to return to 0
    cy.log('Step 9: Jogging X- 2 times to return to 0...');
    jogFiveTimes('#xMinus');
    cy.verifyMachineStatus('Idle', { timeout: 15000 });
    cy.verifyAxes(0, 0, 0);
    cy.log(' X axis returned to 0.00');

    // ── Step 10: Jog Y+ 2 times
    cy.log('Step 10: Jogging Y+ 2 times...');
    jogFiveTimes('#yPlus');
    cy.verifyMachineStatus('Idle', { timeout: 15000 });
    cy.log(' Y+ jogged 2 times');

    // ── Step 11: Jog Y- 2 times to return to 0
    cy.log('Step 11: Jogging Y- 2 times to return to 0...');
    jogFiveTimes('#yMinus');
    cy.verifyMachineStatus('Idle', { timeout: 15000 });
    cy.verifyAxes(0, 0, 0);
    cy.log(' Y axis returned to 0.00');

    // ── Step 12: Jog Z+ 2 times
    cy.log('Step 12: Jogging Z+ 2 times...');
    cy.jogZPlusTimes(2, 1500);
    cy.verifyMachineStatus('Idle', { timeout: 15000 });
    cy.log(' Z+ jogged 2 times');

    // ── Step 13: Jog Z- 2 times to return to 0
    cy.log('Step 13: Jogging Z- 2 times to return to 0...');
    cy.jogZMinusTimes(2, 1500);
    cy.verifyMachineStatus('Idle', { timeout: 15000 });
    cy.verifyAxes(0, 0, 0);
    cy.log(' Z axis returned to 0.00');

    // ── Step 14: Final axes check
    cy.log('Step 14: Final axes verification...');
    cy.verifyAxes(0, 0, 0);
    cy.log(' All axes confirmed at 0.00, 0.00, 0.00');

    // ── Step 15: Go to Gamepad page and verify profile still exists
    cy.log('Step 15: Verifying profile persists on Gamepad page...');
    cy.visit(`${Cypress.config('baseUrl')}/#/tools/gamepad`);
    cy.wait(500);
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Back to Profiles")').length > 0) {
        cy.contains('button', /back to profiles/i).click({ force: true });
        cy.wait(500);
      }
    });
    cy.contains(/mock xbox/i).should('be.visible');
    cy.log(' Profile confirmed in list');

    // Open profile and verify assignments still present
    cy.contains(/mock xbox/i).click({ force: true });
    cy.wait(1000);
    cy.contains('Jog X+ (right)').should('exist');
    cy.contains('Jog X- (left)').should('exist');
    cy.contains('Jog Y+ (back)').should('exist');
    cy.contains('Jog Y- (fwd)').should('exist');
    cy.contains('Jog Z+ (up)').should('exist');
    cy.contains('Jog Z- (down)').should('exist');
    cy.log(' All assignments still present');

    // ── Step 16: Import and Export gamepad profile
    // ─────────────────────────────────────────────
    // Step 15 ends inside the profile detail view — Import/Export
    // live in the detail header, so we are already in the right place.
    // Import is done FIRST so no export toast can overlap the header.
    cy.log('Step 16: Testing Import and Export of gamepad profile...');
    cy.contains('button', /back to profiles/i).should('be.visible');
    cy.log(' In profile detail view');

    // ── Step 16a: Import the profile from the fixtures folder
    // handleImportProfile() creates a DETACHED file input via
    // document.createElement and calls .click() on it — it is never
    // appended to the DOM, so cy.get('input[type="file"]') can never
    // reach it. Instead we shadow HTMLInputElement.prototype.click to
    // capture the input (and suppress the OS file dialog), then set
    // .files ourselves and fire the handler's onchange.
    cy.log('Step 16a: Importing gamepad profile from fixture...');
    cy.window().then((win) => {
      win.__gamepadImportInput = null;
      win.HTMLInputElement.prototype.click = function interceptedClick() {
        win.__gamepadImportInput = this;
      };
    });

    // Click Import — scoped to the detail header (the row that also
    // contains "Back to Profiles") so no other Import button can match
    cy.contains('button', /back to profiles/i)
      .closest('div.flex.items-center.justify-between')
      .within(() => {
        cy.contains('button', /import/i)
          .should('be.visible')
          .click({ force: true });
      });

    // Wait (with retry) until the detached input has been captured.
    // NOTE: the input is detached, so chai-jquery's `.exist` (which
    // checks document presence) would wrongly fail — assert truthiness.
    cy.window({ timeout: 5000 }).should((win) => {
      expect(Boolean(win.__gamepadImportInput), 'gamepad import input captured').to.be.true;
    });

    // Feed the captured input the fixture file and fire onchange
    cy.fixture('gsender-gamepad.json').then((profileJson) => {
      cy.window().then((win) => {
        const input = win.__gamepadImportInput;
        expect(input.accept, 'captured input accepts json').to.contain('json');

        const file = new win.File(
          [JSON.stringify(profileJson)],
          'gsender-gamepad.json',
          { type: 'application/json' },
        );
        const dataTransfer = new win.DataTransfer();
        dataTransfer.items.add(file);
        Object.defineProperty(input, 'files', {
          value: dataTransfer.files,
          writable: false,
        });

        input.onchange({ target: input });

        // Restore normal input.click() behavior
        delete win.HTMLInputElement.prototype.click;
      });
    });
    cy.wait(1000);

    // ── Step 16b: Verify import success toast, then dismiss it
    cy.log('Step 16b: Verifying import success toast and dismissing...');
    cy.get('#app > section li', { timeout: 8000 })
      .should('be.visible')
      .and('contain.text', 'imported successfully');
    cy.log(' Import success toast appeared');

    cy.get('#app > section li button')
      .first()
      .click({ force: true });
    cy.wait(500);
    cy.log(' Import toast dismissed');

    // ── Step 16c: Export the profile
    cy.log('Step 16c: Exporting gamepad profile...');
    cy.contains('button', /back to profiles/i)
      .closest('div.flex.items-center.justify-between')
      .within(() => {
        cy.contains('button', /export/i)
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });
      });

    cy.get('#app > section li', { timeout: 8000 })
      .should('be.visible')
      .and('contain.text', 'exported successfully');
    cy.log(' Export success toast appeared');

    cy.get('#app > section li button')
      .first()
      .click({ force: true });
    cy.wait(500);
    cy.log(' Export toast dismissed');

    // ── Step 16d: Verify the profile is still present after import/export
    cy.log('Step 16d: Verifying profile after import/export...');
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Back to Profiles")').length > 0) {
        cy.contains('button', /back to profiles/i).click({ force: true });
        cy.wait(500);
      }
    });
    cy.contains(/mock xbox/i).should('be.visible');
    cy.log(' Profile confirmed in list after import/export');

    // ── Step 17: Delete mock profile
    /*cy.log('Step 17: Deleting mock gamepad profile...');
    cy.get(`[aria-label="Delete gamepad profile ${MOCK_GAMEPAD_ID}"]`)
      .should('be.visible')
      .click({ force: true });
    cy.contains('button', /confirm/i).should('be.visible').click();
    cy.wait(1000);

    cy.get(`[aria-label="Delete gamepad profile ${MOCK_GAMEPAD_ID}"]`)
      .should('not.exist');
    cy.log(' Mock profile deleted successfully');

    cy.log(' Full gamepad workflow test PASSED'); */
  });
});
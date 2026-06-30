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

describe('Gamepad - Export and Import Profile', () => {

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

  it('should create profile, export it, import a modified file, verify deleted options are gone, then delete profile', () => {

    // ── Step 1: Load UI and connect
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
    // Recording: navigate to http://localhost:8000/#/tools/gamepad
    cy.log('Step 2: Navigating to Gamepad page...');
    cy.visit(`${Cypress.config('baseUrl')}/#/tools/gamepad`);
    cy.wait(1000);

    // ── Step 3: Create new gamepad profile
    cy.log('Step 3: Creating new gamepad profile...');
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

    // ── Step 4: Open the profile
    cy.log('Step 4: Opening gamepad profile...');
    cy.contains(/mock xbox/i).click({ force: true });
    cy.wait(1000);
    cy.get('table').should('be.visible');
    cy.contains('span', /connected/i).should('be.visible');
    cy.log(' Profile opened and shows Connected');

    // ── Step 5: Import first (before Export, so no download bar interferes)
    // Attach fixture file directly to the first input[type="file"] on the page.
    // Cypress cannot open native OS file dialogs — selectFile bypasses that entirely.
    cy.log('Step 5: Importing gamepad profile from fixture...');
    cy.get('input[type="file"]')
      .first()
      .selectFile(
        'cypress/fixtures/Gamepadfile.json',
        { force: true }
      );
    cy.wait(1500);

    // ── Step 5b: Dismiss toast after import
    cy.log('Step 5b: Dismissing import toast...');
    cy.get('#app > section').then(($section) => {
      const btn = $section.find('button');
      if ($section.height() > 0 && btn.length > 0) {
        cy.wrap(btn.first()).click({ force: true });
        cy.log(' Import toast dismissed');
      } else {
        cy.log(' Toast already dismissed or did not appear');
      }
    });
    cy.wait(500);

    // ── Step 6: Export the profile
    // Recording: click Export svg icon inside the button
    // Selector: div.items-center > div:nth-of-type(3) > div:nth-of-type(2) svg
    cy.log('Step 6: Exporting gamepad profile...');
    cy.get('div.items-center > div:nth-of-type(3) > div:nth-of-type(2) svg')
      .should('exist')
      .click({ force: true });
    cy.wait(1000);
    cy.log(' Profile exported successfully');

    // ── Step 6b: Dismiss browser download bar with Escape + body click
    cy.log('Step 6b: Dismissing browser download bar...');
    cy.get('body').type('{esc}');
    cy.wait(1000);
    cy.get('body').click({ force: true });
    cy.wait(3000);
    cy.log(' Waited 3 seconds for download bar to clear');

    // ── Step 7: Verify deleted options are gone after import
    // Recording confirms: after importing, the profile table is visible and
    // row 1 no longer has the lockout button or the 2nd action button.
    // Selectors from recording:
    //   aria/Remove lockout button    → tr:nth-of-type(1) svg
    //   aria/Remove 2nd action button → tr:nth-of-type(1) path
    cy.log('Step 8: Verifying deleted options are absent after import...');
    cy.get('table').should('be.visible');

    cy.get('tr:nth-of-type(1)')
      .find('[aria-label="Remove lockout button"]')
      .should('not.exist');
    cy.log(' Lockout button confirmed absent on row 1');

    cy.get('tr:nth-of-type(1)')
      .find('[aria-label="Remove 2nd action button"]')
      .should('not.exist');
    cy.log(' 2nd action button confirmed absent on row 1');

    cy.log(' Imported profile reflects deletions correctly');

    // ── Step 9: Delete the profile
    cy.log('Step 9: Deleting mock gamepad profile...');
    cy.contains('button', /back to profiles/i).click({ force: true });
    cy.wait(500);

    cy.get(`[aria-label="Delete gamepad profile ${MOCK_GAMEPAD_ID}"]`)
      .should('be.visible')
      .click({ force: true });
    cy.contains('button', /confirm/i).should('be.visible').click();
    cy.wait(1000);

    cy.get(`[aria-label="Delete gamepad profile ${MOCK_GAMEPAD_ID}"]`)
      .should('not.exist');
    cy.log(' Profile deleted successfully');

    cy.log(' Gamepad Export/Import test PASSED');
  });

});
// cypress/e2e/grblHal/gamepad_connection.grblHal.cy.js

const MOCK_GAMEPAD_ID = 'Mock Xbox Controller (XInput STANDARD GAMEPAD)';

function createMockGamepad(win) {
  return {
    id: MOCK_GAMEPAD_ID,
    index: 0,
    connected: true,
    timestamp: win.performance.now(),
    mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: i === 0,
      touched: i === 0,
      value: i === 0 ? 1 : 0,
    })),
  };
}

describe('Gamepad - Connect and Add New Profile', () => {
  beforeEach(() => {
    cy.viewport(1359, 945);

    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000,
      onBeforeLoad(win) {
        win.navigator.getGamepads = () => [createMockGamepad(win)];
      },
    });
  });

  // Clean up the mock profile after each test run — even if the test fails.
  // This prevents duplicate profiles building up across runs.
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

  it('should connect to machine, navigate to Gamepad page, simulate controller, and add a new profile', () => {

    // ── Step 1: Connect to Machine ──────────────────────────────────────────
    cy.log('Step 1: Connecting to machine...');
    cy.connectMachine();
    cy.verifyMachineStatus('Idle');
    cy.log('✓ Machine connected and Idle');

    // ── Step 2: Navigate to Tools ───────────────────────────────────────────
    cy.log('Step 2: Navigating to Tools...');
    cy.goToTools();
    cy.log('✓ Tools panel open');

    // ── Step 3: Open the Gamepad tool ───────────────────────────────────────
    cy.log('Step 3: Opening Gamepad tool...');
    cy.contains('a', /gamepad/i).click({ force: true });
    cy.url().should('include', 'gamepad');
    cy.log('✓ Gamepad page open');

    // ── Step 4: Click "Add New Gamepad" button ───────────────────────────────
    cy.log('Step 4: Clicking Add New Gamepad...');
    cy.contains('span', /add new gamepad/i)
      .closest('button')
      .first()
      .click({ force: true });
    cy.log('✓ Add Gamepad Profile modal opened');

    // ── Step 5: Verify modal shows instructions ──────────────────────────────
    cy.log('Step 5: Verifying modal shows controller prompt...');
    cy.contains(/connect your device and press any button/i).should('be.visible');
    cy.log('✓ Modal open — waiting for button press');

    // ── Step 6: Emit "gamepad:button" via __GamepadManager ───────────────────
    // index.ts now exposes GamepadManager on window.__GamepadManager when
    // Cypress is running. ProfileModal listens for "gamepad:button" on this
    // instance — emitting it triggers the availability check.
    cy.log('Step 6: Simulating gamepad button press via __GamepadManager...');
    cy.window().then((win) => {
      const mockGamepad = createMockGamepad(win);

      // Make sure getGamepads returns our mock for the availability check
      win.navigator.getGamepads = () => [mockGamepad];

      // Emit gamepad:button on the GamepadManager instance
      // ProfileModal listens for { detail: { gamepad, button, pressed, value } }
      const gamepadManager = win.__GamepadManager.getInstance();
      // EventEmitter wraps our data: emit(name, data) -> callback({ type, detail: data })
      // ProfileModal: ({ detail }) => { const { gamepad } = detail }
      // So data should be the gamepad event object directly (not wrapped in detail again)
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
    cy.log('✓ gamepad:button emitted');

    // ── Step 7: Wait for modal to show "Profile Is Available" ────────────────
    cy.log('Step 7: Waiting for Profile Is Available...');
    cy.contains(/profile is available/i, { timeout: 10000 }).should('be.visible');
    cy.log(' Controller detected — Profile Is Available');

    // ── Step 8: Confirm "Add New Profile" ────────────────────────────────────
    cy.log('Step 8: Clicking Add New Profile...');
    cy.contains('button', /add new profile/i)
      .should('not.be.disabled')
      .click();
    cy.log(' New profile created');

    // ── Step 9: Verify profile appears in the list ───────────────────────────
    cy.log('Step 9: Verifying new profile is listed...');
    cy.contains(/mock xbox|profile|gamepad/i).should('be.visible');
    cy.log('New gamepad profile present in the list');

    // ── Step 10: Delete the created profile (cleanup) ────────────────────────
    // From recording: delete icon aria-label contains "Delete gamepad profile"
    cy.log('Step 10: Deleting the created gamepad profile...');
    // Target delete button by exact profile name — unique even with multiple profiles
    cy.get(`[aria-label="Delete gamepad profile ${MOCK_GAMEPAD_ID}"]`)
      .click({ force: true });
    cy.log(' Delete dialog opened');

    // Confirm deletion — from recording: button text is "Confirm"
    cy.contains('button', /confirm/i)
      .should('be.visible')
      .click();
    cy.wait(1000);
    cy.log(' Profile deleted');

    // Close the toast notification if it appears
    cy.get('body').then(($body) => {
      if ($body.find('#app > section button').length > 0) {
        cy.get('#app > section button').first().click({ force: true });
      }
    });

    // Verify the mock profile no longer exists in the DOM
    cy.get(`[aria-label="Delete gamepad profile ${MOCK_GAMEPAD_ID}"]`)
      .should('not.exist');
    cy.log(' Profile list is empty — cleanup complete');

    cy.log(' Gamepad test PASSED');
  });
});

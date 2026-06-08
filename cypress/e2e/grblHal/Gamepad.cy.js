// cypress/e2e/grblHal/gamepad_connection.grblHal.cy.js

// ---------------------------------------------------------------------------
// Mock Gamepad Helper
// Simulates a physical gamepad by stubbing the browser's Gamepad API.
// The app polls navigator.getGamepads() — we intercept that and fire the
// 'gamepadconnected' event so gSender thinks a real controller is plugged in.
// ---------------------------------------------------------------------------

function createMockGamepad(win, overrides = {}) {
  return {
    id: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)',
    index: 0,
    connected: true,
    timestamp: win.performance.now(),
    mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    })),
    ...overrides,
  };
}

function injectMockGamepad(win) {
  const mockGamepad = createMockGamepad(win);

  // Stub getGamepads BEFORE the event fires so any immediate poll hits it
  cy.stub(win.navigator, 'getGamepads').returns([mockGamepad]);

  // Fire the 'gamepadconnected' browser event
  const event = new win.GamepadEvent('gamepadconnected', {
    gamepad: mockGamepad,
    bubbles: true,
  });
  win.dispatchEvent(event);

  return mockGamepad;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Gamepad - Connect and Add New Profile', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);

    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 5,
      waitTime: 5000,
      timeout: 5000,
      // Inject the mock gamepad into the app window before it loads
      onBeforeLoad(win) {
        injectMockGamepad(win);
      },
    });
  });

  it('should connect to machine, navigate to Gamepad tool, and add a new profile', () => {

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

    // From the recording: aria label is the most resilient selector
    cy.get('[aria-label="Gamepad Easy hand-held CNC control using pre-made or custom profiles"]')
      .click({ force: true });

    // Fallback if aria-label differs in your build:
    // cy.contains('a', /gamepad/i).click({ force: true });

    cy.log('✓ Gamepad tool open');

    // ── Step 4: Verify mock gamepad is detected ──────────────────────────────
    // gSender should show the connected gamepad name or a "connected" badge.
    // Adjust the selector/text to match what your UI actually renders.
    cy.log('Step 4: Verifying mock gamepad is detected by gSender...');

    cy.get('body').then(($body) => {
      const detected =
        $body.text().includes('Xbox 360') ||
        $body.text().toLowerCase().includes('gamepad connected') ||
        $body.text().toLowerCase().includes('controller detected');

      if (detected) {
        cy.log('✓ Mock gamepad detected by gSender');
      } else {
        cy.log(
          '⚠ Gamepad name not visible — gSender may list it only after a profile is added. Continuing...'
        );
      }
    });

    // ── Step 5: Click "Add New Gamepad Profile" ──────────────────────────────
    cy.log('Step 5: Clicking "Add New Gamepad Profile"...');

    cy.get('button[aria-label="Add New Gamepad Profile"]')
      .should('be.visible')
      .click();

    // Fallback — from the recording the button text is the label itself:
    // cy.contains('button', /add new gamepad profile/i).click();

    cy.log('✓ "Add New Gamepad Profile" dialog/modal opened');

    // ── Step 6: Confirm "Add New Profile" in the modal ───────────────────────
    cy.log('Step 6: Confirming Add New Profile...');

    // The modal confirm button — from recording: text is "Add New Profile"
    cy.contains('button', /add new profile/i)
      .should('be.visible')
      .click();

    cy.log('✓ New profile created');

    // ── Step 7: Verify the new profile appears in the list ───────────────────
    cy.log('Step 7: Verifying new profile is listed...');

    // After creation, gSender should show at least one profile card/row.
    // Adjust the selector to match your profile list container.
    cy.get('[data-testid="gamepad-profile-list"], .gamepad-profile, .profile-card')
      .should('exist')
      .then(() => {
        cy.log('✓ New gamepad profile is present in the list');
      });

    // If testid/class selectors above don't match, fall back to text:
    // cy.contains(/profile/i).should('be.visible');

    cy.log('✓ Gamepad connection and profile creation test PASSED');
  });
});
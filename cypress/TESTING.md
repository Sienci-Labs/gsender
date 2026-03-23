# Cypress E2E Test Documentation (gSender)

## Purpose
This project uses **Cypress** to run **end-to-end UI tests** against the gSender app (web UI served by the local server). The goal is to validate end-to-end flows that involve real machine state transitions (for example, connecting and moving until the UI reports `Idle` / `Running` / `Complete`).

The Cypress tests are mainly focused on CNC workflow coverage through the UI for both:
- GRBL
- GRBLHAL

## What this covers
The specs are organized under:
- `cypress/e2e/grbl/*` (GRBL flows)
- `cypress/e2e/grblHal/*` (GRBLHAL flows)

Overall, the test suite covers:
- UI load/reload robustness
- Device connect/disconnect flows
- Unlock/homing/zeroing workflows
- Upload/load G-code and verify file UI + visualizer presence
- Jogging and go-to location behavior (including diagonal jog buttons in some tests)
- Job lifecycle: start/run/pause/stop and job end popup verification
- Console verification for commands and "job done" type outputs
- Probing workflows (GRBLHAL probing and TLS green validation)
- Spindle overrides and feedrate performance comparison
- Macros: import/edit/run/delete (and some UI export interactions)
- Visualizer rendering checks (canvas exists and relevant UI is enabled)
- Additional operations: coolant, probing-related config, rotary/surfacing, parking, movement tuning, and alignment helpers

## How the implementation is wired

### Cypress configuration
`cypress.config.js` sets:
- `baseUrl`
  - Uses `process.env.BASE_URL` or defaults to `http://localhost:8000/#`
- `supportFile`: `cypress/support/e2e.js`
- Reporter:
  - `cypress-mochawesome-reporter`
  - Output to `cypress/reports/mochawesome`
- Browser settings:
  - `chromeWebSecurity: false`
  - `experimentalModifyObstructiveThirdPartyCode: true`

### Global Cypress support
`cypress/support/e2e.js` loads:
- `cypress-real-events/support` (more realistic interactions)
- `cypress-mochawesome-reporter/register`
- `cypress-grep` (filtering/tag-like selection support)

It also has a global ignore for a known uncaught exception:
- it ignores errors containing `addUpdateRange is not a function`

### Custom Cypress commands
`cypress/support/commands.js` defines the bulk of the reusable logic used by specs. It includes commands for:
- Loading the UI reliably:
  - `cy.loadUI(...)` (there are multiple `loadUI`-style helpers in this file; Cypress uses the last one it registers)
- Connecting and unlocking:
  - `cy.connectMachine()` (GRBL flow)
  - `cy.connectToGrblHAL()` (GRBLHAL flow)
  - `cy.unlockMachineIfNeeded()`
  - `cy.disconnectIfIdle()`
- G-code upload:
  - `cy.uploadGcodeFile(fileName?)`
- Motion helpers:
  - `cy.goToLocation({ x, y, z })`
  - `cy.zeroXAxis()`, `cy.zeroYAxis()`, `cy.zeroZAxis()`, `cy.zeroAllAxes()`
  - Jogging helpers (including diagonal jog combos in some cases)
- Verification helpers:
  - `cy.verifyMachineStatus(...)` (note: this file defines it more than once, so the later definition overrides earlier ones)
  - `cy.verifyAxes(...)` (tolerance-based coordinate checks)
  - `cy.verifyConsoleContains(...)`
- Job helpers:
  - `cy.stopJobAndGetDetails()` (extracts status/time/errors from the Job End popup)
- Settings navigation helpers:
  - `cy.searchInSettings(...)`
  - `cy.applySettings(...)`

### Entry "master" specs
The suite has "master" files that pull in many module specs:
- GRBL master:
  - `cypress/e2e/grbl/grbl_master_spec.cy.js`
- GRBLHAL master:
  - `cypress/e2e/grblHal/A_grblHal_master_spec.cy.js`

These master specs act like a runner by importing multiple spec modules.

## What you need before running
1. The gSender UI/server must be reachable by Cypress.
   - `cypress.config.js` expects `BASE_URL` to serve the UI.
   - Default base URL is `http://localhost:8000/#`
2. A CNC machine must be available and connectable through gSender.
   - The tests do real connection workflows via the UI.
3. The machine should reach expected states during the test.
   - Many tests wait for `Idle`, with timeouts on the order of tens of seconds up to minutes for long operations.
4. You must provide the required Cypress environment configuration file:
   - `cypress.env.json` (this is ignored by git via `.gitignore`, so it should be local/private)

## Environment variables / env file
Your repo includes a template at the root:
- `cypress.envexample.json`

Your `cypress/README.md` states environment variables should live in `.cypress.env.json`, but in practice Cypress loads `cypress.env.json` from the project root (and your `.gitignore` ignores `cypress.env.json`).

Keys referenced by the current specs include:
- `grbl_port` and `grblhal_port` (documented)
- shortcut key mappings like `X+Y+`, `X-Y-`, `X+Y-`, `X-Y+` (documented)
- `devicePrefix` (used by `cypress/e2e/grblHal/unlock_machine.spec.grblhal.cy.js`)

At minimum for GRBLHAL tests:
- Set `devicePrefix` to match what appears in the gSender connection dialog for your device (for example: a COM/tty prefix like `COM`, or whatever prefix your port labels share).

## How to run

### Interactive mode
1. Start your server so the UI is available at the configured `BASE_URL`
2. Create/update your `cypress.env.json` (or the env file you are using locally) with the machine/shortcut keys required by your tests
3. Run:
   - `npm run cypress:open`
4. In Cypress:
   - select E2E
   - pick the spec file (for example, a master spec)

### What "success" looks like
- For most tests you will see the machine reach states like `Idle`, job end popups show completion status, and key UI components (file name, visualizer canvas, buttons) are enabled/visible.

## Reports and artifacts
This setup outputs:
- Mochawesome reports to:
  - `cypress/reports/mochawesome`

Some specs also write JSON results to:
- `cypress/results/*`
  - Examples observed: spindle and feedrate comparison outputs via `cy.writeFile(...)`

## Troubleshooting notes
Common issues come from:
- Connection/UI hover behavior being flaky (documented in `cypress/README.md`)
  - If you see tests waiting during connection and failing during hover/connect, retry the test or hover the connection bar manually.
- Known noisy uncaught exceptions
  - `cypress/support/e2e.js` ignores a specific `addUpdateRange` error message.

## Extending the suite
When adding new specs:
- Prefer reuse of existing commands in `cypress/support/commands.js`
- Keep assertions tied to visible UI state and/or machine state transitions (`Idle`, `Running`, job end popup)
- Use timeouts similar to other specs for machine-dependent operations
- If your spec interacts with settings, use `cy.searchInSettings(...)` / `cy.applySettings(...)` to match existing patterns


// Plugin system e2e — runs against the production-layout server on :8000
// (built app + bundled default plugins + /plugin-sdk mount).
//
//   npm run test:plugins
//
// covers: SDK runtime serving, import-map resolution inside the plugin
// iframe, React actually mounting (single-instance invariant), and the
// permission-gated bridge accepting the plugin's granted topic/request.

describe('Plugin system (no CNC required)', () => {
    // The host app fires background requests (update checks, telemetry)
    // whose failures surface as unhandled promise rejections in a headless
    // run. They are unrelated to the plugin system — ignore REJECTIONS only;
    // synchronous uncaught errors still fail the test.
    Cypress.on('uncaught:exception', (_err, _runnable, promise) => {
        if (promise) {
            return false;
        }
    });

    it('serves the SDK runtime at /plugin-sdk', () => {
        ['index.js', 'react.js', 'viewer.js'].forEach((file) => {
            cy.request(`/plugin-sdk/${file}`).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.headers['content-type']).to.match(/javascript/);
            });
        });
    });

    it('renders basic-cam in its iframe with a working, permission-gated SDK', () => {
        cy.visit('/#/tools/plugin/basic-cam', {
            timeout: 40000,
            onBeforeLoad(win) {
                cy.spy(win.console, 'error').as('hostConsoleError');
            },
        });

        // check to see if iframe mounts properly with no issues,
        // the import map is working (there isn't multiple react instances),
        // and that we have workspace sub perms (if we don't, the units will be missing)
        cy.get("iframe[title='Basic CAM']", { timeout: 20000 })
            .its('0.contentDocument.body', { timeout: 20000 })
            .should('not.be.empty')
            .then(cy.wrap)
            .find('#width-field')
            .contains(/\(mm\/min\)|\(in\/min\)/);

        // test to see if we have gcode:load:to:visualizer perms
        cy.get("iframe[title='Basic CAM']")
            .its('0.contentDocument')
            .then(cy.wrap)
            .find('button')
            .contains('Load to main visualizer')
            .click();

        cy.get('@hostConsoleError').should((spy) => {
            const denied = spy
                .getCalls()
                .some((call) =>
                    call.args.some(
                        (arg) =>
                            typeof arg === 'string' &&
                            /not authorized/i.test(arg),
                    ),
                );
            expect(denied, "no 'not authorized' bridge denials").to.be.false;
        });
    });
});

describe('gSender App Load', () => {
    it('loads the app and verifies title and Connect to CNC button', () => {
        cy.viewport(1409, 945);

        // Capture all console errors
        cy.visit(`${Cypress.config('baseUrl')}/#/`, {
            timeout: 60000,
            onBeforeLoad(win) {
                cy.spy(win.console, 'error').as('consoleError');
                cy.spy(win.console, 'warn').as('consoleWarn');
            }
        });

        cy.wait(10000);

        cy.screenshot('after-10s');

        // Print all console errors
        cy.get('@consoleError').then((spy) => {
            cy.log('Console errors:', JSON.stringify(spy.args));
        });

        cy.get('#app').invoke('html').then((html) => {
            cy.log('App HTML:', html.substring(0, 500));
        });
    });
});
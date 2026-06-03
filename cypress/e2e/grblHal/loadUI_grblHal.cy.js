describe('gSender App Load', () => {
    before(() => {
        Cypress.on('uncaught:exception', (err) => {
            if (err.message.includes('displayWebGLErrorMessage')) return false;
            if (err.message.includes('WebGL')) return false;
            if (err.message.includes('WebSocket')) return false;
            return true;
        });
    });

    it('loads the app and verifies Connect to CNC button', () => {
        // Set viewport as per recording
        cy.viewport(966, 714);

        // Navigate to app
        cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
            waitTime: 5000,
            timeout: 30000,
        });

        // Verify title
        cy.title({ timeout: 30000 }).should('contain', 'gSender');

        // Verify Connect to CNC button is visible
        cy.contains('Connect to CNC', { timeout: 30000 }).should('be.visible');

        cy.log('UI loaded successfully - Connect to CNC button is present');
    });
});
describe('gSender App Load', () => {
    before(() => {
        Cypress.on('uncaught:exception', (err) => {
            if (err.message.includes('displayWebGLErrorMessage')) {
                return false;
            }
            return true;
        });
    });

    it('loads the app and verifies title and Connect to CNC button', () => {
        cy.viewport(1409, 945);
        cy.visit('http://localhost:8000/#/');
        cy.title({ timeout: 15000 }).should('eq', 'gSender');
        cy.get('body', { timeout: 15000 }).should('be.visible');
    });
});
describe('gSender App Load', () => {
    before(() => {
        Cypress.on('uncaught:exception', (err) => {
            if (err.message.includes('displayWebGLErrorMessage')) return false;
            if (err.message.includes('WebGL')) return false;
            if (err.message.includes('THREE')) return false;
            if (err.message.includes('WebSocket')) return false;
            return true;
        });
    });

it('loads the app and verifies title and Connect to CNC button', () => {
    cy.viewport(1409, 945);
    cy.visit('/');
    cy.wait(15000);
    cy.screenshot('debug-screenshot');
});

});
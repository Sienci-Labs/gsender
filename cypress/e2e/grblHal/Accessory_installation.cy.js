describe('gSender Accessory installation testing', () => {

     beforeEach(() => {
        cy.viewport(2844, 1450);
        cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
            maxRetries: 8,
            waitTime: 8000,
            timeout: 5000
            
        });
    });

    it('Should reset, export, import gSender settings, restore firmware defaults, and perform searches', () => {
        // Part 1: gSender Configuration Settings
        cy.log('Part 1: gSender Configuration Settings');
        cy.closePopupIfVisible();
        cy.log('Connecting to CNC...');
        cy.connectMachine();

        cy.wait(1000);
        cy.ensureHomingEnabledAndHome();
        
        

});

});
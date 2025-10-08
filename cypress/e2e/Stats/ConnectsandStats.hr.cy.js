describe('Connects the machine and goes to config',()=>{
    // Handle hydration-related UI errors
  Cypress.on('uncaught:exception', (err) => {
    const ignoreMessages = [
      'Hydration failed',
      'There was an error while hydrating'
    ];
    if (ignoreMessages.some(msg => err.message.includes(msg))) {
      return false;
    }
    return true;
  });

  beforeEach(() => {
    cy.viewport(2844, 1450);
    cy.visit('http://localhost:8000/');
    cy.title().should('eq', 'gSender');
  });

  it('connects and go to config page',()=> { 
    // Step 1: Connect to CNC using reusable command
    cy.log(' Connecting to CNC machine...');
    cy.connectMachine();
     //waits 5 seconds and go to config page

     cy.wait(5000)

     cy.visit('http://localhost:8000/#/stats') //Goes to stats
     

  })



});
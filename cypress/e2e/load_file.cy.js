describe('Load File', () => {
    it('Connects then loads file', () => {
        // visit site
        cy.visit('/')
        // get connection bar and hover
        cy.get('.widgets-NavbarConnection-Index__NavbarConnection--3X935').realHover('mouse');
        // wait to make sure port listings are loaded
        cy.wait(500)
        // switch to grbl
        cy.get('.widgets-NavbarConnection-Index__firmwareSelector--1_yoT').children().contains('Grbl').click()
        // click port listing
        cy.contains(Cypress.env('grbl_port')).click()
        // assert Connected text is visible
        cy.contains('Connected').should('be.visible');

        // make sure the file input is showing
        cy.get('#fileInput').invoke('show');
        // get id of input component and load file
        cy.get('#fileInput').selectFile(Cypress.env('file')).trigger('input');
        // wait for file to load
        cy.wait(10000)
        // assert loading has happened
        cy.contains('Axes Used:').should('be.visible')
    })
  })
describe('Connect To GrblHAL Machine', () => {
    it('Gets, hovers, clicks and asserts', () => {
        // visit site
        cy.visit('/')
        // get connection bar and hover
        cy.get('.widgets-NavbarConnection-Index__NavbarConnection--3X935').realHover('mouse');
        // wait to make sure port listings are loaded
        cy.wait(500)
        // switch to grblhal
        cy.get('.widgets-NavbarConnection-Index__firmwareSelector--1_yoT').children().contains('grblHAL').click()
        // click port listing
        cy.contains(Cypress.env('grblhal_port')).click()
        // assert Connected text is visible
        cy.contains('Connected').should('be.visible');
    })
  })
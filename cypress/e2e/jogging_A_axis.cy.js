describe('Jog A', () => {
    it('Connects and Jogs with Keyboard & UI', () => {
        // visit site
        cy.visit('/')
        // get connection bar, disconnect and hover
        cy.get('.widgets-NavbarConnection-Index__NavbarConnection--3X935').click().realHover('mouse')
        // wait to make sure port listings are loaded
        cy.wait(500)
        // switch to grblhal
        cy.get('.widgets-NavbarConnection-Index__firmwareSelector--1_yoT').children().contains('grblHAL').click()
        // click port listing
        cy.contains(Cypress.env('grblhal_port')).click()
        // assert Connected text is visible
        cy.contains('Connected').should('be.visible');

        cy.wait(1000)

        // turn on rotary settings
        cy.get('.fa-cog').click()
        cy.contains('Rotary').click()
        cy.contains('Display Rotary Tab').next().click()
        cy.get('.modal---close---28rLZ').click()

        // turn on rotary mode
        cy.contains('Rotary').click()
        cy.contains('Rotary Mode').scrollIntoView().next().click()
        // cy.contains('OK').click()
        cy.contains('Zero').last().scrollIntoView()

        // A+
        cy.get('body').type('{ctrl}{6}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(3).should('have.value', '5.00')
        // A-
        cy.get('body').type('{ctrl}{4}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(3).should('have.value', '0.00')

        // A+
        cy.get('.widgets-Rotary-index__btn-up--3Wwzk').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(3).should('have.value', '5.00')
        // A-
        cy.get('.widgets-Rotary-index__btn-down--30O_l').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(3).should('have.value', '0.00')
    })
})
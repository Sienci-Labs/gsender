describe('Jogging with UI', () => {
    it('Connects and jogs with GRBL', () => {
        // visit site
        cy.visit('/')
        // get connection bar and hover
        cy.get('.widgets-NavbarConnection-Index__NavbarConnection--3X935').realHover('mouse')
        // wait to make sure port listings are loaded
        cy.wait(500)
        // switch to grbl
        cy.get('.widgets-NavbarConnection-Index__firmwareSelector--1_yoT').children().contains('Grbl').click()
        // click port listing
        cy.contains(Cypress.env('grbl_port')).click()
        // assert Connected text is visible
        cy.contains('Connected').should('be.visible');

        cy.wait(1000)

        // go to 0
        cy.contains('Go To').click()
        cy.contains('GO!').click()
        cy.get('.modal---close---28rLZ').click()
        cy.wait(2000)

        // X+
        cy.get('.widgets-JogControl-index__btn-right--2M5NF').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '5.00')
        // X-
        cy.get('.widgets-JogControl-index__btn-left--17kpO').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '0.00')
        // Y+
        cy.get('.widgets-JogControl-index__btn-up--3x9Rd').first().click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '5.00')
        // Y-
        cy.get('.widgets-JogControl-index__btn-down--LQBMN').first().click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '0.00')
        // Z+
        cy.get('.widgets-JogControl-index__z-top-transform--3eAu7').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(2).should('have.value', '2.00')
        // Z-
        cy.get('.widgets-JogControl-index__z-bottom-transform--A9q1F').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(2).should('have.value', '0.00')

        // X+Y+
        cy.get('.widgets-JogControl-index__btn-up-right--WFEb5').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '5.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '5.00')
        // X-Y-
        cy.get('.widgets-JogControl-index__btn-down-left--1Yx47').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '0.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '0.00')
        // X-Y+
        cy.get('.widgets-JogControl-index__btn-up-left--jSDi6').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '-5.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '5.00')
        // X+Y-
        cy.get('.widgets-JogControl-index__btn-down-right--2wNNM').click()
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '0.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '0.00')


        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').each((el) => {
            cy.get(el).should('have.value', '0.00')
        })
    
    })
  })
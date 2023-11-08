describe('Jog with GRBL', () => {
    it('Connects and Jogs with Keyboard', () => {
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
        cy.get('body').type('{shift}{rightArrow}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '5.00')
        // X-
        cy.get('body').type('{shift}{leftArrow}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '0.00')
        // Y+
        cy.get('body').type('{shift}{upArrow}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '5.00')
        // Y-
        cy.get('body').type('{shift}{downArrow}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '0.00')
        // Z+
        cy.get('body').type('{shift}{pageUp}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(2).should('have.value', '2.00')
        // Z-
        cy.get('body').type('{shift}{pageDown}', { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(2).should('have.value', '0.00')

        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').each((el) => {
            cy.get(el).should('have.value', '0.00')
        })
    })
  })
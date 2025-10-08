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

        // create shortcuts
        cy.get('.fa-cog').click()
        cy.contains('Shortcuts').click()

        cy.contains('Jog: X+ Y-').scrollIntoView().parents('.faOIos').children('.fKBVxg').children().children('.containers-Preferences-Shortcuts-edit-area__icon-area--E8hwc').click()
        cy.get('body').type(Cypress.env('X+Y-'), { release: false })
        cy.contains('Save Changes').click()

        cy.contains('Jog: X- Y+').scrollIntoView().parents('.faOIos').children('.fKBVxg').children().children('.containers-Preferences-Shortcuts-edit-area__icon-area--E8hwc').click()
        cy.get('body').type(Cypress.env('X-Y+'), { release: false })
        cy.contains('Save Changes').click()

        cy.contains('Jog: X+ Y+').scrollIntoView().parents('.faOIos').children('.fKBVxg').children().children('.containers-Preferences-Shortcuts-edit-area__icon-area--E8hwc').click()
        cy.get('body').type(Cypress.env('X+Y+'), { release: false })
        cy.contains('Save Changes').click()

        cy.contains('Jog: X- Y-').scrollIntoView().parents('.faOIos').children('.fKBVxg').children().children('.containers-Preferences-Shortcuts-edit-area__icon-area--E8hwc').click()
        cy.get('body').type(Cypress.env('X-Y-'), { release: false })
        cy.contains('Save Changes').click()

        cy.get('.modal---close---28rLZ').click()

        // go to 0
        cy.contains('Go To').click()
        cy.contains('GO!').click()
        cy.get('.modal---close---28rLZ').click()
        cy.wait(2000)

        // X+ Y+
        cy.get('body').type(Cypress.env('X+Y+'), { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '5.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '5.00')
        // X- Y-
        cy.get('body').type(Cypress.env('X-Y-'), { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '0.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '0.00')
        // X- Y+
        cy.get('body').type(Cypress.env('X-Y+'), { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '-5.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '5.00')
        // X+ Y-
        cy.get('body').type(Cypress.env('X+Y-'), { release: false })
        cy.wait(1000)
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').first().should('have.value', '0.00')
        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').eq(1).should('have.value', '0.00')

        cy.get('.widgets-Location-components-MachinePositionInput__position-input--15_Nd').each((el) => {
            cy.get(el).should('have.value', '0.00')
        })
    })
  })
describe('Surfacing Tool - Input Fields', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8000/#/tools/surfacing');
  });

  it('should navigate to Surfacing and fill in all input fields', () => {
    // Navigate to Tools > Surfacing
    cy.contains('a', 'Tools').click();
    cy.contains('Surfacing').click();

    // Width
    cy.get('#width')
      .clear()
      .type('75');

    // Length
    cy.get('#length')
      .clear()
      .type('75');

    // Skim Depth
    cy.get('#skimDepth')
      .clear()
      .type('1');

    // Max Depth
    cy.get('#maxDepth')
      .clear()
      .type('1');

    // Bit diameter (4th field — no ID, use positional selector)
    cy.get('div.px-8 div:nth-of-type(4) input')
      .clear()
      .type('22');

    // Stepover (5th field)
    cy.get('div.px-8 div:nth-of-type(5) input')
      .clear()
      .type('40');

    // Feed rate (6th field)
    cy.get('div:nth-of-type(6) input')
      .clear()
      .type('2500');

    // Spindle RPM (7th field)
    cy.get('div:nth-of-type(7) input')
      .clear()
      .type('17000');

    // Generate G-code
    cy.contains('button', 'Generate G-code').click();

    // Assertions — verify values were accepted
    cy.get('#width').should('have.value', '75');
    cy.get('#length').should('have.value', '75');
    cy.get('#skimDepth').should('have.value', '1');
    cy.get('#maxDepth').should('have.value', '1');
    cy.get('div.px-8 div:nth-of-type(4) input').should('have.value', '22');
    cy.get('div.px-8 div:nth-of-type(5) input').should('have.value', '40');
    cy.get('div:nth-of-type(6) input').should('have.value', '2500');
    cy.get('div:nth-of-type(7) input').should('have.value', '17000');
  });
});
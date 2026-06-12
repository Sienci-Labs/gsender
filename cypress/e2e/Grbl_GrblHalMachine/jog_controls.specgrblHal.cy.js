describe('Gsender testing jogging using buttons', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Test Case: jogging using buttons', () => {

    // ── Step 1: Connect
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);

    // ── Step 2: Verify Idle 
    cy.log('Step 2: Waiting for Idle status...');
    cy.verifyMachineStatus('Idle');

    // ── Step 3: Zero all axes 
    cy.log('Step 3: Zeroing all axes...');
    cy.zeroXAxis();
    cy.zeroYAxis();
    cy.zeroZAxis();

    // ── Step 4: Assert initial position is (0, 0, 0)
    cy.log('Step 4: Asserting initial position is (0.00, 0.00, 0.00)...');
    cy.get('[data-testid="wcs-input-X"]').invoke('val').then((x) => {
      cy.get('[data-testid="wcs-input-Y"]').invoke('val').then((y) => {
        cy.get('[data-testid="wcs-input-Z"]').invoke('val').then((z) => {
          cy.log(`Initial position: X=${x}, Y=${y}, Z=${z}`);
          expect(x, 'Initial X').to.equal('0.00');
          expect(y, 'Initial Y').to.equal('0.00');
          expect(z, 'Initial Z').to.equal('0.00');
        });
      });
    });

    cy.wait(2000);

    // ── Step 5: Read current XY and Z preset distances 
    cy.log('Step 5: Reading jog preset distances...');
    cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(1) input')
      .invoke('val').then((xyPreset) => {
        const xyMove = parseFloat(xyPreset);
        cy.log(`XY preset: ${xyMove} mm`);

        cy.get('div.gap-1 > div.items-center > div > div:nth-of-type(2) input')
          .invoke('val').then((zPreset) => {
            const zMove = parseFloat(zPreset);
            cy.log(`Z preset: ${zMove} mm`);

            // ── Helper: jog then assert position 
            const jogAndAssert = (label, action, expectedX, expectedY, expectedZ) => {
              cy.log(`Testing ${label}...`);
              action();
              cy.wait(3000);
              cy.get('[data-testid="wcs-input-X"]').invoke('val').then((x) => {
                cy.get('[data-testid="wcs-input-Y"]').invoke('val').then((y) => {
                  cy.get('[data-testid="wcs-input-Z"]').invoke('val').then((z) => {
                    cy.log(`${label} → X=${x}, Y=${y}, Z=${z}`);
                    expect(Math.abs(parseFloat(x) - expectedX), `${label} X`)
                      .to.be.lessThan(0.01);
                    expect(Math.abs(parseFloat(y) - expectedY), `${label} Y`)
                      .to.be.lessThan(0.01);
                    expect(Math.abs(parseFloat(z) - expectedZ), `${label} Z`)
                      .to.be.lessThan(0.01);
                    cy.log(`${label} position verified`);
                  });
                });
              });
            };

            // ── Steps 6-9: Single axis jogs 
            // Y+ → position becomes (0, +xyMove, 0)
            jogAndAssert('Y+', () => cy.jogYPlusTimes(1),  0, +xyMove, 0);
            // Y- → back to (0, 0, 0)
            jogAndAssert('Y-', () => cy.jogYMinusTimes(1), 0, 0, 0);
            // X+ → position becomes (+xyMove, 0, 0)
            jogAndAssert('X+', () => cy.jogXPlusTimes(1),  +xyMove, 0, 0);
            // X- → back to (0, 0, 0)
            jogAndAssert('X-', () => cy.jogXMinusTimes(1), 0, 0, 0);
            // Z+ → position becomes (0, 0, +zMove)
            jogAndAssert('Z+', () => cy.jogZPlusTimes(1),  0, 0, +zMove);
            // Z- → back to (0, 0, 0)
            jogAndAssert('Z-', () => cy.jogZMinusTimes(1), 0, 0, 0);

            // ── Steps 10-13: Diagonal jogs
            // X+Y+ → (+xyMove, +xyMove, 0)
            jogAndAssert('X+Y+',
              () => cy.get('#xPlusYPlus').should('exist').click({ force: true }),
              +xyMove, +xyMove, 0
            );
            // X+Y- → (+xyMove*2, 0, 0)  [relative: +x, -y]
            jogAndAssert('X+Y-',
              () => cy.get('#xPlusYMinus').should('exist').click({ force: true }),
              +xyMove * 2, 0, 0
            );
            // X-Y- → (+xyMove, -xyMove, 0)
            jogAndAssert('X-Y-',
              () => cy.get('#xMinusYMinus').should('exist').click({ force: true }),
              +xyMove, -xyMove, 0
            );
            // X-Y+ → back to (0, 0, 0)
            jogAndAssert('X-Y+',
              () => cy.get('#xMinusYPlus').should('exist').click({ force: true }),
              0, 0, 0
            );

            cy.log('ALL JOGGING TESTS COMPLETED SUCCESSFULLY');
          });
      });
  });
});
describe('Gsender - Update Rapid Presets & Verify Jogging Values', () => {

  // Ignore hydration UI errors
  Cypress.on('uncaught:exception', (err) => {
    const ignore = [
      'Hydration failed',
      'There was an error while hydrating',
      'Cannot read properties of undefined',
      'reading \'get\''
    ];
    if (ignore.some(msg => err.message.includes(msg))) return false;
    return true;
  });

  const EXPECTED_XY = '25';
  const EXPECTED_Z  = '15';
  const EXPECTED_A  = '15';
  const EXPECTED_SPEED = '4500';

  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.visit('http://localhost:8000/#/');
    cy.get('#app', { timeout: 20000 }).should('exist');
    cy.wait(2000);
  });

  it('Connects machine, updates rapid presets and verifies jogging values', () => {

    // ---- STEP 1: CONNECT TO CNC ----
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(3000);
    cy.autoUnlock();
    cy.log('Connected to CNC');

    cy.log('Step 2: Waiting for idle state...');
    cy.contains(/^idle$/i, { timeout: 30000 }).should('be.visible');
    cy.wait(1000);

    //Making all axes 0 
    cy.zeroAllAxes();

    // ---- STEP 2: UPDATE RAPID PRESETS ----
    cy.log('STEP 2 - NAVIGATE TO CONFIG & UPDATE RAPID PRESET');
    cy.visit('http://localhost:8000/#/configuration');
    cy.get('#simple-search').click().clear().type('jog');

    cy.contains('span', 'Rapid')
      .parents('.p-2.flex.flex-row')
      .within(() => {
        cy.contains('span', 'XY:').parent().find('input').clear().type(EXPECTED_XY, { force: true });
        cy.contains('span', 'Z:').parent().find('input').clear().type(EXPECTED_Z, { force: true });
        cy.contains('span', 'A:').parent().find('input').clear().type(EXPECTED_A, { force: true });
        cy.contains('span', 'Speed:').parent().find('input').clear().type(EXPECTED_SPEED, { force: true });
      });

    cy.contains('button', 'Apply Settings').click({ force: true });
    cy.wait(2000);

    // ---- STEP 3: ACTIVATE RAPID PRESET ----
    cy.log('STEP 3 - ACTIVATE RAPID PRESET');
    cy.visit('http://localhost:8000/#/');
    cy.contains('button', 'Rapid').click({ force: true });
    cy.wait(1000);

    // ---- STEP 4: VERIFY INPUT VALUES ----
    cy.log('STEP 4 - VERIFY INPUT VALUES ON HOME PAGE');
    cy.get('input[type="number"].h-6.text-sm').then(($i) => {
      expect($i.eq(0).val()).to.eq(EXPECTED_XY);
      expect($i.eq(1).val()).to.eq(EXPECTED_Z);
      expect($i.eq(2).val()).to.eq(EXPECTED_SPEED);
    });

    // ---- STEP 5: VERIFY JOGGING SPEED DOESN'T EXCEED LIMIT ----
    cy.log('STEP 5 - VERIFY JOGGING SPEED DOES NOT EXCEED CONFIGURED LIMIT');
    
    const verifyJog = (selector, label) => {
      cy.get(selector).click({ force: true });
      cy.wait(500);

      cy.document().then((doc) => {
        const speedEl = doc.querySelector('.min-w-4.text-center.text-blue-500');
        const speedText = speedEl?.textContent?.trim() || '';
        
        // Extract numeric value from speed text (e.g., "3000 mm/min" -> 3000)
        const speedMatch = speedText.match(/(\d+)/);
        const currentSpeed = speedMatch ? parseInt(speedMatch[1], 10) : 0;
        const maxSpeed = parseInt(EXPECTED_SPEED, 10);

        cy.log(`${label} CURRENT SPEED: ${speedText} (${currentSpeed} mm/min)`);
        cy.log(`${label} MAX ALLOWED: ${maxSpeed} mm/min`);
        
        // Verify speed doesn't exceed the configured limit
        expect(currentSpeed).to.be.at.most(maxSpeed, 
          `Speed ${currentSpeed} should not exceed configured limit ${maxSpeed}`);
        
        // Also verify speed is positive (machine is moving)
        expect(currentSpeed).to.be.greaterThan(0, 
          'Speed should be greater than 0 when jogging');
      });

      cy.wait(1500);
    };

    verifyJog('path#xPlusYPlus', 'X+Y+');
    verifyJog('path#xMinusYMinus', 'X-Y-');
    verifyJog('path[d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"]', 'Z+');
    verifyJog('path[d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"]', 'Z-');

    // ---- STEP 6: VERIFY FINAL POSITION ----
    cy.log('STEP 6 - VERIFY FINAL POSITION RETURNS TO 0');
    cy.get('input[type="number"].text-xl.font-bold.text-blue-500.font-mono')
      .then(($pos) => {
        expect($pos.eq(0).val()).to.eq('0.00');
        expect($pos.eq(1).val()).to.eq('0.00');
        expect($pos.eq(2).val()).to.eq('0.00');
      });

  });

});
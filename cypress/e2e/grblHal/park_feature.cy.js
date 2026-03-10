describe('Park feature ', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    // Use loadUI custom command with dynamic baseUrl
    cy.loadUI(`${Cypress.config('baseUrl')}/#/`, {
      maxRetries: 4,
      waitTime: 4000,
      timeout: 5000
    });
  });

  it('Enables homing and set park location to 0,0,0', () => {

    // Step 1: Connect to CNC
    cy.log('Step 1: Connecting to CNC...');
    cy.connectMachine();
    cy.wait(6000);
    cy.log('Connected to CNC');

    // Step 2: Verify CNC machine status is Idle
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);
    cy.log('Machine is in idle status');

    cy.unlockMachineIfNeeded();
    cy.wait(2000);
    
    // Step 3: Jog machine X, Y & Z axis
    cy.log('Step 3: Jogging machine axes...');
    cy.log('X axis jogging 2 times');
    cy.jogXPlusTimes(2);
    cy.wait(1000);
    
    cy.log('Y axis jogging 3 times');
    cy.jogYPlusTimes(3);
    cy.wait(1000);
    
    cy.log('Z axis jogging 2 times');
    cy.jogZPlusTimes(2);
    cy.wait(1000);

    // Step 4: Record initial X, Y, Z positions BEFORE parking
    let initialX, initialY, initialZ;

    cy.log('Step 4: Recording initial positions before setting park location...');
    
    // Recording X position
    cy.get('span[data-testid="mpos-X"]')
      .invoke('text')
      .then((text) => {
        initialX = parseFloat(text.trim());
        cy.log(`Initial X value: ${initialX}`);
        console.log('Initial X value:', initialX);
        expect(initialX).to.not.equal(0, 'X should not be 0 after jogging');
      });

    // Recording Y position
    cy.get('span[data-testid="mpos-Y"]')
      .invoke('text')
      .then((text) => {
        initialY = parseFloat(text.trim());
        cy.log(`Initial Y value: ${initialY}`);
        console.log('Initial Y value:', initialY);
        expect(initialY).to.not.equal(0, 'Y should not be 0 after jogging');
      });

    // Recording Z position
    cy.get('span[data-testid="mpos-Z"]')
      .invoke('text')
      .then((text) => {
        initialZ = parseFloat(text.trim());
        cy.log(`Initial Z value: ${initialZ}`);
        console.log('Initial Z value:', initialZ);
        expect(initialZ).to.not.equal(0, 'Z should not be 0 after jogging');
      });

    // Step 5: Go to Config page
    cy.log('Step 5: Navigating to Config page...');
    cy.goToConfig();
    
    // Step 6: Navigate to Homing settings
    cy.log('Step 6: Navigating to Homing settings...');
    cy.contains('button', /homing/i).click();
    cy.wait(500);
    cy.log('Homing settings section opened');

    // Step 7: Enable Homing
    cy.log('Step 7: Enabling homing...');
    cy.get('button#\\$22-0-key').then($toggle => {
      if ($toggle.attr('aria-checked') === 'false') {
        cy.log('  Enabling: Homing');
        cy.wrap($toggle).click();
        cy.wait(300);
      } else {
        cy.log('Homing already enabled');
      }
    });

    // Step 8: Set Park Location to 0, 0, 0
    cy.log('Step 8: Setting park location to 0, 0, 0...');
    
    // Click on Park Location fieldset to expand
    cy.get('#section-5 fieldset:nth-of-type(3) > div').click();
    cy.wait(500);

    // Set X park position to 0
    cy.log('  Setting X park position to 0');
    cy.get('#section-5 span.sm\\:order-none > div > div:nth-of-type(1) input')
      .clear()
      .type('0');
    cy.wait(300);

    // Set Y park position to 0
    cy.log('  Setting Y park position to 0');
    cy.get('#section-5 span.sm\\:order-none > div > div:nth-of-type(2) input')
      .clear()
      .type('0');
    cy.wait(300);

    // Set Z park position to 0
    cy.log('  Setting Z park position to 0');
    cy.get('#section-5 fieldset:nth-of-type(3) div:nth-of-type(3) input')
      .clear()
      .type('0');
    cy.wait(300);

    cy.log('Park location set to: X=0, Y=0, Z=0');

    // Step 9: Apply Settings
    cy.log('Step 9: Applying settings...');
    cy.contains('button', 'Apply Settings').then($button => {
      if (!$button.is(':disabled')) {
        cy.log('  Applying settings...');
        cy.wrap($button).click();
        cy.wait(3000);
        cy.unlockMachineIfNeeded();
        cy.wait(1000);
        cy.log('Settings applied successfully');
      } else {
        cy.log('  No settings changes detected');
      }
    });

    // Step 10: Go to Carve page
    cy.log('Step 10: Navigating to Carve page...');
    cy.goToCarve();
    cy.wait(1000);

    // Step 11: Click Park button (P)
    cy.log('Step 11: Clicking Park button (P)...');
    cy.get('button.bg-robin-500.text-white')
      .find('svg path[d="M6 3H13C16.3137 3 19 5.68629 19 9C19 12.3137 16.3137 15 13 15H10V21H6V3ZM10 7V11H13C14.1046 11 15 10.1046 15 9C15 7.89543 14.1046 7 13 7H10Z"]')
      .parent('svg')
      .parent('span')
      .parent('button')
      .click();

    cy.log('Park command sent');

    // Wait for parking operation to complete
    cy.wait(5000);

    // Step 12: Verify X, Y, Z values are now 0, 0, 0 after parking
    cy.log('Step 12: Verifying positions after parking...');
    
    // Verify X position is 0
    cy.get('span[data-testid="mpos-X"]')
      .invoke('text')
      .then((text) => {
        const parkedX = parseFloat(text.trim());
        cy.log(`After Park - X value: ${parkedX}`);
        console.log('After Park - X value:', parkedX);
        expect(parkedX).to.be.closeTo(0, 0.01, 'X position should be 0 after parking');
      });

    // Verify Y position is 0
    cy.get('span[data-testid="mpos-Y"]')
      .invoke('text')
      .then((text) => {
        const parkedY = parseFloat(text.trim());
        cy.log(`After Park - Y value: ${parkedY}`);
        console.log('After Park - Y value:', parkedY);
        expect(parkedY).to.be.closeTo(0, 0.01, 'Y position should be 0 after parking');
      });

    // Verify Z position is 0
    cy.get('span[data-testid="mpos-Z"]')
      .invoke('text')
      .then((text) => {
        const parkedZ = parseFloat(text.trim());
        cy.log(`After Park - Z value: ${parkedZ}`);
        console.log('After Park - Z value:', parkedZ);
        expect(parkedZ).to.be.closeTo(0, 0.01, 'Z position should be 0 after parking');
        
        cy.log(' Park location verified: All axes at 0, 0, 0');
      });

    // ========== GO TO FEATURE TEST ==========
    
    // Step 13: Go to Config page for "Go To" feature test
    cy.log('Step 13: Testing Go To feature - Navigating to Config page...');
    cy.goToConfig();
    cy.wait(1000);

    // Step 14: Navigate to Homing settings (if needed)
    cy.log('Step 14: Navigating to Homing settings...');
    cy.contains('button', /homing/i).click();
    cy.wait(500);

    // Step 15: Set parking location to 5,5,5
    cy.log('Step 15: Setting park location to 5, 5, 5...');
    
    // Click on Park Location fieldset to expand
    cy.get('#section-5 fieldset:nth-of-type(3) > div').click();
    cy.wait(500);

    // Set X park position to 5
    cy.log('  Setting X park position to 5');
    cy.get('#section-5 span.sm\\:order-none > div > div:nth-of-type(1) input')
      .clear()
      .type('5');
    cy.wait(300);

    // Set Y park position to 5
    cy.log('  Setting Y park position to 5');
    cy.get('#section-5 span.sm\\:order-none > div > div:nth-of-type(2) input')
      .clear()
      .type('5');
    cy.wait(300);

    // Set Z park position to 5
    cy.log('  Setting Z park position to 5');
    cy.get('#section-5 fieldset:nth-of-type(3) div:nth-of-type(3) input')
      .clear()
      .type('5');
    cy.wait(300);

    cy.log('Park location set to: X=5, Y=5, Z=5');

    // Step 16: Apply Settings
    cy.log('Step 16: Applying settings...');
    cy.contains('button', 'Apply Settings').then($button => {
      if (!$button.is(':disabled')) {
        cy.log('  Applying settings...');
        cy.wrap($button).click();
        cy.wait(3000);
        cy.unlockMachineIfNeeded();
        cy.wait(1000);
        cy.log('Settings applied successfully');
      } else {
        cy.log('  No settings changes detected');
      }
    });

    // Step 17: Click on "Go To" button (while still on Config page)
    cy.log('Step 17: Clicking Go To button to move to park location...');
    cy.contains('button.border-blue-500', 'Go To')
      .should('be.visible')
      .click();
    cy.wait(5000); // Wait for machine to move to park location
    cy.log('Go To command executed - machine moving to 5, 5, 5');

    // Step 18: Navigate to Carve page to verify position
    cy.log('Step 18: Navigating to Carve page...');
    cy.goToCarve();
    cy.wait(2000);

    // Step 19: Verify positions are now 5,5,5
    cy.log('Step 19: Verifying positions after Go To park location...');

    // Verify X position is 5
    cy.get('span[data-testid="mpos-X"]')
      .invoke('text')
      .then((text) => {
        const positionX = parseFloat(text.trim());
        cy.log(`After Go To - X value: ${positionX}`);
        console.log('After Go To - X value:', positionX);
        expect(positionX).to.be.closeTo(5, 0.1, 'X position should be 5 after Go To');
      });

    // Verify Y position is 5
    cy.get('span[data-testid="mpos-Y"]')
      .invoke('text')
      .then((text) => {
        const positionY = parseFloat(text.trim());
        cy.log(`After Go To - Y value: ${positionY}`);
        console.log('After Go To - Y value:', positionY);
        expect(positionY).to.be.closeTo(5, 0.1, 'Y position should be 5 after Go To');
      });

    // Verify Z position is 5
    cy.get('span[data-testid="mpos-Z"]')
      .invoke('text')
      .then((text) => {
        const positionZ = parseFloat(text.trim());
        cy.log(`After Go To - Z value: ${positionZ}`);
        console.log('After Go To - Z value:', positionZ);
        expect(positionZ).to.be.closeTo(5, 0.1, 'Z position should be 5 after Go To');
        
        cy.log(' Go To park location verified: All axes at 5, 5, 5');
      });

    // ========== GRAB FEATURE TEST ==========
    
    // Step 20: Verify machine status is Idle
    cy.log('Step 20: Verifying machine status before jogging...');
    cy.verifyMachineStatus('Idle');
    cy.wait(2000);
    cy.log('Machine is in idle status');

    cy.unlockMachineIfNeeded();
    cy.wait(2000);
    
    // Step 21: Jog machine in negative direction
    cy.log('Step 21: Jogging machine axes in negative direction...');
    cy.log('X axis jogging negative 5 times');
    cy.jogXMinusTimes(5);
    cy.wait(1000);
    
    cy.log('Y axis jogging negative 5 times');
    cy.jogYMinusTimes(5);
    cy.wait(1000);
    
    cy.log('Z axis jogging negative 5 times');
    cy.jogZMinusTimes(5);
    cy.wait(1000);

    // Step 22: Record machine position after jogging
    let joggedX, joggedY, joggedZ;
    
    cy.log('Step 22: Recording machine positions after jogging...');
    
    // Recording X position
    cy.get('span[data-testid="mpos-X"]')
      .invoke('text')
      .then((text) => {
        joggedX = parseFloat(text.trim());
        cy.log(`Jogged X value: ${joggedX}`);
        console.log('Jogged X value:', joggedX);
      });

    // Recording Y position
    cy.get('span[data-testid="mpos-Y"]')
      .invoke('text')
      .then((text) => {
        joggedY = parseFloat(text.trim());
        cy.log(`Jogged Y value: ${joggedY}`);
        console.log('Jogged Y value:', joggedY);
      });

    // Recording Z position
    cy.get('span[data-testid="mpos-Z"]')
      .invoke('text')
      .then((text) => {
        joggedZ = parseFloat(text.trim());
        cy.log(`Jogged Z value: ${joggedZ}`);
        console.log('Jogged Z value:', joggedZ);
      });

    // Step 23: Go to Config page
    cy.log('Step 23: Navigating to Config page...');
    cy.goToConfig();
    cy.wait(1000);

    // Step 24: Navigate to Homing settings
    cy.log('Step 24: Navigating to Homing settings...');
    cy.contains('button', /homing/i).click();
    cy.wait(500);

    // Step 25: Expand Park Location section
    cy.log('Step 25: Expanding Park Location section...');
    cy.get('#section-5 fieldset:nth-of-type(3) > div').click();
    cy.wait(500);

    // Step 26: Click Grab button to capture current position
    cy.log('Step 26: Clicking Grab button to capture current machine position...');
    cy.contains('button.border-robin-500', 'Grab')
      .should('exist')
      .click({force: true});
    cy.wait(1000);
    cy.log('Grab button clicked - current position should be captured');

    // Step 27: Verify park positions match the jogged positions
    cy.log('Step 27: Verifying park position fields match jogged positions...');

    // Verify X park position matches jogged X
    cy.get('#section-5 span.sm\\:order-none > div > div:nth-of-type(1) input')
      .invoke('val')
      .then((xValue) => {
        const parkX = parseFloat(xValue);
        cy.log(`Park X position value: ${parkX}`);
        cy.log(`Expected (jogged X): ${joggedX}`);
        expect(parkX).to.be.closeTo(joggedX, 0.1, 'X park position should match jogged X position');
      });

    // Verify Y park position matches jogged Y
    cy.get('#section-5 span.sm\\:order-none > div > div:nth-of-type(2) input')
      .invoke('val')
      .then((yValue) => {
        const parkY = parseFloat(yValue);
        cy.log(`Park Y position value: ${parkY}`);
        cy.log(`Expected (jogged Y): ${joggedY}`);
        expect(parkY).to.be.closeTo(joggedY, 0.1, 'Y park position should match jogged Y position');
      });

    // Verify Z park position matches jogged Z
    cy.get('#section-5 fieldset:nth-of-type(3) div:nth-of-type(3) input')
      .invoke('val')
      .then((zValue) => {
        const parkZ = parseFloat(zValue);
        cy.log(`Park Z position value: ${parkZ}`);
        cy.log(`Expected (jogged Z): ${joggedZ}`);
        expect(parkZ).to.be.closeTo(joggedZ, 0.1, 'Z park position should match jogged Z position');
        
        cy.log('Grab feature verified: Park positions match current machine positions');
      });

  });
});
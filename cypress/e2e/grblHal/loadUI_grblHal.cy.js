describe('gSender UI Load Test', () => {
  const APP_URL = 'http://localhost:8000/#/';
  const MAX_RETRIES = 3;
  
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it('should load gSender UI with refresh on failure', () => {
    function tryLoadUI(attempt = 1) {
      cy.log(`Loading attempt ${attempt} of ${MAX_RETRIES}`);
      
      if (attempt === 1) {
        cy.visit(APP_URL, { 
          failOnStatusCode: false,
          timeout: 30000 
        });
      } else {
        cy.reload();
      }

      cy.wait(3000);

      // Check multiple indicators that UI has loaded
      cy.get('body', { timeout: 5000 }).then(($body) => {
        const hasButton = $body.find('button').length > 0;
        const hasCOM = $body.text().includes('COM');
        const hasConnection = $body.text().includes('Connect') || $body.text().includes('Connection');
        
        const uiLoaded = hasButton && (hasCOM || hasConnection);
        
        cy.log(`Buttons found: ${hasButton}, COM text: ${hasCOM}, Connection text: ${hasConnection}`);
        
        if (uiLoaded) {
          cy.log('UI loaded successfully');
        } else if (attempt < MAX_RETRIES) {
          cy.log('UI not loaded, refreshing...');
          tryLoadUI(attempt + 1);
        } else {
          throw new Error(`Failed to load UI after ${MAX_RETRIES} attempts`);
        }
      });
    }

    tryLoadUI();
  });
});
// Cypress config for the plugin-system e2e suite. Separate from
// cypress.config.js because that file pins specPattern to the grblHal
// master spec (which requires a physical CNC); this suite runs against a
// production-layout server on :8000 with no machine attached.
//
//   npm run test:plugins
const { defineConfig } = require('cypress');

module.exports = defineConfig({
    e2e: {
        specPattern: 'cypress/e2e/plugins/**/*.cy.js',
        baseUrl: process.env.BASE_URL || 'http://localhost:8000',
        pageLoadTimeout: 60000,
        defaultCommandTimeout: 10000,
        video: false,
        chromeWebSecurity: false,
    },
});

const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:8000',
    experimentalStudio: true,
    pageLoadTimeout: 200000,
    env: {
      file:'cypress/fixtures/sample.gcode'
    }
  }
});
 
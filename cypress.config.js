const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'http://localhost:8000',
    reporter: 'mochawesome', // must be exactly like this
    reporterOptions: {
      reportDir: 'cypress/reports/mochawesome', // folder for HTML/JSON reports
      overwrite: false,
      html: true,           // generate HTML report
      json: true,           // generate JSON report
      charts: true,         // include charts
      embeddedScreenshots: true, // attach screenshots
    },
    setupNodeEvents(on, config) {
      // Handle uncaught exceptions from the application
      on('before:browser:launch', (browser = {}, launchOptions) => {
        return launchOptions;
      });

      return config;
    },
    // Disable web security to avoid some cross-origin issues
    chromeWebSecurity: false,
    // Experimental feature to handle obstructive code
    experimentalModifyObstructiveThirdPartyCode: true,
  },
});
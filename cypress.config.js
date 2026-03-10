const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-multi-reporters',        // ← CHANGED
  reporterOptions: {
    configFile: 'reporter-config.json',        // ← CHANGED (all other options moved to reporter-config.json)
  },

  e2e: {
    baseUrl: process.env.BASE_URL || 'http://localhost:8000/#',

    // ========================================
    // Environment Variables
    // ========================================
    env: {
      deviceName: process.env.CYPRESS_DEVICE_NAME || 'COM',
    },
    // ========================================

    setupNodeEvents(on, config) {
      // Register mochawesome plugin
      require('cypress-mochawesome-reporter/plugin')(on);

      // Optional: before browser launch hook
      on('before:browser:launch', (browser = {}, launchOptions) => {
        return launchOptions;
      });

      return config;
    },

    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,

    supportFile: 'cypress/support/e2e.js',
  },
});
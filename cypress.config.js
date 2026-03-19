const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },

  e2e: {
    browser: 'chrome',  
    baseUrl: process.env.BASE_URL || 'http://localhost:8000/#',

    
    // Timeouts

    pageLoadTimeout: 60000,
    defaultCommandTimeout: 10000,


    // Environment Variables
    env: {
      deviceName: process.env.CYPRESS_DEVICE_NAME || 'COM',
    },
    setupNodeEvents(on, config) {

      // Terminal Logging Task
      on('task', {
        log(message) {
          console.log(`[gSender] ${message}`);
          return null;
        }
      });


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
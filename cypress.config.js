const { defineConfig } = require("cypress");
const fs = require("fs");

module.exports = defineConfig({
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress/reports/mochawesome",
    overwrite: false,
    html: true,
    json: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    reportFilename: "mochawesome",
  },
  e2e: {
    baseUrl: process.env.BASE_URL || 'http://localhost:8000/#',
    env: {
      deviceName: process.env.CYPRESS_DEVICE_NAME || 'COM',
    },
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);

      on('after:run', () => {
        const src = 'cypress/reports/mochawesome/mochawesome.json';
        const dst = 'cypress/reports/mochawesome/merged.json';
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dst);
          console.log('✓ Copied mochawesome.json → merged.json for dashboard');
        } else {
          console.warn('⚠ mochawesome.json not found, dashboard will have no test data');
        }
      });

      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-software-rasterizer');
        }
        return launchOptions;
      });

      return config;
    },
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    pageLoadTimeout: 120000,
    defaultCommandTimeout: 15000,
    supportFile: "cypress/support/e2e.js",
  },
});
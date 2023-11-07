const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:8000',
  },
  env: {
    grbl_machine: '/dev/tty.usbmodem21101',
    grblhal_machine: '/dev/tty.usbmodem3069383D33311',
  }
});

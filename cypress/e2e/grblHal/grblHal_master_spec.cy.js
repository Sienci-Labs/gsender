// master_spec.cy.js
describe('Master Test Suite - All Tests', () => {
  // Import and run each test context
  
  import('./device_connection_grblhal.cy.js');
  import('./jogging_using_buttons.grblHal.cy.js');
  import('./load_gcode_file.grblHal.cy.js');
  import('./file_info_display.grblHal.cy.js');
});  
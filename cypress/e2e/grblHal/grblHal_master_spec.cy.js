// master_spec.cy.js
describe('Master Test Suite - All Tests', () => {
  // Import and run each test context
  
  import('./device_connection_grblhal.cy.js');

  import('./load_gcode_file.grblHal.cy.js');
  import('./file_info_display.grblHal.cy.js');
  import('./jogging_using_buttons.grblHal.cy.js');
  import('./jogging_usingkeybaord_grblhal.cy.js');
  import('./jog_presets.spec.grblHal.cy.js');
  import('./zeroing_operations.grblHal.cy.js');
  import('./visualizer_rendering.spec.cy.js');

  import('./jobrun_withouthoming_grblHal.cy.js');
  import('./coolant_spec_grbHal.cy.js');
  import('./feedrate_override_controls_spec.cy.js');
  import('./macros_running_spec.cy');
  




 
  




});  
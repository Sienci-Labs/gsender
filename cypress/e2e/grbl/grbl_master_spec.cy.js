// master_spec.cy.js
describe('Master Test Suite - All Tests', () => {
  // Import and run each test context
  require('./loadUI_grbl.cy.js');
  require('./device_connection.cy.js');
  require('./disconnect.hr.cy.js');
  require('./load_gcode_file.spec.cy.js');
  require('./visualizer_rendering.spec.cy.js');
  require('./file_info_display.spec.cy.js');
  require('./gotolocation.cy.js');
  require('./joggingusingbuttons.cy.js');
  require('./axisgotoaddandsubvalue.cy.js');
  require('./axisgotoupdatevalue.cy.js');
  require('./jobrungrbl.cy.js');
  require('./pausejobgrbl.cy.js');
  require('./Stoppingjobgrbl.cy.js');
  require('./start_from_line.spec.cy.js');
  require('./jog_presets.spec.cy.js');
});  
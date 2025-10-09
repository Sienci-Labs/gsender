export type Macro = {
    name: string;
    content: string;
};

export const P200Content = `; ******** BEGIN USER CONFIGURATION ********

; ******** BASIC SETUP ********

; The number of slots in your magazine. Defined in P100.macro, will abort if not defined.
; #<_tc_slots> = 6; Enable for Ad-hoc definition.
o100 if [[EXISTS[#<_tc_slots>]] EQ 0]
  (abort, ATCI:1|Tool changer failed to initialize|Failed to find variable "_tc_slots", rerun ATC setup and try again)
o100 endif
(debug, Slots: #<_tc_slots>)

; The number of slots in your tool table.
#<_tc_table_size> = 32
(debug, Table size: #<_tc_table_size>)

; ******** OFFSET BEHAVIOR SETUP ********
; On and Off Rack Offset Management Modes defined by variables #<_irt_offset_mode> and #<_ort_offset_mode>
; Defined in P100.macro, will abort if not defined.

; 0: Always probe new offset
; 1: Always use tool table offset
; 2: Always use tool table offset and verify

;#<_irt_offset_mode> = 2; Enable for Ad-hoc definition.
;#<_ort_offset_mode> = 0; Enable for Ad-hoc definition.

o101 if [[EXISTS[#<_irt_offset_mode>]] EQ 0]
  (abort, ATCI:1|Tool changer failed to initialize|Failed to find variable "_irt_offset_mode", rerun ATC setup and try again)
o101 elseif [[EXISTS[#<_ort_offset_mode>]] EQ 0]
  (abort, ATCI:1|Tool changer failed to initialize|Failed to find variable "_ort_offset_mode", rerun ATC setup and try again)
o101 endif

; ******** COORDINATE SETUP ********
; ******** XY Axis ********
; The X and Y machine coordinate positions of slot 1.
#<_tc_slot_one_x> = #5341
(debug, Slot 1 X: #<_tc_slot_one_x> from G59.1)
#<_tc_slot_one_y> = #5342
(debug, Slot 1 Y: #<_tc_slot_one_y> from G59.1)

; The slot offset for your rack. Defined by variables #<_tc_slot_offset>
; Defined in P100.macro, will abort if not defined.

;#<_tc_slot_offset> = 92; Enable for Ad-hoc definition.
(debug, Slot Offset: #<_tc_slot_offset>)

o102 if [[EXISTS[#<_tc_slot_offset>]] EQ 0]
  (abort, ATCI:1|Tool changer failed to initialize|Failed to find variable "_tc_slot_offset", rerun ATC setup and try again)
o102 endif

; The X and Y machine coordinate positions for loading off rack tools
#<_tc_off_rack_x> = #5361
(debug, Off rack X: #<_tc_off_rack_x>, from G59.2)
#<_tc_off_rack_y> = #5362
(debug, Off rack Y: #<_tc_off_rack_y>, from G59.2)

; The Y machine coordinate positon for Y-axis pulloff.
#<_tc_y_pulloff> = 0
(debug, Pulloff Y: #<_tc_y_pulloff>)

; The feedrate for Y-axis pulloff.
#<_tc_y_pulloff_feed> = 1000
(debug, Pulloff Y Feedrate: #<_tc_y_pulloff_feed>)

; ******** Z Axis ********
; The Z machine coordinate positon for load.
#<_tc_load_z> = #5343
(debug, Load Z: #<_tc_load_z> from G59.1 coordinate)

; The Z coordinate offset for dedust start.
#<_tc_dedust_z_offset> = 20
(debug, Dedust Z Offset: #<_tc_dedust_z_offset>)

; The Z axis dedust feedrate.
#<_tc_z_dedust_feed> = 1500
(debug, Z Dedust Feedrate: #<_tc_z_dedust_feed>)

; The Z machine coordinate position for clearing all obstacles.
#<_tc_safe_z> = 0
(debug, Safe Clearance Z: #<_tc_safe_z>)

; ******** DRAWBAR CONTROL ********

; The output pin for the drawbar
#<_tc_output_db> = 1
(debug, Drawbar output at pin #<_tc_output_db>)

; The output pin for air seal
#<_tc_output_as> = 0
(debug, NO Air seal output at pin #<_tc_output_as>)

; The output pin for tool change button enable
#<_tc_output_bt> = 2
(debug, NO Air seal output at pin #<_tc_output_as>)

; The input pin for the drawbar sensor
#<_tc_input_db> = 0
(debug, Drawbar sensor at pin #<_tc_input_db>)

; The input pin for the tool in spindle sensor
#<_tc_input_tis> = 1
(debug, Tool in spindle sensor at pin #<_tc_input_tis>)

; ******** TOOL LENGTH PROBE CONTROL ********
; X and Y machine coordinate positions of the tool setter.
#<_tc_measure_x> = #5381
(debug, Tool Measure X: #<_tc_measure_x>, from G59.3)
#<_tc_measure_y> = #5382
(debug, Tool Measure Y: #<_tc_measure_y>, from G59.3)

; Z machine coordinate position at which to begin the initial probe.
#<_tc_measure_start_z> = 0
(debug, Tool Measure Start Z: #<_tc_measure_start_z>)

; The distance to probe in search of the tool setter for the initial probe.
#<_tc_seek_dist> = -150
(debug, Tool Measure Seek Distance: #<_tc_seek_dist>)

; The distance to retract after the initial probe trigger.
#<_tc_retract_dist> = 2
(debug, Tool Measure Retract Distance: #<_tc_retract_dist>)

; The feed rate for the initial probe.
#<_tc_seek_feed> = 1000
(debug, Tool Measure Seek Feed Rate: #<_tc_seek_feed>)

; The feed rate for the second probe.
#<_tc_set_feed> = 50
(debug, Tool Measure Set Feed Rate: #<_tc_set_feed>)

; Check tool length when tool changing
#<_check_tl_error> = 1
(debug, Maximum tool length difference to trigger an incorrect tool error #<_check_tl_error>)

; ******** SYSTEM VARIABLES ********
; Assign tool 0 as empty
#<_empty_tool> = 0
(debug, Empty tool assigned to: T#<_empty_tool>)

#<_comp_ver> = 20250618
(debug, Compatible version: #<_comp_ver>)

; ******** STARTUP ********
; ******** STARTUP ACTIONS ********
; Turn off spindle, highly unlikely scenario
M5

; ******** STARTUP CHECK ********

;Check homed state
o200 if [#<_homed_state> NE 1]
  (abort, ATCI:1|Machine not homed|Tool changer disabled, home your machine to continue.)
o200 endif

; Check if state of the spindle is in sync with firmware
M66 P[#<_tc_input_tis>] L4 Q0.5

o210 if [[#5399] EQ -1]
  o211 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tc_table_size>]
    (print, ATCI:0|No tool in spindle, but tool #<_current_tool> is active|Resume to clear the currently active tool number)
    M61 Q[#<_empty_tool>]
    M0
  o211 endif
o210 else
  o212 if [#<_current_tool> EQ 0]
      (print, ATCI:0|Tool in spindle without active tool number|Resume to move to safe position and unload the tool manually)
      M0
      G53 G0 Z[#<_tc_safe_z>]
      G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]
    ; Move to off rack tool load / unload position
    o213 do
      (print, ATCI:0|Action Required|Remove tool using the drawbar button)
      G4P0
      M64 P[#<_tc_output_bt>]
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o213 while [[#5399] EQ -1]
    M65 P[#<_tc_output_bt>]
  o212 endif
o210 endif


; ******** APPLY TOOL OFFSET ********

; Reapply tool offset at startup
o300 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tc_table_size>]
  G43 H[#<_current_tool>]
  (debug, Tool offset for #<_current_tool> applied)
o300 else
  G49
  (debug, Tool not in holder, offsets cleared)
o300 endif

; The flag indicating that the settings have been loaded into memory.
#1001 = 1
(debug, Tool changer ready flag Set: #1001)
(debug, Sienci ATC Configuration Loaded)

; The flag in an internal variable for tracking whether tool length measurement is active
#1002 = 0

; ********SENDER COMMUNICATIONS ********
(print,ATCI|table_size:#<_tc_table_size>|rack_size:#<_tc_slots>)

M99`;

export const P300Content = `
; ************ DESCRIPTION ************
; Picks up tool QX and probes it
; If it is an in rack tool, allow the rack to be empty
; If it is an off rack tool, user must insert a tool


; Local variables
#<_current_slot> = 1;

; ************ BEGIN VALIDATION ************
;Check homed state
o100 if [#<_homed_state> NE 1]
    (abort, Tool changer offline as machine is not homed. Home your machine to continue.)
o100 endif

; Check tool changer setup
o110 if [#1001 NE 1]
  (abort, Tool changer not initialized. Initialize the tool changer to continue.)
  M0
  M99
o110 endif

; Check rack sync
; Will also be able to catch people who removed their tool pre-maturely.
M66 P[#<_tc_input_tis>] L4 Q0.5
o120 if [[#5399] EQ -1]
  o121 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tc_table_size>]
    (debug, TOOL CHANGER ERROR - No tool in spindle, but tool number #<_current_tool> is active. Tool number cleared.)
    M61 Q[#<_empty_tool>]
    M0
  o121 endif
o120 else
  o122 if [#<_current_tool> EQ 0]
      (debug, TOOL CHANGER ERROR - Unknown tool in spindle. Resume to move to safe position and unload tool.)
      M0
      G53 G0 Z[#<_tc_safe_z>]
      G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]
    ; Move to off rack tool load / unload position
    o123 do
      (debug, Remove tool using the drawbar button)
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o123 while [[#5399] EQ -1]
  o122 endif
o120 endif

; ************ END VALIDATION ************

; ************ BEGIN TOOL CHANGE ************
o200 while [#<_current_slot> LE #<_tc_slots>]
    #1002 = 1;
    M6T[#<_current_slot>]
    #1002 = 0;
    (debug, Tool Change Complete)
    o210 if [#<_current_tool> EQ #<_current_slot>]
        (debug, tool change successful, probing current tool)
        G65P500
    o210 else
        (debug, tool change unsuccessful, offset cleared)
        G10 L1 P[#<_current_slot>] Z0
    o210 endif
    ; Move to safe height
    G53 G0 Z[#<_tc_safe_z>]
    #<_current_slot> = [#<_current_slot> + 1]
o200 endwhile

M99`;

export const P301Content = `
; ************ DESCRIPTION ************
; Picks up tool QX and probes it
; If it is an in rack tool, allow the rack to be empty
; If it is an off rack tool, user must insert a tool


; Local variables
#<_tool_chache> = #17;

; ************ BEGIN VALIDATION ************
;Check homed state
o100 if [#<_homed_state> NE 1]
    (abort, Tool changer offline as machine is not homed. Home your machine to continue.)
o100 endif

; Check tool changer setup
o110 if [#1001 NE 1]
  (abort, Tool changer not initialized. Initialize the tool changer to continue.)
  M0
  M99
o110 endif

; Check rack sync
; Will also be able to catch people who removed their tool pre-maturely.
M66 P[#<_tc_input_tis>] L4 Q0.5
o120 if [[#5399] EQ -1]
  o121 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tc_table_size>]
    (debug, TOOL CHANGER ERROR - No tool in spindle, but tool number #<_current_tool> is active. Tool number cleared.)
    M61 Q[#<_empty_tool>]
    M0
  o121 endif
o120 else
  o122 if [#<_current_tool> EQ 0]
      (debug, TOOL CHANGER ERROR - Unknown tool in spindle. Resume to move to safe position and unload tool.)
      M0
      G53 G0 Z[#<_tc_safe_z>]
      G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]
    ; Move to off rack tool load / unload position
    o123 do
      (debug, Remove tool using the drawbar button)
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o123 while [[#5399] EQ -1]
  o122 endif
o120 endif

o130 if [#<_tool_chache> LE 0 OR #<_tool_chache> GT #<_tc_table_size>] 
    (abort, Invalid tool number)
o130 endif
; ************ END VALIDATION ************

; ************ BEGIN TOOL CHANGE ************
#1002 = 1
M6T[#<_tool_chache>]
(debug, Tool Change Complete)
o200 if [#<_current_tool> EQ #<_tool_chache>]
    (debug, tool change successful, probing current tool)
    G65P500
o200 else
    (debug, tool change unsuccessful, offset cleared)
    G10 L1 P[#<_tool_chache>] Z0
o200 endif

; Move to safe height
G53 G0 Z[#<_tc_safe_z>]
M99`;

export const P500Content = `
; This is a helper function to probe the currently installed tool and reapply any new tool offsets.
; If called without an argument, it will overwrite the existing tool offset
; If called with an argument of Q1, it will check the currently stored offset against the tool table.

#<_probe_mode> = #17

;Move to tool length sensor
G53 G0 Z[#<_tc_safe_z>]
G53 G0 X[#<_tc_measure_x>]
G53 G0 Y[#<_tc_measure_y>]
G53 G0 Z[#<_tc_measure_start_z>]

;Scrub old offset, such that it will appear as 0 if probing fails.
o100 if [#<_probe_mode> EQ 0]
    G10 L1 P[#<_current_tool>] Z0
    G43 H[#<_current_tool>]
o100 endif

; Touch-off
G38.2 G91 Z[#<_tc_seek_dist>] F[#<_tc_seek_feed>]
G90

; Compute tool offset
#<tool_offset> = [#[5203 + [#5220 * 20]] + #5063]
(debug, Tool #<_current_tool> offset is #<tool_offset>)

o200 if [#<_probe_mode> EQ 0]
    ; Define new offset
    G10 L1 P[#<_current_tool>] Z[#<tool_offset>]
o200 elseif [#<_probe_mode> EQ 1]
    ; Check existing offset
    G65P2Q[#<_current_tool>]R2
    o210 while [ABS[#<tool_offset> - #<_value>] GT #<_check_tl_error>]
        (print, ATCI:0|Offset difference greater than #<_check_tl_error>|Resume to reprobe this tool or reset.)
        M0
        ;Reprobe offset, recursive call has race condition issues so using a while loop instead
        ; Touch-off
        ;Move to tool length sensor
        G53 G0 Z[#<_tc_safe_z>]
        G53 G0 X[#<_tc_measure_x>]
        G53 G0 Y[#<_tc_measure_y>]
        G53 G0 Z[#<_tc_measure_start_z>]
        G38.2 G91 Z[#<_tc_seek_dist>] F[#<_tc_seek_feed>]
        G90
        ; Compute tool offset
        #<tool_offset> = [#[5203 + [#5220 * 20]] + #5063]
        (debug, Tool #<_current_tool> offset is #<tool_offset>)
        G10 L1 P[#<_current_tool>] Z[#<tool_offset>]
        G65P2Q[#<_current_tool>]R2
    o210 endwhile
o200 endif

; Apply new offset.
G43 H[#<_current_tool>]

; Move to safe height
G53 G0 Z[#<_tc_safe_z>]
M99`;

export const P501Content = `
; This is a helper function to display current output status

(debug, Running helper function P503 for pin status display)

#<max_cycle> = 100
#<movement_per_cycle> = -0.1
#<current_cycle> = 0


o100 do
    M66 P0 L3 Q0.01
    G1 G91 Z[#<movement_per_cycle>] F100
    G4P0
    #<current_cycle> = [#<current_cycle> + 1]
    (debug, Cycle #<current_cycle>)
o100 while [[#5399] NE -1 AND #<current_cycle> LT #<max_cycle>]

`;

export const P502Content = `
; This is a helper function to display current output status

(debug, Running helper function P503 for pin status display)

#<max_cycle> = 500
#<movement_per_cycle> = 0.1
#<current_cycle> = 0
#<x_min> = 0
#<x_max> = 0

#<y_min> = 0
#<y_max> = 0

o100 do
    M66 P0 L3 Q0.01
    G1 G91 X[#<movement_per_cycle>] F100
    G4P0
    #<current_cycle> = [#<current_cycle> + 1]
    (debug, Cycle #<current_cycle>)
o100 while [[#5399] NE -1 AND #<current_cycle> LT #<max_cycle>]

#<x_min> = #5420
G0G91X12
G4P0
#<current_cycle> = 0

o101 do
    M66 P0 L3 Q0.01
    G1 G91 X[-1 * [#<movement_per_cycle>]] F100
    G4P0
    #<current_cycle> = [#<current_cycle> + 1]
    (debug, Cycle #<current_cycle>)
o101 while [[#5399] NE -1 AND #<current_cycle> LT #<max_cycle>]
#<x_max> = #5420
(debug, x min is #<x_min> and x max is #<x_max>)
G0G91X[[#<x_min> - #<x_max>]/2]
G0G91Y-1.5
#<current_cycle> = 0
o102 do
    M66 P0 L3 Q0.01
    G1 G91 Y[#<movement_per_cycle>] F100
    G4P0
    #<current_cycle> = [#<current_cycle> + 1]
    (debug, Cycle #<current_cycle>)
o102 while [[#5399] NE -1 AND #<current_cycle> LT #<max_cycle>]

#<y_min> = #5421
G0G91Y12
G4P0
#<current_cycle> = 0

o103 do
    M66 P0 L3 Q0.01
    G1 G91 Y[-1 * [#<movement_per_cycle>]] F100
    G4P0
    #<current_cycle> = [#<current_cycle> + 1]
    (debug, Cycle #<current_cycle>)
o103 while [[#5399] NE -1 AND #<current_cycle> LT #<max_cycle>]
#<y_max> = #5421
(debug, y min is #<y_min> and xymax is #<y_max>)
G0G91Y[[#<y_min> - #<y_max>]/2]

`;

export const P503Content = `
; This is a helper function to display current output status

(debug, Running helper function P503 for pin status display)

M66 P0 L3 Q0.01
o100 if [[#5399] EQ -1]
    (debug, Pin 0 status is low)
o100 else
    (debug, Pin 0 status is high)
o100 endif

M66 P1 L3 Q0.01
o110 if [[#5399] EQ -1]
    (debug, Pin 1 status is low)
o110 else
    (debug, Pin 1 status is high)
o110 endif

M66 P2 L3 Q0.01
o120 if [[#5399] EQ -1]
    (debug, Pin 2 status is low)
o120 else
    (debug, Pin 2 status is high)
o120 endif

M66 P3 L3 Q0.01
o130 if [[#5399] EQ -1]
    (debug, Pin 3 status is low)
o130 else
    (debug, Pin 3 status is high)
o130 endif

`;

export const P900Content = `
;P900 Remove tool from spindle nose
; Logically equivalent to unloading any tool with an off rack procedure
(debug, Running P900 - Remove tool from nose)

; ************ VARIABLES ************
#<unload_mode> = 0;
#<unload_offset_mode> = 0

; ************ BEGIN VALIDATION ************
;Check homed state
o100 if [#<_homed_state> NE 1]
    (abort, Tool changer offline as machine is not homed. Home your machine to continue.)
o100 endif

; Check tool changer setup
o110 if [#1001 NE 1]
  (abort, Tool changer not initialized. Initialize the tool changer to continue.)
  M0
  M99
o110 endif

; Check rack sync
; Will also be able to catch people who removed their tool pre-maturely.
M66 P[#<_tc_input_tis>] L4 Q0.5
o120 if [[#5399] EQ -1]
  o121 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tc_table_size>]
    (debug, TOOL CHANGER ERROR - No tool in spindle, but tool number #<_current_tool> is active. Tool number cleared.)
    M61 Q[#<_empty_tool>]
    M0
  o121 endif
o120 else
  o122 if [#<_current_tool> EQ 0]
      (debug, TOOL CHANGER ERROR - Unknown tool in spindle. Resume to move to safe position and unload tool.)
      M0
      G53 G0 Z[#<_tc_safe_z>]
      G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]
    ; Move to off rack tool load / unload position
    o123 do
      (debug, Remove tool using the drawbar button)
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o123 while [[#5399] EQ -1]
  o122 endif
o120 endif

; Check mode to unload
o130 if [#<_current_tool> EQ #<_empty_tool>]
  #<unload_mode> = -1
  (debug, Unload skipped)
o130 elseif [#<_current_tool> GT #<_tc_slots>]
  #<unload_mode> = 1
  (debug, Unload off rack tool)
o130 else
  (debug, Unload in rack tool)
o130 endif

; Check if selected tool has no offset
  ; when not in probe mode,
  ; when empty tool is not selected, 
  ; When probe new offset every timeis not enforced

o140 if [#<unload_mode> EQ 0]
  #<unload_offset_mode> = #<_irt_offset_mode>
o140 elseif [#<unload_mode> EQ 1]
  #<unload_offset_mode> = #<_ort_offset_mode>
o140 endif

; ************ END VALIDATION ************

; ************ BEGIN UNLOAD ************

; Only perform unload if tool is not removed already removed during validation

o200 if [#<unload_mode> NE -1]
    ; ************ MOTION BLOCK - UNLOAD Off Rack Tool ************
    ; Move to off rack tool load / unload position
    G53 G0 Z[#<_tc_safe_z>]
    G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]

    ; Pause as long as the tool is not removed
    o520 do
        (debug, Remove tool with the drawbar button)
        M0
        M66 P[#<_tc_input_tis>] L3 Q0.05
        G4P0.1
    o520 while [[#5399] EQ -1]
o200 endif
; ************ END UNLOAD ************

; Clear offset as appropriate
o600 if [#<unload_mode> NE -1 AND #<unload_offset_mode> EQ 0]
  G10 L1 P[#<_current_tool>] Z0
o600 endif

M61 Q[#<_empty_tool>]
G4P0
G49
(debug, Tool length offset cleared, vacant tool number applied)

M99
`;

export const P901Content = `
; P901 Load tool at spindle nose
(debug, Running P900 - Load tool at spindle nose)

; ************ VARIABLES ************
#<selected_tool_cache> = #17;
#<load_mode> = 0
#<load_offset_mode> = 0

; ************ BEGIN VALIDATION ************
;Check homed state
o100 if [#<_homed_state> NE 1]
    (abort, Tool changer offline as machine is not homed. Home your machine to continue.)
o100 endif

; Check tool changer setup
o110 if [#1001 NE 1]
  (abort, Tool changer not initialized. Initialize the tool changer to continue.)
  M0
  M99
o110 endif

; Check rack sync
; Will also be able to catch people who loaded their tools prematurely by asking them to remove it (can be enhanced to load it into the rack).
M66 P[#<_tc_input_tis>] L4 Q0.5
o120 if [[#5399] EQ -1]
  o121 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tc_table_size>]
    (debug, TOOL CHANGER ERROR - No tool in spindle, but tool number #<_current_tool> is active. Tool number cleared.)
    M61 Q[#<_empty_tool>]
    M0
  o121 endif
o120 else
  o122 if [#<_current_tool> EQ 0]
      (debug, TOOL CHANGER ERROR - Unknown tool in spindle. Resume to move to safe position and unload tool.)
      M0
      G53 G0 Z[#<_tc_safe_z>]
      G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]
    ; Move to off rack tool load / unload position
    o123 do
      (debug, Remove tool using the drawbar button)
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o123 while [[#5399] EQ -1]
  o122 endif
o120 endif

; Check if tool load should be skipped
o130 if [#<selected_tool_cache> EQ #<_empty_tool>]
  #<load_mode> = -1
  (debug, Load skipped)
o130 elseif [#<selected_tool_cache> GT #<_tc_slots>]
  #<load_mode> = 1
  (debug, Load off rack tool)
o130 else
 (debug, Load in rack tool)
o130 endif

o140 if [#<load_mode> EQ 0]
  #<load_offset_mode> = #<_irt_offset_mode>
o140 elseif [#<load_mode> EQ 1]
  #<load_offset_mode> = #<_ort_offset_mode>
o140 endif
; ************ END VALIDATION ************

; ************ BEGIN LOAD ************

; Only perform unload if tool is not loaded during validation

o200 if [#<load_mode> NE -1]
    ; ************ MOTION BLOCK - LOAD OFF RACK TOOL ************
    ; Move to off rack tool load / unload position
    G53 G0 Z[#<_tc_safe_z>]
    G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]

    ; Pause as long as the tool is not removed
    o210 do
        (debug, Install tool #<selected_tool_cache> with the drawbar button)
        M0
        M66 P[#<_tc_input_tis>] L4 Q0.05
        G4P0.1
    o210 while [[#5399] EQ -1]
o200 endif

; Change current tool number
M61 Q[#<selected_tool_cache>]
G4P0

(debug, Load Complete)
; ************ END LOAD ************

; ************ BEGIN TOOL LENGTH MANAGEMENT (LOAD) ************

; Apply existing tool offset (if any), this will be used if compensation fails.
G43 H[#<_current_tool>]

; Execute probing if not part of a probing cycle and not loading an empty tool
; Probe when
; Not in probe mode
; Not loading an empty tool 
o800 if [#<load_mode> NE -1]
  ; If offset mode is 0, probe
  ; If offset mode is 1, apply existing offset
  ; If offset mode is 2, check

  o810 if [#<load_offset_mode> EQ 0]
    G65P500    
  o810 elseif [#<load_offset_mode> EQ 2]
    G65P500Q1
  o810 endif
o800 endif
; ************ END TOOL LENGTH MANAGEMENT (LOAD) ************
`;

export const TCContent = `
;if 1002 is active, set probing to 1
;if selected tool is an off rack tool, set load condition to 1, if selected tool is 0, set load condition to -1
;if current tool is an off rack tool, set load condition to 1, if current tool is 0, set load condition to -1
;if tool does not have an offset and probe mode is not active, pause and wait for user to confirm probe.
;if skip_load is false, run the unload tool program
  ;unload tool program needs to diffrentiate between IRT and ORT
;run the load tool program
  ;if probing is 0, raise an alarm when no tool is picked up
;If probing is 0, do not apply offsets.

(debug, Tool change begin)

; Local variables
#<probing> = 0; Probe Mode
#<unload_mode> = 0;
#<load_mode> = 0
#<unload_offset_mode> = 0
#<load_offset_mode> = 0
#<selected_tool_cache> = 0; Caching selected tool variable as M61 will clear this variable when changing current tool to 0 between tool unload and tool load.

; ************ BEGIN VALIDATION ************
;Check homed state
o100 if [#<_homed_state> NE 1]
  (abort, ATCI:1|Machine not homed|Tool changer disabled, home your machine to continue.)
o100 endif

; Check tool changer setup
o110 if [#1001 NE 1]
  (abort, ATCI:1|Tool changer not initialized|Initialize the tool changer to continue)
o110 endif

; Check rack sync
M66 P[#<_tc_input_tis>] L4 Q0.5
o120 if [[#5399] EQ -1]
  o121 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tc_table_size>]
    (print, ATCI:0|No tool in spindle, but tool #<_current_tool> is active|Resume to clear the currently active tool number)
    M61 Q[#<_empty_tool>]
    M0
  o121 endif
o120 else
  o122 if [#<_current_tool> EQ 0]
      (print, ATCI:0|Tool in spindle without active tool number|Resume to move to safe position and unload the tool manually)
      M0
      G53 G0 Z[#<_tc_safe_z>]
      G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]
    ; Move to off rack tool load / unload position
    o123 do
      G4P0
      (print, ATCI:0|Action Required|Remove tool using the drawbar button)
      G4P0
      M62 P[#<_tc_output_bt>]
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o123 while [[#5399] EQ -1]
    M65 P[#<_tc_output_bt>]
  o122 endif
o120 endif

; Check if tool changing as part of a probe cycle
o130 if [#1002 EQ 1]
  (debug, Mode: Probing)
  #1002 = 0
  #<probing> = 1
o130 else
  (debug, Mode: Normal)
o130 endif

; Check if tool unload should be skipped
o140 if [#<_current_tool> EQ #<_empty_tool>]
  #<unload_mode> = -1
  (debug, Unload skipped)
o140 elseif [#<_current_tool> GT #<_tc_slots>]
  #<unload_mode> = 1
  (debug, Unload off rack tool)
o140 else
  (debug, Unload in rack tool)
o140 endif

; Check if tool load should be skipped
o141 if [#<_selected_tool> EQ #<_empty_tool>]
  #<load_mode> = -1
  (debug, Load skipped)
o141 elseif [#<_selected_tool> GT #<_tc_slots>]
  #<load_mode> = 1
  (debug, Load off rack tool)
o141 else
 (debug, Load in rack tool)
o141 endif

; Check if selected tool has no offset
  ; when not in probe mode,
  ; when empty tool is not selected, 
  ; When probe new offset every timeis not enforced

o142 if [#<unload_mode> EQ 0]
  #<unload_offset_mode> = #<_irt_offset_mode>
o142 elseif [#<unload_mode> EQ 1]
  #<unload_offset_mode> = #<_ort_offset_mode>
o142 endif

o150 if [#<load_mode> EQ 0]
  #<load_offset_mode> = #<_irt_offset_mode>
o150 elseif [#<load_mode> EQ 1]
  #<load_offset_mode> = #<_ort_offset_mode>
o150 endif

o160 if [#<probing> EQ 0 AND #<load_offset_mode> GT 0]
  G65P2Q[#<_selected_tool>]R2
  o161 if [#<_value> EQ 0]
    (print, ATCI:0|Tool has no offset and my not exist in holder|"Resume" to initialize the tool and continue, "Reset" if the slot is empty or if you have made an incorrect selection)
    M0
    #<load_offset_mode> = 0
  o161 endif
o160 endif

; ************ END VALIDATION ************

; ************ BEGIN SETUP ************

; Turn off spindle and coolant
M5
M9
(debug, Spindle and coolant turned off)

; Check if spindle is turned off


; Record current units
o210 if [#<_metric> EQ 0]
  #<_tc_return_units> = 20
o210 else
  #<_tc_return_units> = 21
o210 endif
(debug, Units recorded)

; Force metric
G21 G90
(debug, Change to metric mode)

; TODO, Restore home position
; TODO, Offset defined safe position

(debug, Moved to safe position)
; *************** END SETUP ****************

; ************ BEGIN UNLOAD ************

o500 if [#<unload_mode> EQ 0]
  (debug, Unloading in rack tool)
  ; ************ MOTION BLOCK - UNLOAD ON RACK TOOL ************
    ;TODO Break out into separate macro
    G53 G0 Z[#<_tc_safe_z>]
    G53 G0 X[#<_tc_measure_x>]
    G53 G0 Y[#<_tc_y_pulloff>]

    #<tc_x_unload> = [[[#<_current_tool> - 1] * #<_tc_slot_offset>] + #<_tc_slot_one_x>]
    #<tc_y_unload> = #<_tc_slot_one_y>

    G53 G0 X[#<tc_x_unload>] Y[#<_tc_y_pulloff>]
    G53 G0 Z[#<_tc_load_z>]
    G53 G1 Y[#<tc_y_unload>] F[#<_tc_y_pulloff_feed>]
    G4 P0.5

    ; Release drawbar
    M64 P[#<_tc_output_db>]
    ; Allow for all air to vent in case there is residule pressure in the system
    G4P0.8
    ; Verify drawbar release
    M66 P[#<_tc_input_db>] L4 Q0.5
    o310 if [[#5399] EQ -1]
      ;Close drawbar on error
      M65 P[#<_tc_output_db>]
      G53 G1 Y[#<_tc_y_pulloff>] F[#<_tc_y_pulloff_feed>]
      G53 G0 Z[#<_tc_safe_z>]
      G4P0
      (abort, ATCI:1|Tool change aborted|Drawbar did not engage, compressor system may be offline or under pressure)
    o310 endif

    ; Move away from tool rack
    G4 P0.2
    G53 G1 Z[#<_tc_load_z> + #<_tc_dedust_z_offset>] F[#<_tc_z_dedust_feed>]
    G4P0
    ; Drawbar off
    M65 P[#<_tc_output_db>]
    G4P0.5

    ; Check if tool is unloaded
    M66 P[#<_tc_input_tis>] L3 Q0.5
    o510 if [[#5399] EQ -1]
      (abort, ATCI:1|Tool change aborted|Tool #<_current_tool> did not released from spindle, check tool forks for damage. - May chain on safe position unload recovery procedure in the future.)
    o510 endif

    ; Move to safe height
    G53 G0 Z[#<_tc_safe_z>]

o500 elseif [#<unload_mode> EQ 1]
  (debug, Unloading off rack tool)

  ; ************ MOTION BLOCK - UNLOAD Off Rack Tool ************

    ; Move to off rack tool load / unload position
    G53 G0 Z[#<_tc_safe_z>]
    G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]

    ; Pause as long as the tool is not removed
    o520 do
      G4P0
      (print, ATCI:0|Action Required|Remove off rack tool using the drawbar button)
      G4P0
      M64 P[#<_tc_output_bt>]
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o520 while [[#5399] EQ -1]
    M65 P[#<_tc_output_bt>]
o500 else
(debug, Unload skipped)
o500 endif

(debug, Unload Complete)

; ************ END UNLOAD ************

; ************ BEGIN TOOL LENGTH MANAGEMENT (UNLOAD) ************
; Scrub current tool offset when
; Not probing
; Not an empty tool
; Not using tool table
o600 if [#<probing> EQ 0 AND #<unload_mode> NE -1 AND #<unload_offset_mode> EQ 0]
  G10 L1 P[#<_current_tool>] Z0
o600 endif

#<selected_tool_cache> = [#<_selected_tool>]
M61 Q[#<_empty_tool>]
G4P0
G49
(debug, Tool length offset cleared, vacant tool number applied)

; ************ END TOOL LENGTH MANAGEMENT (UNLOAD) ************

; ************ BEGIN LOAD ************

o700 if [#<load_mode> EQ 0]
  (debug, Loading in rack tool)
  ; ************ MOTION BLOCK - LOAD IN RACK TOOL ************
  ; Compute Load coordinates

  #<tc_x_load> = [[[#<selected_tool_cache> - 1] * #<_tc_slot_offset>] + #<_tc_slot_one_x>]
  #<tc_y_load> = #<_tc_slot_one_y>

  ; Go to load coordinates
  G53 G0 Z[#<_tc_safe_z>]
  G53 G0 X[#<tc_x_load>] Y[#<tc_y_load>]
  G53 G0 Z[#<_tc_load_z> + #<_tc_dedust_z_offset>]
  G4P0.1

  ; Release drawbar
  M64 P[#<_tc_output_db>]
  ; Allow for all air to vent in case there is residule pressure in the system
  G4P0.8
  ; Verify drawbar release
  M66 P[#<_tc_input_db>] L4 Q0.5
  o710 if [[#5399] EQ -1]
    ;Close drawbar on error
    M65 P[#<_tc_output_db>]
    G53 G0 Z[#<_tc_safe_z>]
    G4P0
    (abort, ATCI:1|Tool change error|Drawbar did not engage, compressor system may be offline or under pressure)
  o710 endif

  G53 G1 Z[#<_tc_load_z>] F[#<_tc_z_dedust_feed>]

  G4 P0.5
  M65 P[#<_tc_output_db>]
  G4 P1

  ; Check if tool is loaded
  M66 P[#<_tc_input_tis>] L4 Q0.5
  o720 if [[#5399] EQ -1]
    o721 if [#<probing> EQ 1]
    ;Allow for empty tool slot in probe mode
      (debug, Tool #<selected_tool_cache> empty in probe mode)
      #<selected_tool_cache> = #<_empty_tool>
    o721 else
      G53 G0 Z[#<_tc_safe_z>]
      (abort, ATCI1|Tool #<selected_tool_cache> not loaded, tool holder not in rack or is out of reach by the spindle. Place tool into tool rack to continue.)
    o721 endif
  o720 else
    ;Tool change is successful, pulloff
    G53 G1 Y[#<_tc_y_pulloff>] F[#<_tc_y_pulloff_feed>]
    G53 G0 Z[#<_tc_safe_z>]
    G53 G0 X[#<_tc_measure_x>]
  o720 endif

o700 elseif [#<load_mode> EQ 1]
  (debug, Loading off rack tool)
  ; ************ MOTION BLOCK - LOAD OFF RACK TOOL ************
  ; Move to off rack tool load / unload position
  G53 G0 Z[#<_tc_safe_z>]
  G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]

  ; Pause as long as the tool is not removed
  o730 do
    G4P0
    (print, ATCI:0|Action Required|Install off rack tool using drawbar button)
    G4P0
    M64 P[#<_tc_output_bt>]
    M0
    M66 P[#<_tc_input_tis>] L4 Q0.05
    G4P0.1
  o730 while [[#5399] EQ -1]
  M65 P[#<_tc_output_bt>]

o700 else
  (debug, Loading skipped)
o700 endif

; Change current tool number
M61 Q[#<selected_tool_cache>]
G4P0
(debug, Load Complete)
; ************ END LOAD ************

; ************ BEGIN TOOL LENGTH MANAGEMENT (LOAD) ************

; Apply existing tool offset (if any), this will be used if compensation fails.
G43 H[#<_current_tool>]

; Execute probing if not part of a probing cycle and not loading an empty tool
; Probe when
; Not in probe mode
; Not loading an empty tool 
o800 if [#<probing> EQ 0 AND #<load_mode> NE -1]
  ; If offset mode is 0, probe
  ; If offset mode is 1, apply existing offset
  ; If offset mode is 2, check

  o810 if [#<load_offset_mode> EQ 0]
    G65P500    
  o810 elseif [#<load_offset_mode> EQ 2]
    G65P500Q1
  o810 endif
o800 endif
; ************ END TOOL LENGTH MANAGEMENT (LOAD) ************


M99
`;

const defaultMacros: Macro[] = [
    {
        name: 'P200.macro',
        content: P200Content,
    },
    {
        name: 'P300.macro',
        content: P300Content,
    },
    {
        name: 'P301.macro',
        content: P301Content,
    },
    {
        name: 'P500.macro',
        content: P500Content,
    },
    {
        name: 'P501.macro',
        content: P501Content,
    },
    {
        name: 'P502.macro',
        content: P502Content,
    },
    {
        name: 'P503.macro',
        content: P503Content,
    },
    {
        name: 'P900.macro',
        content: P900Content,
    },
    {
        name: 'P901.macro',
        content: P901Content,
    },
    {
        name: 'TC.macro',
        content: TCContent,
    },
];

export interface ATCIMacroConfig {
    version: number;
    variables: {
        [key: string]: {
            default: number;
            value: number;
        };
    };
    variableFile: string;
    macros: Macro[];
}

export interface ATCIJSON {
    version: number;
    variables: {
        [key: string]: {
            default: number;
            value: number;
        };
    };
    variableFile: string;
    files: string[];
}

export const defaultATCIMacros: ATCIMacroConfig = {
    version: 20251009,
    variables: {
        _ort_offset_mode: {
            default: 0,
            value: 0,
        },
        _irt_offset_mode: {
            default: 2,
            value: 0,
        },
        _tc_rack_enable: {
            default: 0,
            value: 0,
        },
        _tc_slots: {
            default: 6,
            value: 0,
        },
        _tc_slot_offset: {
            default: 92,
            value: 0,
        },
        _passthrough_offset_setting: {
            default: 0,
            value: 0,
        },
        _pres_sense: { default: 0, value: 0 },
        _holder_sense: { default: 1, value: 0 },
    },
    variableFile: 'P100.macro',
    macros: defaultMacros,
};

import { ATCIVariable } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';

export type Macro = {
    name: string;
    content: string;
};

export const P302Content = `;=======================================================================================
;This is a macro for probing rack position for first time setup of a tool rack
;=======================================================================================
;Must run after completion of the ATC initialization macro P200.macro
;requires machine to be homed, rack sensor #<_tc_input_rack> HIGH and probe to be in starting position above first pull-stud with #<_tc_input_th> HIGH
;Sets g59.1 rack offset for leftmost tool position; represents pos of center of collar of tool holder

;Note: Current version of grblhal () contains a bug that causes controller to hang when subroutine implementation is used for this macro. Until resolved, probing sequences are repeated inline and within the helper macro P510.macro. 

;TODO:
;verify positioning in y does not exceed machine limits when running probe cycle and possibly inform user of mis-mounted rack or bent forks.

;================setup================
;#<_tc_input_th> -> TH sensor pin
#<_NAN> = -9999999
#<_XPrb> = #<_NAN>
#<_YPrb> = #<_NAN>
#<_ZPrb> = #<_NAN>
#<_studDiam> = 6.5
#<_xBKOff> = 3
#<_yBKOff> = 2
#<_roughStep> = 0.5
#<_fineStep> = 0.2
#<_ZPrbSensitivity> = #<_NAN>

#<rackMode> = -1
#<setUnits> = #<_NAN>
;Z offset includes probe sensing distance of ~3mm
#<probeZOffset> = -12
#<probeYOffset> = -46
#<rack2expX> = #<_NAN>
#<rack2expY> = #<_NAN>
#<rack2expZ> = #<_NAN>
G4 P0.2

;=================MACRO START=====================
;Pre-flight checks
;Check homed state
G65 P508

;Check ATC Initialization
G65 P509

;Turn off all active spindles and stop coolant
(print, Disabling spindles and coolant...)
M5 $-1
M9
G4 P0.1

;Set Units as MM
o101 if [#4006 EQ 20]
    ;if current is SAE then switch units for macro and retain flag for later
    (print, Setting units to MM during probe utility, will revert to previous units after completion.)
    #<setUnits> = 1
    G21
o101 endif

;Check Rack Setup
;Check for rack presence
G4 P0
M66 P[#<_tc_input_rack>] L3 Q0.01
G4 P0

o102 if [#5399 NE -1]
    (abort, ATCI:1|Utility Aborted|The rack sensor does not detect a rack. Please ensure the tool rack is physically installed and the rack sensor is triggered, then trying again. [A-302-01])
o102 endif

;check for rack configuration
;#<_tc_slots> -> points to rack arrangment 6 or 12
o103 if [#<_tc_slots> EQ 6]
    (print, Configured for 6 Tool: Rack Mode 0)
    #<rackMode> = 0
o103 elseif [#<_tc_slots> EQ 12]
    (print, Configured for 12 Tool: Rack Mode 1)
    #<rackMode> = 1
o103 else
    (abort, ATCI:1|Pull-Stud Position Found|The machine will now move to the next position in the sequence. Please be ready to E-stop the machine if a collision appears imminent. Select "Resume" to continue. [U-302-02])
o103 endif

;check probe in starting position
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0
o104 if [#5399 EQ -1]
    (abort, ATCI:1|Utility Aborted|The Stud-Finder must be pre-triggered to start the utility. Jog the spindle until the sensor is ~1mm above pull-stud and the indicator LED is on, then try again. [A-302-03])
o104 endif

(print, Disabling safe keepouts...)
M960 P0
G4 P0.1

;Begin Probing Sequence
(print, ATCI:0|Machine Movement Caution|The machine is about to perform an automated routine to determine rack position. Please be ready to E-stop the machine if a collision appears imminent. Select "Resume" to continue. [U-302-01])
M0

;Initialize staring position for determining Z height offset when probing x and y
G4 P0
#<startX> = #<_abs_x>
#<startY> = #<_abs_y>
#<startZ> = #<_abs_z>
G4 P0

;Probe First Pull-stud
G65 P510

;Retain user positioned sensor z offset to maintain consistency of probing (0.8X original touchoff travel distance to avoid crashing probe into pull-stud)
#<_ZPrbSensitivity> = [0.8 * ABS[#<_ZPrb> - #<startZ>]]

;rough position over second pullstud based on tool offset spacing
(print, ATCI:0|Pull-Stud Position Found|The machine will now move to the next position in the sequence. Please be ready to E-stop the machine if a collision appears imminent. Select "Resume" to continue. [U-302-02])
M0

G4 P0
G1 G53 Z0 F6000
G1 G91 X[-1 * 90 * 5] F6000
G1 G53 Z[-60] F1000

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

;Probe Z Pos
#<currI> = 0
G1 G53 Z[#<_ZPrb> + #<_xBKOff>] F500
G4 P0
o105 do
    G1 G91 Z[-1 * #<_fineStep>] F500
    M66 P[#<_tc_input_th>] L4 Q0.01
    #<currI> = [#<currI> + 1]
G4 P0
o105 while[[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_fineStep>] + 5]]]

o106 if [#5399 NE 0]
    (abort, ATCI:1|Pull-Stud Not Found|The sensor could not find the next pull-stud. Please ensure a tool holder is in the slot and the rack is parallel to the machine, then try again. Alternatively, consult the Troubleshooting Guide. [A-302-04])
o106 endif

;Set z height to position roughtly above stud as the starting position before probing occurred to maintain sensor consistency
G4 P0
G1 G91 Z[-1 * #<_ZPrbSensitivity>] F100
G4 P0

;Probe Second Stud
G65 P510

#<rack2expX> = [#<_XPrb> - 90]
#<rack2expY> = #<_YPrb>
#<rack2expZ> = #<_ZPrb>

o107 if [#<rackMode> EQ 0]
    (print, Rack Mode 0 detected, setting offsets...)

o107 elseif [#<rackMode> EQ 1]
    (print, Rack Mode 1 detected, continuing to probe second rack position...)
    (print, ATCI:0|Pull-Stud Position Found|The machine will now move to the next position in the sequence. Please be ready to E-stop the machine if a collision appears imminent. Select "Resume" to continue. [U-302-02])
    M0
    G4 P0
    ;Move to next PS
    ;rough position over 3rd pullstud based on tool offset spacing
    G1 G53 Z0 F6000
    G1 G91 X[-90] F6000
    G1 G53 Z[-70] F1000
    
    ;Free pinstate before probing
    G4 P0
    M66 P[#<_tc_input_th>] L4 Q0.01
    G4 P0

    #<currI> = 0

    ;Probe Z Pos
    G1 G53 Z[#<_ZPrb> + #<_xBKOff>] F500
    G4 P0
    o201 do
        G1 G91 Z[-1 * #<_fineStep>] F500
        M66 P[#<_tc_input_th>] L4 Q0.01
        #<currI> = [#<currI> + 1]
        G4 P0
    o201 while[[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_fineStep>] + 5]]]

    o202 if [#5399 NE 0]
        (abort, ATCI:1|Pull-Stud Not Found|The sensor could not find the next pull-stud. Please ensure a tool holder is in the slot and the rack is parallel to the machine, then try again. Alternatively, consult the Troubleshooting Guide. [A-302-04])
    o202 endif

    ;Set z height to position roughtly above stud as the starting position before probing occurred to maintain sensor consistency
    G4 P0
    G1 G91 Z[-1 * #<_ZPrbSensitivity>] F100
    G4 P0

    ;Probe 3rd Stud
    G65 P510

    ;Check Second Rack Mounting Alignment
    o203 if [[ABS[#<_XPrb> - #<rack2expX>] GT 2] OR [ABS[#<_YPrb> - #<rack2expY>] GT 2] OR [ABS[#<_ZPrb> - #<rack2expZ>] GT 2]]
        (abort, ATCI:1|Rack Alignment Error|The second rack is not in the expected position. Please ensure both racks are lined up side-by-side with no gap between them, then try again. Alternatively, consult Troubleshooting Guide. [A-302-05])
    o203 endif

    ;Rough position over 4th pullstud based on tool offset spacing
    (print, ATCI:0|Pull-Stud Position Found|The machine will now move to the next position in the sequence. Please be ready to E-stop the machine if a collision appears imminent. Select "Resume" to continue. [U-302-02])
    M0

    G4 P0
    G1 G53 Z0 F6000
    G1 G91 X[-1 * 90 * 5] F6000
    G1 G53 Z[-70] F1000

    ;Free pinstate before probing
    G4 P0
    M66 P[#<_tc_input_th>] L4 Q0.01
    G4 P0

    ;Probe Z Pos
    #<currI> = 0
    G1 G53 Z[#<_ZPrb> + #<_xBKOff>] F500
    G4 P0
    o204 do
        G1 G91 Z[-1 * #<_fineStep>] F500
        M66 P[#<_tc_input_th>] L4 Q0.01
        #<currI> = [#<currI> + 1]
        G4 P0
    o204 while[[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_fineStep>] + 5]]]

    o205 if [#5399 NE 0]
        (abort, ATCI:1|Pull-Stud Not Found|The sensor could not find the next pull-stud. Please ensure a tool holder is in the slot and the rack is parallel to the machine, then try again. Alternatively, consult the Troubleshooting Guide. [A-302-04])
    o205 endif

    ;Set z height to position roughtly above stud as the starting position before probing occurred to maintain sensor consistency
    G4 P0
    G1 G91 Z[-1 * #<_ZPrbSensitivity>] F100
    G4 P0

    ;Probe 4th Stud
    G65 P510

o107 endif

;Set Offsets
G10 L2 P7 X[#<_XPrb>] Y[#<_YPrb> + #<probeYOffset>] Z[#<_ZPrb> + #<probeZOffset>] 
G4 P0

(print, ATCI:1|Rack Position Found|Rack position found and rack alignment verified. Select "OK" to home the machine and proceed to the next step. Recorded Rack Coordinates X:#5341 Y:#5342 Z:#5343 [U-302-03])
M0

;Return units to inch if previously set
o201 if [#<setUnits> EQ 1]
    G20
o201 endif

(print, PROBE MACRO COMPLETE)

;Move to safe home position
(print, Moving to safe home position...)
$H
(print, ATCI|rack_set:1)
;End of Macro
M99`;

export const P506Content = `; This is a helper function for moving to safe position from inside the keepout

; Update and validate TLS / safe location
G65 P512

G53 G0 Z[#<_tc_safe_z>]
G53 G0 Y[#<_tc_y_pulloff>]
G53 G0 X[#<_tc_safe_x>]
G53 G0 Y[#<_tc_safe_y>]
G4 P0;`;

export const P900Content = `; P900 Remove tool from spindle nose
; Logically equivalent to unloading any tool with an off rack procedure
(debug, Running P900 - Remove tool from nose)

; All Validation handled by TC.macro

#1003 = 1;
M6T0;
#1003 = 0;`;

export const P502Content = `; This is a helper function to check rack sync

(debug, Running helper function P502 for checking tool number - spindle synchronization)

M66 P[#<_tc_input_tis>] L4 Q0.5
o100 if [[#5399] EQ -1]
  o101 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tool_table_size>]
    (print, ATCI:0|Tool Mismatch Detected|No tool detected in spindle, but Tool #<active_tool> is active in software. Select "Resume" to set the spindle to "Empty" and continue. [U-502-01])
    M0
    M61 Q[#<_empty_tool>]
    G49
  o101 endif
o100 else
  o102 if [#<_current_tool> EQ 0]
    (print, ATCI:0|Unexpected Tool in Spindle|A tool is detected, but the software indicates the spindle should be empty. Select "Resume" to raise the Z-axis, allowing you to remove the tool and re-sync spindle states. [U-502-02])
    M0
    G53 G0 Z[#<_tc_safe_z>]
    
    ; Move to off rack tool load / unload position
    o103 do
      (print, ATCI:0|Unload Tool|Please use the physical release button on the ATC to remove the tool. Once the spindle is empty, select "Resume" to continue. [U-502-03])
      G4P0
      M64 P[#<_tc_output_bt>]
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4P0.1
    o103 while [[#5399] EQ -1]
    M65 P[#<_tc_output_bt>]
    M61 Q[#<_empty_tool>]
    G49
  o102 endif
o100 endif
M99;`;

export const P500Content = `; This is a helper function to probe the currently installed tool and reapply any new tool offsets.
; If called without an argument, it will overwrite the existing tool offset
; If called with an argument of Q1, it will check the currently stored offset against the tool table.

#<_probe_mode> = #17

; Update and validate TLS / safe location
G65 P512

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
G0 G91 Z[#<_tc_retract_dist>]
G38.2 G91 Z[#<_tc_set_dist>] F[#<_tc_set_feed>]
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
        (print, ATCI:0|Tool Length Error|The measured tool length differs from the recorded value by more than #<_check_tl_error>mm. Check for breakage or tooling change. "Resume" to probe a new offset, or "Reset" to stop the program. [U-500-01])
        M0
        ;Reprobe offset, recursive call has race condition issues so using a while loop instead
        ; Touch-off
        ;Move to tool length sensor
        G53 G0 Z[#<_tc_safe_z>]
        G53 G0 X[#<_tc_measure_x>]
        G53 G0 Y[#<_tc_measure_y>]
        G53 G0 Z[#<_tc_measure_start_z>]
        G38.2 G91 Z[#<_tc_seek_dist>] F[#<_tc_seek_feed>]
        G0 G91 Z[#<_tc_retract_dist>]
        G38.2 G91 Z[#<_tc_set_dist>] F[#<_tc_set_feed>]
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
G53 G0 Z[#<_tc_safe_z>]`;

export const P509Content = `; This is a helper function to check if P200.macro is loaded successfully.
; #1001 is set to 1 when the parameters in P200 is set.

G4 P0;
o100 if [#1001 NE 1]
  o110 if [EXISTS[#<_initializing>] NE 1]
    (abort, ATCI:2|Tool Change Aborted|The tool Changer is disabled due to unresolved ATC errors. Home the machine to reset the ATC, resolve any errors shown and try again. [A-509-01])
  o110 else
    (abort, ATCI:1|ATC Setup Aborted|The ATC setup macro P200.macro is missing or is corrupted. Return to ATC Setup and reload the macro files and try again. [A-509-02])
  o110 endif
o100 endif
G4 P0;
`;

export const P508Content = `; This is a helper function to check if the machine has been homed.

G4 P0;
o100 if [#<_homed_state> NE 1]
  (abort, ATCI:2|Tool Change Aborted|Machine is not homed. Please home your machine and try again. [A-508-01])
o100 endif
G4 P0;
`;

export const P510Content = `;=======================================================================================
;This is a helper macro for probing a single pull-stud for the probe utility P302.macro
;=======================================================================================
;Must run after completion of the ATC initialization macro P200.macro and the probing P302.macro
;requires machine to be homed and probe to be in starting position above pull-stud with #<_tc_input_th> High

;Probe First Stud
(print, Running Probe Subroutine)
;initialize local variables
#<currI> = 0
#<currJ> = 0
#<y_prb> = #<_NAN>
#<x_prb_R> = #<_NAN>
#<x_prb_L> = #<_NAN>
#<z_prb> = #<_NAN>
#<xDiam> = #<_NAN>
#<xCent> = #<_NAN>
#<xMax> = #<_NAN>
#<xMaxY> = #<_NAN>
#<xLast> = #<_NAN>
#<foundXMax> = #<_NAN>
G4 P0.2

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

;Move out of pullstud boundary in pos y dir until sensor reads low
o201 do
    G4 P0
    G1 G91 Y[#<_roughStep>] F6000
    M66 P[#<_tc_input_th>] L4 Q0.01
    G4 P0
o201 while[#5399 EQ 0]

;=================Probe first Pull-stud=====================
;Back-off from pull-stud
G4 P0
G1 G91 X[#<_xBKOff> + [#<_studDiam> / 2]] Y[#<_yBKOff>] F2000

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

;Find First Stud Y pos rough search
o202 while [[#5399 NE 0] AND [#<currJ> LT [[#<_yBKOff> / #<_roughStep>] + 5]]]
    o301 do
        G1 G91 X[-1 * #<_roughStep>] F6000
        M66 P[#<_tc_input_th>] L4 Q0.01
        #<currI> = [#<currI> + 1]
        G4 P0
    o301 while  [[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_roughStep>] + 10]]]
    o302 if [#5399 EQ 0]
        #<y_prb> = #<_abs_y>
        o202 break
    o302 endif
    G1 G91 X[#<_roughStep> * #<currI>] F6000
    G1 G91 Y[-1 * #<_roughStep>]
    #<currJ> = [#<currJ> + 1]
    #<currI> = 0
o202 endwhile

o203 if [#5399 NE 0]
    #<y_prb> = #<_NAN>
    (abort, ATCI:1|Center of Pull-Stud not Found|The sensor did not find the center of the pull-stud. Move the sensor closer to the top of the pull-stud and try again. Alternatively, consult the Troubleshooting Guide. [A-510-01])
o203 endif

;Do fine search
G4 P0
G1 G91 X[#<_xBKOff>] Y[#<_roughStep>] F3000

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

o204 while [[#5399 NE 0] AND [#<currJ> LT [[#<_yBKOff> / #<_fineStep>] + 5]]]
    o301 do
        G1 G91 X[-1 * #<_fineStep>] F3000
        M66 P[#<_tc_input_th>] L4 Q0.01
        #<currI> = [#<currI> + 1]
        G4 P0
    o301 while  [[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_fineStep>] + 5]]]
    o302 if [#5399 EQ 0]
        #<y_prb> = #<_abs_y>
        o204 break
    o302 endif
    G1 G91 X[#<_fineStep> * #<currI>] F3000
    G1 G91 Y[-1 * #<_fineStep>]
    #<currJ> = [#<currJ> + 1]
    #<currI> = 0
o204 endwhile

o205 if [#5399 NE 0]
    (print, #<currI> #<currJ>)
    ;return y_prb to null state to prevent garbage value being set (Unused but may want to check later)
    #<y_prb> = #<_NAN>
    (abort, ATCI:1|Center of Pull-Stud not Found|The sensor did not find the center of the pull-stud. Move the sensor closer to the top of the pull-stud and try again. Alternatively, consult the Troubleshooting Guide. [A-510-01])
o205 endif

(print, Front Y Probe Success: #<y_prb>)

;Find First Stud X Pos
G4 P0
G1 G91 X[[#<_studDiam> / 2] + #<_xBKOff>] Y[-1 * [#<_studDiam> / 3]] F6000

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

;Find Y Centerline
#<currI> = 0
o206 do
    o301 do
        G4 P0
        G1 G91 X[-1 * #<_fineStep>] F3000
        M66 P[#<_tc_input_th>] L4 Q0.01
        #<currI> = [#<currI> + 1]
        G4 P0
    o301 while [[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_fineStep>] + 40]]]

    o302 if [#5399 NE 0]
        (abort, ATCI:1|Center of Pull-Stud not Found|The sensor did not find the center of the pull-stud. Move the sensor closer to the top of the pull-stud and try again. Alternatively, consult the Troubleshooting Guide. [A-510-01])
        M99
    o302 elseif [#5399 EQ 0]
        o401 if [[[#<xLast> - #<_abs_x>] GT 0.05] AND [[#<xLast> - #<_abs_x>] LE 0.5]]
            #<foundXMax> = 1
            o206 break
        o401 elseif [[#<xLast> - #<_abs_x>] LE 0.05]
            #<xLast> = #<_abs_x>
            #<foundXMax> = 0
        o401 endif
        o402 if [#<_abs_x> GT #<xMax>]
            #<xMax> = #<_abs_x>
            #<xMaxY> = #<_abs_y>
        o402 endif
    o302 endif
    G4 P0
    G1 G91 X[#<_fineStep> * #<currI>] F3000
    G1 G91 Y[-1 * #<_fineStep>] F3000
    M66 P[#<_tc_input_th>] L4 Q0.01
    G4 P0
    #<currI> = 0
o206 while[#<foundXMax> LT 1]

;Find X Centerline
#<x_prb_R> = #<xMax>
G4 P0
G1 G91 Z[#<_xBKOff>] F3000
G1 G91 X[-1 * #<_studDiam> - #<_xBKOff> - 3] F3000
G1 G53 Y[#<xMaxY>] F3000
G1 G91 Z[-1 * #<_xBKOff>] F1000

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

#<currI> = 0
o207 do
    G1 G91 X[#<_fineStep>] F3000
    M66 P[#<_tc_input_th>] L4 Q0.01
    #<currI> = [#<currI> + 1]
    G4 P0
o207 while[[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_fineStep>] + 40]]]

o208 if [#5399 NE 0]
    (abort, ATCI:1|Center of Pull-Stud not Found|The sensor did not find the center of the pull-stud. Move the sensor closer to the top of the pull-stud and try again. Alternatively, consult the Troubleshooting Guide. [A-510-01])
    M99
o208 endif

G4 P0
#<x_prb_L> = #<_abs_x>
G4 P0

;Find stud diameter
#<xDiam> = [ABS[#<x_prb_R> - #<x_prb_L>]]
#<xCent> = [[#<x_prb_L> + #<x_prb_R>] / 2]

(print, X1 diam: #<xDiam>)
(print, X1 CL: #<xCent>)

;Reprobe Front Y position
G4 P0
G1 G53 Y[#<y_prb> + #<_yBKOff>] F6000
G1 G53 X[#<xCent>] F6000

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

#<currI> = 0
o209 do
    G1 G91 Y[-1 * #<_fineStep>] F3000
    M66 P[#<_tc_input_th>] L4 Q0.01
    #<currI> = [#<currI> + 1]
    G4 P0
o209 while[[#5399 NE 0] AND [#<currI> LT [[#<_yBKOff> / #<_fineStep>] + 5]]]

o210 if [#5399 NE 0]
    (abort, ATCI:1|Center of Pull-Stud not Found|The sensor did not find the center of the pull-stud. Move the sensor closer to the top of the pull-stud and try again. Alternatively, consult the Troubleshooting Guide. [A-510-01])
o210 endif

#<_XPrb> = #<xCent>

;Calculate Exponential Moving Average between old Y and latest Y CP (e = 0.4 from literature for best appx weighting)
o212 if [#<_YPrb> EQ #<_NAN>]
    ;initialize first Y probe value
    #<_YPrb> = [#<_abs_y> - [#<xDiam> / 2]]
o212 else
    #<_YPrb> = [#<_YPrb> + [0.4 * [[#<_abs_y> - [#<xDiam> / 2]] - #<_YPrb>]]]
o212 endif

;Z probe
G4 P0
G1 G91 Z[#<_xBKOff>] F3000
G1 G53 X[#<xCent>] Y[#<_abs_y> - [#<xDiam> / 2]] F3000

;Free pinstate before probing
G4 P0
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P0

#<currI> = 0
o213 do
    G1 G91 Z[-1 * #<_fineStep>] F1000
    M66 P[#<_tc_input_th>] L4 Q0.01
    #<currI> = [#<currI> + 1]
    G4 P0
o213 while[[#5399 NE 0] AND [#<currI> LT [[#<_xBKOff> / #<_fineStep>] + 5]]]

o214 if [#5399 NE 0]
    (abort, ATCI:1|Center of Pull-Stud not Found|The sensor did not find the center of the pull-stud. Move the sensor closer to the top of the pull-stud and try again. Alternatively, consult the Troubleshooting Guide. [A-510-01])
o214 endif

;Calculate EMA between old Z and latest Z (e = 0.4 from literature for best appx weighting)

o215 if [#<_ZPrb> EQ #<_NAN>]
    ;initialize first Z probe value
    (print, First Z init)
    #<_ZPrb> = #<_abs_z>
o215 else
    (print, Averaging Z)
    #<_ZPrb> = [#<_ZPrb> + [0.4 * [#<_abs_z> - #<_ZPrb>]]]
    (print, new z #<_ZPrb>)
o215 endif
G4 P0

(print, Stud Pos: #<_XPrb>, #<_YPrb>, #<_ZPrb>)

;Free Pinstate after subroutine completion to prevent probing error or controller hang on next probe.
M66 P[#<_tc_input_th>] L4 Q0.01
G4 P2

(print, End of Subroutine)`;

export const P512Content = `; This is a helper function to update and validate TLS and safe location

; X and Y machine coordinate positions of the tool setter.
#<_tc_measure_x> = #5381
(debug, Tool Measure X: #<_tc_measure_x>, from G59.3)
#<_tc_measure_y> = #5382
(debug, Tool Measure Y: #<_tc_measure_y>, from G59.3)

#<_tc_safe_x> = #5381 ; X coordinate should be identical to the TLS
(debug, Safe Position: X#<_tc_safe_x> Y#<_tc_safe_y>)`;

export const P301Content = `; ************ DESCRIPTION ************
; Picks up tool QX and probes it
; If it is an in rack tool, allow the rack to be empty
; If it is an off rack tool, user must insert a tool

; Local variables
#<_301_tool_cache> = #17;

; ************ BEGIN VALIDATION ************
;Check initializing
G65P507;

;Check homed state
G65P508;

; Check tool changer parameters
G65P509;

;Check pressure with helper function
G65 P501

; ************ PAUSE VALIDATION ************

; ************ BEGIN SETUP ************

; Turn off spindle and coolant
M5
M9
(debug, Spindle and coolant turned off)

; Record current units
o210 if [#<_metric> EQ 0]
  #<_tc_return_units_301> = 20
o210 else
  #<_tc_return_units_301> = 21
o210 endif
(debug, Units recorded)

; Force metric
G21 G90
(debug, Change to metric mode)

; Record starting position, this process need to be done here since restore position is disabled in TC.macro as part of probe mode.
#<_tc_start_x_301> =  #<_abs_x>
#<_tc_start_y_301> =  #<_abs_y>
#<_tc_start_z_301> = #<_abs_z>
(debug, Absolute position before tool change: #<_tc_start_x_301>, #<_tc_start_y_301>, #<_tc_start_z_301>)

; Feed override Off
M50 P0

; *************** END SETUP ****************

; *************** CONTINUE VALIDATION ****************
; Movements based validation (i.e. checks that may involve movement)

; Check rack sync with helper function
G65 P502
; *************** END VALIDATION ****************

; *************** STAGING ****************

;Move to safe position
(debug, Moving to safe position)
G65 P504

; *************** END STAGING ****************

; ************ BEGIN TOOL CHANGE ************
#1002 = 1
M6T[#<_301_tool_cache>]
#1002 = 0 ;Reset if tool change was not required

(debug, Tool Change Complete)
o200 if [#<_current_tool> EQ #<_301_tool_cache>]
    (debug, tool change successful, probing current tool)
    G65P500
o200 else
    (debug, tool change unsuccessful, offset cleared)
    G10 L1 P[#<_301_tool_cache>] Z0
    ;TODO Add retry option
    (abort, ATCI:2|Probing Aborted|Tool #<selected_tool_cache> could not be loaded. Rack slot is empty or out of reach. Ensure the tool is in the correct slot and verify your rack position settings. [A-301-01])
o200 endif

; ************ BEGIN RESTORE MODAL ************
; xxxxxxxx RESTORE POSITION xxxxxxxx
; Move to safe Z
G53 G0 Z[#<_tc_safe_z>]

; Go to safe position
G53 G0 X[#<_tc_safe_x>]
G53 G0 Y[#<_tc_safe_y>]

; Check target position > safe
o300 if [#<_tc_start_y_301> GE #<_tc_safe_y>]
  G53 G0 X[#<_tc_start_x_301>]
o300 endif

(debug, Reapplying start coordinates #<_tc_start_x_301>, #<_tc_start_y_301>)
G53 G0 X[#<_tc_start_x_301>] Y[#<_tc_start_y_301>]

; xxxxxxxx RESTORE UNITS xxxxxxxx
(debug, Reapplying units #<_tc_return_units_301>)
G[#<_tc_return_units_301>]

; xxxxxxxx RESTORE FEED OVERRIDE xxxxxxxx
;Restore feed override
M50 P1

; ************ END RESTORE MODAL ************
M99;`;

export const P511Content = `; This is a helper function to update and validate off rack tool location

; The X and Y machine coordinate positions for loading off rack tools
#<_tc_off_rack_x> = #5361
(debug, Off rack X: #<_tc_off_rack_x>, from G59.2)
#<_tc_off_rack_y> = #5362
(debug, Off rack Y: #<_tc_off_rack_y>, from G59.2)

`;

export const P999Content = `; This is the firmware configuration file that governs the application of firmware values required to operate the Sienci ATC system.
; Asterisks (*) indicate non ATC specific firmware settings

; ******** INITIALIZING ********
; Flag to indicate initialization, will skip all error checking and prevent unintentional code execution for the current session.
#<_initializing> = 1;

; ******** TOOL CHANGER SETTINGS ********
; xxxxxxxx GENERAL CONFIG xxxxxxxx
(print, Applying tool changer settings)
$485 = 1;       Keep tool number over reboot
$675 = 3;       Execute M6T0 and Fail M6 if tc.macro is not found

; xxxxxxxx PIN CONFIG xxxxxxxx
$370 = 0;       Invert I/O Port inputs (TODO: Not override unrrelated bitfields)
$372 = 1;       Invert I/O Port outputs (TODO: Not override unrrelated bitfields)

$750 = 7;       Event 1 trigger: Spindle at speed
$751 = 0;       Event 2 trigger: M62 - M65 only
$752 = 0;       Event 3 trigger: M62 - M65 only

$760 = 0;       Event 1 port
$761 = 1;       Event 2 port
$762 = 2;       Event 3 port

; ******** HOMING SETTINGS ********
$44 = 4;        Primary Homing Move
$45 = 1;        Secondary Homing Move
$46 = 2;        Tertiary Homing Move

; ******** TOOL PROBE SETTINGS ********

; ******** SD CARD SETTINGS ********
(print, Applying SD settings)
$650 = 1;       Auto mount SD Card

; ******** COMMUNICATIONS SETTINGS ********
(print, Applying communications settings)
$534 = 1;       Output NGC debug message

; ******** OTHER SETTINGS ********
(print, Applying other settings)
$676 = 3;       On reset, clear homed status if position was lost and clear offsets

; ******** REFRESH ********
(print, Refreshing Firmware Settings)
G4P0;
$$
G4P0;

; ******** STARTUP RELATED SETTINGS ********
(print, Applying startup related settings)
$N1=G65P100
G4P0.5
$N0=G65P200
G4P0.5

; ******** APPLY MANUAL TOOL CHANGE OFFSET ********
G65P1Q130
#<manual_x_pos> = [#<_value> - 50]
G65P1Q131
#<manual_y_pos> = [-0.4 * #<_value>]

G10 L2 P8 X[#<manual_x_pos>] Y[#<manual_y_pos>] Z0

(print, Default manual tool change position set to X: #<manual_x_pos> | Y: #<manual_y_pos> | Z: 0)

; ******** CLEAR SPINDLE NOSE ********
; Check tool changer setup
G65 P509;

;TODO Clear spindle nose
M66 P[#<_tc_input_tis>] L4 Q0.05
o200 if [[#5399] NE -1]
    o201 do
        (print, ATCI:0|Spindle Must Be Empty During Setup|Press the physical tool release button on the ATC to remove the tool. Once the spindle is empty, select "Resume" to continue. [U-999-01])
        G4P0
        M64 P[#<_tc_output_bt>]
        M0
        M66 P[#<_tc_input_tis>] L4 Q0.05
    o201 while [[#5399] NE -1]
    M65 P[#<_tc_output_bt>]
o200 endif

M61 Q[#<_empty_tool>]
G49

; ******** CHECK RACK CONFIGURATION ********
; Check for rack configuration mis-match
M66 P[#<_tc_input_rack>] L4 Q0.01
o300 if [#5399 NE -1 AND #<_tc_slots> LE 0]
    (print, ATCI:1|Unconfigured Rack Detected|The rack sensor is active, but no rack is configured. Return to the previous page and select a configuration with a rack, or remove the rack and try again. [W-999-01])
o300 endif

M99`;

export const P501Content = `; This is a helper function to check air pressure

(debug, Running helper function P501 for pressure checking)

o100 if [#<_pres_sense> EQ 1]
  M66 P[#<_tc_input_pres>] L4 Q0.01
  G4P0.1
  o101 while [#5399 EQ -1]
    G4P0
    (print, ATCI:0|System Pressure Below 82psi|Please check your compressor and regulator settings. Once pressure is restored, select "Resume" to clear this error. [U-501-01])
    G4P0
    M0
    M66 P[#<_tc_input_pres>] L4 Q0.01
    G4P0.1
  o101 endwhile
o100 endif

M99;`;

export const P504Content = `; This is a helper function for moving to safe position from outside the keepout
; May be turned into a osub call in the future
#<direct> = #17

; Update and validate TLS / safe location
G65 P512

G53 G0 Z[#<_tc_safe_z>]

; Check current position > safe
o100 if [#<_abs_y> GE #<_tc_safe_y> AND #<direct> NE 1]
    ; Current position adjacent to rack
    G53 G0 Y[#<_tc_safe_y>]
o100 endif

G53 G0 X[#<_tc_safe_x>] Y[#<_tc_safe_y>]
G4 P0;`;

export const P503Content = `;Rack probing helper
;Pre-positions spindle tool sensor above right-most pullstud to help users during rack mounting and for probing rack offsets

#<setUnits> = -1

;=====================Pre-flight checks=====================
;Check homed state
G65 P508

(print, ATCI:1|Caution Keepouts will be disabled for macro|Wait for spindle and coolant shutoff ~6s...)
M0

;Disable keepouts
M810 P0

;Turn off all active spindles and stop coolant
(print, Turning Off Spindles and Coolant...)
M5 $-1
M9
G4 P0.1

;Set Units as MM
o100 if [#4006 EQ 20]
    ;if current is SAE then switch units for macro and retain flag for later
    (debug, Setting Units to MM for Macro will return once finished.)
    #<setUnits> = 1
    G21
o100 endif


(print, ATCI:0|Position Stud-Finder Sensor above right-most tool-rack position?)
M0

G4 P0
G1 G53 Z0 F6000
G4 P0

;1113.759,-8.947,-113.425,0.000 6 tool rack offset rough positioning
G1 G53 X[1113] Y[-8.5] F3000
G4 P0

(print, ATCI:0|Rough Position Set|Please fine-tune the position of the sensor until it is 1mm above the pull-stud and verify sensor light illuminates before probing rack position)
M0

o102 if [#<setUnits>]
    #<setUnits> = -1
    G20
o102 endif

M99`;

export const P901Content = `; P901 Load tool at spindle nose
(debug, Running P900 - Load tool at spindle nose)

; All Validation handled by TC.macro

; ************ VARIABLES ************
#<selected_tool_cache> = #17;

#1004 = 1;
M6T[#<selected_tool_cache>];
#1004 = 0;`;

export const P300Content = `; ************ DESCRIPTION ************
; Probe all tools in the rack

; Local variables
#<_current_slot> = 1;

; ************ BEGIN VALIDATION ************

;Check initializing
G65P507;

;Check homed state
G65P508;

; Check tool changer parameters
G65P509;

; Check rack size
G4 P0
o100 if [#<_tc_slots> EQ 0]
  (abort, ATCI:1|Probing Aborted|No rack is configured. Please run ATC Setup to configure your rack and try again. [A-300-01])
o100 endif
G4 P0
; Check offset mode
o101 if [#<_irt_offset_mode> EQ 0]
  (abort, ATCI:1|Probing Aborted|The system is set to "Probe on Load." Tools will be automatically measured the first time they are picked up from the rack. Go to "ATC Options" if you prefer to probe all tools manually beforehand. [A-300-02])
o101 endif
G4 P0

; Check rack presence
M66 P[#<_tc_input_rack>] L4 Q0.01
o102 if [#5399 EQ -1]
  (abort, ATCI:1|Probing Aborted|The rack sensor does not detect a rack. Please ensure the tool rack is physically installed and the rack sensor is triggered, then trying again. [A-300-03])
o102 endif
G4 P0.1

;Check pressure with helper function
G65 P501

; ************ PAUSE VALIDATION ************

; ************ BEGIN SETUP ************

; Turn off spindle and coolant
M5
M9
(debug, Spindle and coolant turned off)

; Record current units
o210 if [#<_metric> EQ 0]
  #<_tc_return_units_300> = 20
o210 else
  #<_tc_return_units_300> = 21
o210 endif
(debug, Units recorded)

; Force metric
G21 G90
(debug, Change to metric mode)

; Record starting position
#<_tc_start_x_300> =  #<_abs_x>
#<_tc_start_y_300> =  #<_abs_y>
#<_tc_start_z_300> = #<_abs_z>
(debug, Absolute position before tool change: #<_tc_start_x_300>, #<_tc_start_y_300>, #<_tc_start_z_300>)

; Feed override Off
M50 P0

; *************** END SETUP ****************

; *************** CONTINUE VALIDATION ****************
; Movements based validation (i.e. checks that may involve movement)

; Check rack sync with helper function
G65 P502
; *************** END VALIDATION ****************

; *************** STAGING ****************

;Move to safe position
(debug, Moving to safe position)
G65 P504

; *************** END STAGING ****************

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

; Empty the spindle nose
M6T0;

; ************ BEGIN RESTORE MODAL ************
; xxxxxxxx RESTORE POSITION xxxxxxxx
; Move to safe Z
G53 G0 Z[#<_tc_safe_z>]

; Go to safe position
G53 G0 X[#<_tc_safe_x>]
G53 G0 Y[#<_tc_safe_y>]

; xxxxxxxx RESTORE UNITS xxxxxxxx
(debug, Reapplying units #<_tc_return_units_300>)
G[#<_tc_return_units_300>]

; xxxxxxxx RESTORE FEED OVERRIDE xxxxxxxx
;Restore feed override
M50 P1

; ************ END RESTORE MODAL ************

M99;`;

export const P507Content = `; This is a helper function to check if the controller is initialized without a controller restart.
; The _initializing variable is set by P999.macro.

G4 P0;
o100 if [EXISTS[#<_initializing>] EQ 1]
  (abort, ATCI:2|Tool Change Aborted|Restart required after ATC Setup. Power cycle your controller to use the ATC. [A-507-01])
o100 endif
G4 P0;`;

export const P505Content = `; This is a helper function for moving to the off rack tool position
; May be turned into a osub call in the future
#<direct> = #17

; Update and validate off rack position
G65 P511

G53 G0 Z[#<_tc_safe_z>]

; Check current position > safe
o100 if [#<_abs_y> GE #<_tc_safe_y> AND #<direct> NE 1]
    ; Current position adjacent to rack
    G53 G0 Y[#<_tc_safe_y>]
o100 endif

; Check target position > safe
o200 if [#<_tc_off_rack_y> GE #<_tc_safe_y> AND #<direct> NE 1]
    G53 G0 X[#<_tc_off_rack_x>]
o200 endif

; If both positions are < safe, direct movement
G53 G0 X[#<_tc_off_rack_x>] Y[#<_tc_off_rack_y>]
G4 P0;`;

export const TCContent = `;if 1002 is active, set probing to 1
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
#<force_manual_unload> = 0;
#<force_manual_load> = 0;
#<unload_mode> = 0;
#<load_mode> = 0
#<passthrough> = 1;
#<unload_offset_mode> = 0
#<load_offset_mode> = 0
#<selected_tool_cache> = #<_selected_tool>; Caching selected tool variable as M61 will clear this variable when changing current tool to 0 between tool unload and tool load.

; ************ BEGIN VALIDATION ************

; Check if tool changing as part of a probe cycle
o130 if [#1002 EQ 1]
  (debug, Mode: Probing)
  #1002 = 0
  #<probing> = 1
o130 else
  (debug, Mode: Normal)
o130 endif

; Check if tool unload is to be performed manually regardless of rack status
o131 if [#1003 EQ 1]
  (debug, Forced Manual Tool Unload)
  #1003 = 0
  #<force_manual_unload> = 1
o131 endif

; Check if tool load is to be performed manually regardless of rack status
o132 if [#1004 EQ 1]
  (debug, Forced Manual Tool Load)
  #1004 = 0
  #<force_manual_load> = 1
o132 endif

;Check initializing
G65P507;

;Check homed state
G65P508;

; Check tool changer parameters
G65P509;

; Check rack presence
M66 P[#<_tc_input_rack>] L4 Q0.01
o133 if [#5399 NE -1]
  ; Rack present
  ; Check for rack configuration mis-match
  o134 if [#<_tc_slots> LE 0]
    ;Unconfigured rack present, follow safe area movements to avoid crashing.
    #<passthrough> = 2;
  o134 else
    #<passthrough> = 0;
  o134 endif
o133 else
  ; Rack not present
  #<passthrough> = 1;
o133 endif

; Re-enable keepout unless rack is not present.
; Keepout is turned off with P200 at startup should rack size equal to 0 so there is no need to disable it here.
o135 if [#<passthrough> EQ 0]
  M960 P1;
  (print, Keepout enabled)
o135 endif

; Check if tool unload should be skipped because an empty tool is selected, or if passthrough mode is on, or if forcing a manual unload
o140 if [#<_current_tool> EQ #<_empty_tool>]
  #<unload_mode> = -1
  (debug, Unload skipped)
o140 elseif [#<_current_tool> GT #<_tc_slots> OR #<force_manual_unload> EQ 1 OR #<passthrough> EQ 1]
  #<unload_mode> = 1
  (debug, Manual unload)
o140 else
  (debug, Rack unload)
o140 endif

; Check if tool load should be skipped because an empty tool is selected, or if passthrough mode is on, or if forcing a manual load
o141 if [#<selected_tool_cache> EQ #<_empty_tool>]
  #<load_mode> = -1
  (debug, Load skipped)
o141 elseif [#<selected_tool_cache> GT #<_tc_slots> OR #<force_manual_load> EQ 1 OR #<passthrough> EQ 1]
  #<load_mode> = 1
  (debug, Manual load)
o141 else
 (debug, Rack load)
o141 endif

; Check offset mode that applies
  ; Use off rack unload setting when tool exceeds slot size or during passthrough (and rack offset modes not forced)
  ; Use in rack setting otherwise
  ; when not in probe mode,
  ; when empty tool is not selected, 
  ; When probe new offset every time is not enforced


o160 if [#<_current_tool> GT #<_tc_slots> OR [#<_current_tool> LE #<_tc_slots> AND #<_current_tool> GT 0 AND #<passthrough> EQ 1 AND #<_passthrough_offset_setting> EQ 0]]
  #<unload_offset_mode> = #<_ort_offset_mode>
o160 else
  #<unload_offset_mode> = #<_irt_offset_mode>
o160 endif

o161 if [#<selected_tool_cache> GT #<_tc_slots> OR [#<selected_tool_cache> LE #<_tc_slots> AND #<selected_tool_cache> GT 0 AND #<passthrough> EQ 1 AND #<_passthrough_offset_setting> EQ 0]]
  #<load_offset_mode> = #<_ort_offset_mode>
o161 else
  #<load_offset_mode> = #<_irt_offset_mode>
o161 endif

;Force probing when user selected a tool without an offset
o170 if [#<probing> EQ 0 AND #<load_offset_mode> GT 0]
  G65 P2 Q[#<selected_tool_cache>] R2
  o171 if [#<_value> EQ 0]
    (print, ATCI:0|Tool #<selected_tool_cache> Offset Missing|"Resume" to probe the tool on pick-up, "Reset" if the slot is empty or the wrong tool was selected. [U-TCM-01])
    M0
    #<load_offset_mode> = 0
  o171 endif
o170 endif

;Check pressure with helper function
G65 P501

; ************ PAUSE VALIDATION ************

; ************ BEGIN SETUP ************

; Turn off spindle and coolant
M5
M9
(debug, Spindle and coolant turned off)

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

; Record starting position
#<tc_start_x> =  #<_abs_x>
#<tc_start_y> =  #<_abs_y>
#<tc_start_z> = #<_abs_z>
(debug, Absolute position before tool change: #<tc_start_x>, #<tc_start_y>, #<tc_start_z>)

; Feed override Off
M50 P0

; *************** END SETUP ****************

; *************** CONTINUE VALIDATION ****************
; Movements based validation

; Check rack sync with helper function
G65 P502
; *************** END VALIDATION ****************

; *************** POSITION STAGING (UNLOAD) ****************
; Conditionals identical to unload, just split out for clarity.
o300 if [#<unload_mode> EQ 0]
  ; Move to safe position
  G65 P504
  ; Disable keepout
  M960 P0;
  G4 P0;
  (debug, Disable keepout)
o300 elseif [#<unload_mode> EQ 1]
  ; Move to off rack position
  o310 if [[#<_tc_slots> EQ 0 AND #<passthrough> EQ 0] OR #<passthrough> EQ 1]
    G65 P505 Q1
  o310 else
    G65 P505 Q0
  o310 endif
o300 else
  ; Hold position
o300 endif

; *************** END POSITION STAGING (UNLOAD) ****************

; ************ BEGIN UNLOAD ************

o400 if [#<unload_mode> EQ 0]
  (debug, Unloading in rack tool)
  ; ************ MOTION BLOCK - UNLOAD IN RACK TOOL ************
    G53 G0 Z[#<_tc_safe_z>]
    G53 G0 Y[#<_tc_y_pulloff>]

    #<tc_x_unload> = [[[#<_current_tool> - 1] * #<_tc_slot_offset>] + #<_tc_slot_one_x>]
    #<tc_y_unload> = #<_tc_slot_one_y>

    ;Move to staging position for tool unload
    G53 G0 X[#<tc_x_unload>] Y[#<_tc_y_pulloff>]

    ; Tool holder check
    o410 if [#<_holder_sense> EQ 1]
      (debug, Checking tool presence for collision)
      G53 G0 Y[#<tc_y_unload> + #<_tc_holder_sense_offset_y>]
      G53 G0 Z[#<_tc_load_z> + #<_tc_holder_sense_offset_z> + #<_tc_holder_sense_seek_z>]
      
      #<current_probed_distance> = 0;
      o411 do
          M66 P0 L3 Q0.01
          G1 G91 Z-0.1 F100
          G90
          #<current_probed_distance> = [#<current_probed_distance> + 0.1]
          G4 P0
          ;Added a 0.1 since there seems to be some caching issue with the loop.
      o411 while [[#5399] NE -1 AND #<current_probed_distance> LT [#<_tc_holder_sense_seek_z>-0.1]]

      o412 if [#<current_probed_distance> EQ #<_tc_holder_sense_seek_z>]
        (debug, No tool in tool holder, safe to unload current tool.)
      o412 else
        ; Exit keepout and re-enable feed override
        G65 P506
        M50 P1
        ; TODO Add a retry loop
       (abort, ATCI:2|Tool Change Aborted|Slot #<_current_tool> in the rack is already occupied. Manually remove the tool from the rack at slot #<_current_tool> and try again. [A-TCM-02])
      o412 endif
      #<current_probe_offset> = 0;

      ;G53 G0 Z[#<_tc_safe_z>]
      G53 G0 Y[#<_tc_y_pulloff>]
    o410 endif

    ; Move to tool change location
    G53 G0 Z[#<_tc_load_z>]
    G53 G1 Y[#<tc_y_unload>] F[#<_tc_y_pulloff_feed>]
    G4 P0.5

    ; Release drawbar
    M64 P[#<_tc_output_db>]
    ; Allow for all air to vent in case there is residule pressure in the system
    G4 P0.8
    ; Verify drawbar release
    M66 P[#<_tc_input_db>] L4 Q0.5
    o420 if [[#5399] EQ -1]
      ;Close drawbar on error
      M65 P[#<_tc_output_db>]
      G53 G1 Y[#<_tc_y_pulloff>] F[#<_tc_y_pulloff_feed>]
      ; Exit keepout and re-enable feed override
      G65 P506
      M50 P1
      (abort, ATCI:2|Tool Change Aborted|Drawbar failed to engage. Check if the compressor is powered on, if there is sufficient air pressure, and inspect pneumatic lines for kinks or restrictions. [A-TCM-03])
    o420 endif

    ; Move away from tool rack
    G4 P0.2
    G53 G1 Z[#<_tc_load_z> + #<_tc_dedust_z_offset>] F[#<_tc_z_dedust_feed>]
    G4 P0
    ; Drawbar off
    M65 P[#<_tc_output_db>]
    G4 P0.5

    ; Check if tool is unloaded
    M66 P[#<_tc_input_tis>] L3 Q0.5
    o430 if [[#5399] EQ -1]
      ;TODO Add retry option
      G65 P506
      ; Exit keepout and re-enable feed override
      G65 P506
      M50 P1
      (abort, ATCI:2|Tool Change Aborted|Tool #<_current_tool> failed to release from the spindle. Refer to the Troubleshooting Guide to safely free the tool holder. Inspect tool forks for alignment or mechanical damage. [A-TCM-04])
    o430 endif

    ; Move to safe height
    G53 G0 Z[#<_tc_safe_z>]

o400 elseif [#<unload_mode> EQ 1]
  (debug, Unloading off rack tool)
    ; Pause as long as the tool is not removed
    o440 do
      G4 P0
      (print, ATCI:0|Action Required|Unload Tool #<_current_tool>|Please use the physical release button on the ATC to remove the tool. Once the spindle is empty, select "Resume" to continue. [U-TCM-02])
      G4 P0
      M64 P[#<_tc_output_bt>]
      M0
      M66 P[#<_tc_input_tis>] L3 Q0.05
      G4 P0.1
    o440 while [[#5399] EQ -1]
    M65 P[#<_tc_output_bt>]
o400 else
(debug, Unload skipped)
o400 endif

(debug, Unload Complete)

; ************ END UNLOAD ************

; ************ BEGIN TOOL LENGTH MANAGEMENT (UNLOAD) ************
; Scrub current tool offset when
; Not probing
; Not an empty tool
; Not using tool table
o500 if [#<probing> EQ 0 AND #<unload_mode> NE -1 AND #<unload_offset_mode> EQ 0]
  G10 L1 P[#<_current_tool>] Z0
o500 endif

M61 Q[#<_empty_tool>]
G4 P0
G49
(debug, Tool length offset cleared, vacant tool number applied)

; ************ END TOOL LENGTH MANAGEMENT (UNLOAD) ************

; *************** POSITION STAGING (LOAD) ****************
; Conditionals identical to unload, just split out for clarity.
o600 if [#<unload_mode> EQ 0]
  ; Unload happened in rack
  o610 if [#<load_mode> EQ 0]
    ; Load to happen in rack
    ; Hold position
  o610 elseif [#<load_mode> EQ 1]
    ; Load to happen off rack
    ; Exit rack
    G65 P506
    ; Re-enable keepout
    M960 P1;
    G4 P0;
    (debug, Enable keepout)
    ; Move to off rack position
    G65 P505
  o610 else
    ; Loading empty
    ; Exit rack
    G65 P506
    ; Re-enable keepout
    M960 P1;
    G4 P0;
    (debug, Enable keepout)
    ; Hold position
  o610 endif
o600 elseif [#<unload_mode> EQ 1]
  ; Unload happened off rack
  o620 if [#<load_mode> EQ 0]
    ; Load to happen in rack
    ; Move to safe position
    G65 P504
    ; Disable keepout
    M960 P0;
    G4 P0;
    (debug, Disable keepout)
  o620 elseif [#<load_mode> EQ 1]
    ; Load to happen off rack
    ; Hold position
  o620 else
    ; Loading empty
    ; Hold position
  o620 endif
o600 else
  ; Unloaded empty
  o630 if [#<load_mode> EQ 0]
    ; Load to happen in rack
    ; Move to safe position
    G65 P504
    ; Disable keepout
    M960 P0;
    G4 P0;
    (debug, Disable keepout)
  o630 elseif [#<load_mode> EQ 1]
    ; Load to happen off rack
    ; Move to off rack position
    ; Move to off rack position
    o631 if [[#<_tc_slots> EQ 0 AND #<passthrough> EQ 0] OR #<passthrough> EQ 1]
      G65 P505 Q1
    o631 else
      G65 P505 Q0
    o631 endif
  o630 else
    ; Loading empty
    ; Hold position
  o630 endif
o600 endif
; *************** END POSITION STAGING (LOAD) ****************

; ************ BEGIN LOAD ************

o700 if [#<load_mode> EQ 0]
  (debug, Loading in rack tool)
  ; ************ MOTION BLOCK - LOAD IN RACK TOOL ************
  ; Compute Load coordinates

  #<tc_x_load> = [[[#<selected_tool_cache> - 1] * #<_tc_slot_offset>] + #<_tc_slot_one_x>]
  #<tc_y_load> = #<_tc_slot_one_y>

  ; TODO Disable Keepout
  ; Go to load coordinates
  G53 G0 Z[#<_tc_safe_z>]
  G53 G0 Y[#<tc_y_load>]
  G53 G0 X[#<tc_x_load>]
  G53 G0 Z[#<_tc_load_z> + #<_tc_dedust_z_offset>]
  G4 P0.1

  ; Release drawbar
  M64 P[#<_tc_output_db>]
  ; Allow for all air to vent in case there is residule pressure in the system
  G4 P0.8
  ; Verify drawbar release
  M66 P[#<_tc_input_db>] L4 Q0.5
  o710 if [[#5399] EQ -1]
    ;Close drawbar on error
    M65 P[#<_tc_output_db>]
    ; Exit keepout and re-enable feed override
    G65 P506
    M50 P1
    (abort, ATCI:2|Tool change aborted|Drawbar did not engage, compressor system may be offline or under pressure. [A-TCM-03])
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
      ; Exit keepout and re-enable feed override
      G65 P506
      M50 P1
      ;TODO Add retry option
      (abort, ATCI:2|Tool Tool Change Aborted|Tool #<selected_tool_cache> could not be loaded. Rack slot is empty or out of reach. Ensure the tool is in the correct slot and verify your rack position settings. [A-TCM-05])
    o721 endif
  o720 else
    ;Tool change is successful, pulloff
    G53 G1 Y[#<_tc_y_pulloff>] F[#<_tc_y_pulloff_feed>]
    G53 G0 Z[#<_tc_safe_z>]
  o720 endif

o700 elseif [#<load_mode> EQ 1]
  (debug, Loading off rack tool)
  ; Pause as long as the tool is not removed
  o730 do
    G4 P0
    (print, ATCI:0|Load Tool #<_current_tool>|Press the physical tool release button on the ATC and insert the tool holder into the spindle. Once the tool is loaded, select "Resume" to continue. [U-TCM-03])
    G4 P0
    M64 P[#<_tc_output_bt>]
    M0
    M66 P[#<_tc_input_tis>] L4 Q0.05
    G4 P0.1
  o730 while [[#5399] EQ -1]
  M65 P[#<_tc_output_bt>]

o700 else
  (debug, Loading skipped)
o700 endif

; Change current tool number
M61 Q[#<selected_tool_cache>]
G4 P0

(debug, Load Complete)
; ************ END LOAD ************

; *************** POSITION STAGING (POST LOAD) ****************
o800 if [#<load_mode> EQ 0]
  ; Load happened in rack
  ; Exit rack
  ; TODO Refactor such that sequential probes with empty holder position do not require exit of tool rack.
  G65 P506
  ; Re-enable keepout
  M960 P1;
  G4 P0;
  (debug, Enable keepout)
o800 elseif [#<load_mode> EQ 1]
  ; Load happened off Rack
  ; Move to safe area if probing is required
  ; Move directly if rack does not exist or is not present
  ; Else hold position
  o810 if [#<probing> EQ 0 AND #<load_offset_mode> NE 1]
    o811 if [[#<_tc_slots> EQ 0 AND #<passthrough> EQ 0] OR #<passthrough> EQ 1]
      G65 P504 Q1
    o811 else
      G65 P504 Q0
    o811 endif
  o810 endif
o800 else
  ; Loaded empty
  ; Hold position
o800 endif

; *************** END POSITION STAGING (POST LOAD) ****************

; ************ BEGIN TOOL LENGTH MANAGEMENT (LOAD) ************

; Apply existing tool offset (if any), this will be used if compensation fails.
G43 H[#<_current_tool>]

; Execute probing if not part of a probing cycle and not loading an empty tool
; Probe when
; Not in probe mode
; Not loading an empty tool 
o900 if [#<probing> EQ 0 AND #<load_mode> NE -1]
  ; If offset mode is 0, probe
  ; If offset mode is 1, apply existing offset
  ; If offset mode is 2, check

  o910 if [#<load_offset_mode> EQ 0]
    G65 P500 Q0
    G65 P504
  o910 elseif [#<load_offset_mode> EQ 2]
    G65 P500 Q1
    G65 P504
  o910 endif
o900 endif
; ************ END TOOL LENGTH MANAGEMENT (LOAD) ************

; ************ BEGIN RESTORE MODAL ************

; xxxxxxxx RESTORE POSITION xxxxxxxx 
; User is at safe position or at off rack tool load position

;Ignore when M6 is triggered as part of a probing cycle
o1000 if [#<load_mode> NE -1 AND #<probing> EQ 0]
  ; Move to safe Z
  G53 G0 Z[#<_tc_safe_z>]

  o1010 if [[#<_tc_slots> EQ 0 AND #<passthrough> EQ 0] OR #<passthrough> EQ 1]
    ;Skip
  o1010 else
    ; Check current position > safe
    o1011 if [#<_abs_y> GE #<_tc_safe_y>]
      ; Current position adjacent to rack
      G53 G0 Y[#<_tc_safe_y>]
    o1011 endif

    ; Check target position > safe
    o1012 if [#<tc_start_y> GE #<_tc_safe_y>]
      G53 G0 X[#<tc_start_x>]
    o1012 endif
  o1010 endif
  
  ; Restore original position
  G53 G0 X[#<tc_start_x>]Y[#<tc_start_y>]

o1000 endif

; xxxxxxxx RESTORE UNITS xxxxxxxx
G[#<_tc_return_units>]
(debug, Reapplying units #<_tc_return_units>)

; xxxxxxxx RESTORE FEED OVERRIDE xxxxxxxx
;Restore feed override
M50 P1

; ************ END RESTORE MODAL ************

(debug, End tool change macro)
M99;`;

export const P200Content = `; ******** SYSTEMS SETUP ********
#<_min_vminor> = 260221
(debug, Minimum firmware version: #<_min_vminor>)

o100 if [#<_vminor> LT #<_min_vminor>]
  (abort, ATCI:1|Tool Changer Disabled|Controller firmware is out of date. Please update to version #<_min_vminor> or above and try again. [A-200-01])
o100 endif

; ******** BEGIN USER CONFIGURATION ********

; ******** BASIC SETUP ********

; The number of slots in your magazine. Defined in P100.macro, will abort if not defined.
;#<_tc_slots> = 6; Enable for Ad-hoc definition.

o101 if [[EXISTS[#<_tc_slots>]] EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|Setup parameter "_tc_slots" missing. Please run ATC Setup and try again. [A-200-03])
o101 endif
(debug, Slots: #<_tc_slots>)

; The number of slots in your tool table.
o102 if [#<_tool_table_size> EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|The "Tool Table" option is not enabled in the current controller firmware. Please flash the official firmware from Sienci Labs, or a custom build with the "Tool Table" option enabled. [A-200-02])
o102 endif

(debug, Table size: #<_tool_table_size>)

; ******** OFFSET BEHAVIOR SETUP ********
; On and Off Rack Offset Management Modes defined by variables #<_irt_offset_mode> and #<_ort_offset_mode>
; Passthrough mode offset management defined by variable #<_passthrough_offset_setting>
; Defined in P100.macro, will abort if not defined.

; 0: Always probe new offset
; 1: Always use tool table offset
; 2: Always use tool table offset and verify

;#<_irt_offset_mode> = 2; Enable for Ad-hoc definition.
;#<_ort_offset_mode> = 0; Enable for Ad-hoc definition.

; 0: Follow manual tools offset mode when rack is removed
; 1: Follow rack loaded tools offset mode when rack is removed
;#<_passthrough_offset_setting> = 0; Enable for Ad-hoc definition.

o103 if [[EXISTS[#<_irt_offset_mode>]] EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|Setup parameter "_irt_offset_mode" missing. Please run ATC Setup and try again. [A-200-04])
o103 elseif [[EXISTS[#<_ort_offset_mode>]] EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|Setup parameter "_ort_offset_mode" missing. Please run ATC Setup and try again. [A-200-05])
o103 elseif [[EXISTS[#<_passthrough_offset_setting>]] EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|Setup parameter "_passthrough_offset_setting" missing. Please run ATC Setup and try again. [A-200-06])
o103 endif

(debug, Offset Mode - Rack: #<_irt_offset_mode> | Manual: #<_ort_offset_mode> | Passthrough: #<_passthrough_offset_setting>)

; ******** COORDINATES SETUP ********

; ******** XY Axis ********
; The X and Y machine coordinate positions of slot 1.

;Check if slot location is valid
o104 if [[EXISTS[#<_initializing>] NE 1] AND [#<_tc_slots> GT 0] AND [#5341 EQ 0 OR #5342 EQ 0 OR #5343 GE 0]]
    M960 P0
  (abort, ATCI:1|Tool Changer Disabled|Rack position not set. Please run ATC Setup to define your rack position and try again. [A-200-10])
o104 endif

#<_tc_slot_one_x> = #5341
(debug, Slot 1 X: #<_tc_slot_one_x> from G59.1)
#<_tc_slot_one_y> = #5342
(debug, Slot 1 Y: #<_tc_slot_one_y> from G59.1)

; The slot offset for your rack. Defined by variables #<_tc_slot_offset>. Defined in P100.macro, will abort if not defined.

;#<_tc_slot_offset> = 90; Enable for Ad-hoc definition.
o105 if [[EXISTS[#<_tc_slot_offset>]] EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|Setup parameter "_tc_slot_offset" missing. Please run ATC Setup and try again. [A-200-07])
o105 endif
(debug, Slot Offset: #<_tc_slot_offset>)

; The X and Y machine coordinate positions for loading off rack tools
#<_tc_off_rack_x> = #5361
(debug, Off rack X: #<_tc_off_rack_x>, from G59.2)
#<_tc_off_rack_y> = #5362
(debug, Off rack Y: #<_tc_off_rack_y>, from G59.2)

; The X and Y machine coordinate positions for safely entering and exiting the keepout area
; TODO Refine the actual position

#<_tc_safe_x> = #5381 ; X coordinate should be identical to the TLS
#<_tc_safe_y> = -200    ; Fixed value for now, can update to dynamic value based on rack keepouts at a later date once we vetted reliability.
(debug, Safe Position: X#<_tc_safe_x> Y#<_tc_safe_y>)

; The Y machine coordinate positon for Y-axis pulloff.
#<_tc_y_pulloff> = [#<_tc_slot_one_y> + 44]
(debug, Pulloff Y: #<_tc_y_pulloff>)

; The feedrate for Y-axis pulloff.
#<_tc_y_pulloff_feed> = 1000
(debug, Pulloff Y Feedrate: #<_tc_y_pulloff_feed>)

; ******** Keepout ********
; The X and Y machine coordinate positions of slot 1.
#<shoe_width> = 120
#<fork_width> = 45
#<shoe_depth> = 60
#<fork_front_depth> = 30.5

#<keepout_x_min> = [#<_tc_slot_one_x> - #<shoe_width> / 2 - #<fork_width> / 2]
(print, Keepout X min: #<keepout_x_min>)
#<keepout_x_max> = [#<_tc_slot_one_x> + [#<_tc_slots> - 1] * #<_tc_slot_offset> + #<shoe_width> / 2 + #<fork_width> / 2]
(print, Keepout X max: #<keepout_x_max>)
#<keepout_y_min> = [#<_tc_slot_one_y> - #<fork_front_depth> - #<shoe_depth>]
(print, Keepout Y min: #<keepout_y_min>)
#<keepout_y_max> = 0
(print, Keepout Y max #<keepout_y_max>)

G65P1Q684S[#<keepout_x_min>]
G65P1Q686S[#<keepout_x_max>]
G65P1Q685S[#<keepout_y_min>]
G65P1Q687S[#<keepout_y_max>]

; Keepout feature on/off
o104 if [#<_tc_slots> EQ 0]
  (print, Keepout Feature: 0)
  G65P1Q683S0;
o104 else
  (print, Keepout Feature: 1)
  G65P1Q683S3;
o104 endif

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

; ******** IO CONTROL ********

; The output pin for the drawbar
#<_tc_output_db> = 1
(debug, Drawbar output at pin #<_tc_output_db>)

; The output pin for air seal
#<_tc_output_as> = 0
(debug, NO Air seal output at pin #<_tc_output_as>)

; The output pin for tool change button enable
#<_tc_output_bt> = 2
(debug, Button output at pin #<_tc_output_bt>)

; The input pin for the drawbar sensor
#<_tc_input_db> = 0
(debug, Drawbar sensor at pin #<_tc_input_db>)

; The input pin for the tool holder sensor, nominally tied with drawbar sensor.
#<_tc_input_th> =  #<_tc_input_db>
(debug, Tool holder sensor at pin #<_tc_input_th>)

; The input pin for the tool in spindle sensor
#<_tc_input_tis> = 1
(debug, Tool in spindle sensor at pin #<_tc_input_tis>)

; The input pin for the pressure sensor
#<_tc_input_pres> = 2
(debug, Pressure sensor at pin #<_tc_input_pres>)

; The input pin for the rack sensor
#<_tc_input_rack> = 3
(debug, Rack presence sensor at pin #<_tc_input_rack>)

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
#<_tc_retract_dist> = 3
(debug, Tool Measure Retract Distance: #<_tc_retract_dist>)

; The distance to probe in search of the tool setter for the subsequent probe.
#<_tc_set_dist> = -4
(debug, Tool Measure Set Distance: #<_tc_set_dist>)

; The feed rate for the initial probe.
#<_tc_seek_feed> = 1000
(debug, Tool Measure Seek Feed Rate: #<_tc_seek_feed>)

; The feed rate for the second probe.
#<_tc_set_feed> = 50
(debug, Tool Measure Set Feed Rate: #<_tc_set_feed>)

; Check tool length when tool changing
#<_check_tl_error> = 1
(debug, Maximum tool length difference to trigger an incorrect tool error #<_check_tl_error>)

; ******** TOOL HOLDER SENSOR CONTROL ********

o106 if [[EXISTS[#<_holder_sense>]] EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|Setup parameter "_holder_sense" missing. Please run ATC Setup and try again. [A-200-08])
o106 endif
(debug, Tool Holder Sensor: #<_holder_sense>)

; Tool holder sensor Y offset relative to spindle center line
#<_tc_holder_sense_offset_y> = 44;
(debug, Slot Offset: #<_tc_holder_sense_offset_y>)

; Tool holder sensor Z offset relative to top of pull stud
#<_tc_holder_sense_offset_z> = 11;
(debug, Slot Offset: #<_tc_holder_sense_offset_z>)

#<_tc_holder_sense_seek_z> = 8;
(debug, Slot Offset: #<_tc_holder_sense_seek_z>)

; ******** PRESSURE SENSOR CONTROL ********

o107 if [[EXISTS[#<_pres_sense>]] EQ 0]
  (abort, ATCI:1|Tool Changer Disabled|Setup parameter "_pres_sense" missing. Please run ATC Setup and try again. [A-200-09])
o107 endif
(debug, Pressure Sensor: #<_pres_sense>)

; ******** SYSTEM VARIABLES ********
; Assign tool 0 as empty
#<_empty_tool> = 0
(debug, Empty tool assigned to: T#<_empty_tool>)

; ******** STARTUP ********

; ******** STARTUP ACTIONS ********
; Turn off spindle, highly unlikely scenario
M5

; Disable tool change button (Typically turned on by manual tool change resets.)
M65 P[#<_tc_output_bt>]

; Disable drawbar (Typically turned on by tool change resets.)
M65 P[#<_tc_output_db>]

; ******** STARTUP CHECK ********
; Disable during initialization
o200 if [EXISTS[#<_initializing>] EQ 1]
  (print, Initializing, all checks skipped)
  ; ******** DISABLE KEEPOUT ********
  M960 P0
o200 else
  ;Check homed state
  o300 if [#<_homed_state> NE 1]
    (abort, ATCI:1|Machine not Homed|Home your machine to enable tool changing. [W-200-01])
  o300 endif

  ; Check if state of the spindle is in sync with firmware
  G65 P502

  ; Check for rack configuration mis-match
  M66 P[#<_tc_input_rack>] L4 Q0.01
  o320 if [#5399 NE -1 AND #<_tc_slots> LE 0]
    o321 if [#<_tc_slots> LE 0]
    (abort, ATCI:1|Tool Changer Disabled|The rack sensor is active, but no rack is configured. Please run ATC Setup to configure your rack and try again. [A-200-11])
    o321 endif
  o320 else
  ;Re-enable keepout unless rack is not present
    M960 P1
  o320 endif

  ; ******** APPLY TOOL OFFSET ********

  ; Reapply tool offset at startup
  o400 if [#<_current_tool> GT 0 AND #<_current_tool> LT #<_tool_table_size>]
    ; M61 here to help G43 run properly
    ; TODO Remove M61 after $REBOOT bug is fixed
    M61 Q[#<_current_tool>]
    G43 H[#<_current_tool>]
    (debug, Tool offset for #<_current_tool> applied)
  o400 else
    G49
    (debug, Tool not in holder, offsets cleared)
  o400 endif

    ; ******** ENABLE FEED OVERRIDE ********
  ; This re-enables feed override in case of a reset
  M50 P1

o200 endif

; The flag indicating that the settings have been loaded into memory.
#1001 = 1
(debug, Tool changer ready flag Set: #1001)
(debug, Sienci ATC Configuration Loaded)

; The flag is an internal variable for tracking whether tool length measurement is active
#1002 = 0

; The flag is an internal variable for tracking whether manual tool unloading is forced (for in rack tools)
#1003 = 0

; The flag is an internal variable for tracking whether manual tool loading is forced (for in rack tools)
#1004 = 0

; ********SENDER COMMUNICATIONS ********
(print,ATCI|table_size:#<_tool_table_size>|rack_size:#<_tc_slots>)

M99`;

const defaultMacros: Macro[] = [
    {
        name: 'P302.macro',
        content: P302Content,
    },
    {
        name: 'P506.macro',
        content: P506Content,
    },
    {
        name: 'P900.macro',
        content: P900Content,
    },
    {
        name: 'P502.macro',
        content: P502Content,
    },
    {
        name: 'P500.macro',
        content: P500Content,
    },
    {
        name: 'P509.macro',
        content: P509Content,
    },
    {
        name: 'P508.macro',
        content: P508Content,
    },
    {
        name: 'P510.macro',
        content: P510Content,
    },
    {
        name: 'P512.macro',
        content: P512Content,
    },
    {
        name: 'P301.macro',
        content: P301Content,
    },
    {
        name: 'P511.macro',
        content: P511Content,
    },
    {
        name: 'P999.macro',
        content: P999Content,
    },
    {
        name: 'P501.macro',
        content: P501Content,
    },
    {
        name: 'P504.macro',
        content: P504Content,
    },
    {
        name: 'P503.macro',
        content: P503Content,
    },
    {
        name: 'P901.macro',
        content: P901Content,
    },
    {
        name: 'P300.macro',
        content: P300Content,
    },
    {
        name: 'P507.macro',
        content: P507Content,
    },
    {
        name: 'P505.macro',
        content: P505Content,
    },
    {
        name: 'TC.macro',
        content: TCContent,
    },
    {
        name: 'P200.macro',
        content: P200Content,
    },
];

export interface ATCIMacroConfig {
    version: number;
    sdVersion: number;
    variables: {
        [key: string]: ATCIVariable;
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
    version: 20260227,
    sdVersion: 20260227,
    variables: {
        _tc_rack_enable: {
            default: 0,
            value: 0,
        },
        _tc_slots: {
            default: 6,
            value: 0,
        },
        _tc_slot_offset: {
            default: 90,
            value: 0,
        },
        _irt_offset_mode: {
            default: 0,
            value: 0,
        },
        _ort_offset_mode: {
            default: 0,
            value: 0,
        },
        _passthrough_offset_setting: {
            default: 0,
            value: 0,
        },
        _holder_sense: {
            default: 1,
            value: 0,
        },
        _pres_sense: {
            default: 1,
            value: 0,
        },
    },
    variableFile: 'P100.macro',
    macros: defaultMacros,
};

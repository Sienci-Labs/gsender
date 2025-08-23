# ![gSender logo](https://github.com/Sienci-Labs/sender/blob/master/src/app/images/icon-git.png?raw=true)gSender: connect to and control [grbl](https://github.com/grbl/grbl)-based CNCs

gSender is a feature-packed CNC interface software designed to be clean and easy to learn while retaining a depth of capabilities for advanced users. Its development was begun in 2019 out of a passion for hobby CNC machines: **an interface reimagined to suit the needs of the at-home CNC user**.

![gSender](https://github.com/Sienci-Labs/gsender/blob/ae96c701b03d037c30105ecbd5ecc0af6a9edc6f/examples/gsender-newu.jpg)

* **Totally free**
* **Accepts standard, grbl-compliant g-code** from all the common CAM programs
* **Designed to be generic** so any standard [grbl](https://github.com/gnea/grbl/releases) or [grblHAL](https://github.com/grblHAL/core) CNC will work
* **Expands its UI to the needs of your CNC** by recognizing what features it's capable of
* **Works on as wide a range in computing systems as possible** (low-end PC to RasPi, leveraging [Electron](https://www.electronjs.org/))
* Used to be based on the popular [CNCjs controller interface](https://github.com/cncjs/cncjs) but has since been mostly re-written

**Our core principals during development have been to:**
1. Make any CNC feel easy to use no matter your previous experience
2. Substitute CNC jargon with simple language when possible
3. Keep the interface flexible to accommodate any common CNC machine
4. Maintain 'power tools' and customizability for advanced users
5. Prioritize interface reliability over new features
6. Otherwise continue pushing forward in any way possible to advance the CNC experience

## 💻 Download [![Github All Releases](https://img.shields.io/github/downloads/Sienci-Labs/gsender/total.svg)]()

gSender is available for the following systems and does not yet support headless Pi operation

| ![Windows](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/WIN.png)<br>Windows (x64)        | ![Mac](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/MAC.png)<br>Mac (Universal)          | ![Linux](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/LIN.png)<br>Linux (Intel)                | ![Linux](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/LIN.png)<br>Linux (ARM)              | ![RasPi](https://github.com/iiiypuk/rpi-icon/blob/master/48.png)<br>Pi (64 bit)                                                   |
|-----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
|                                                                                                                             |                                                                                                                             |                                                                                                                                      |                                                                                                                               |                                                                                                                                   |
| ```  Available  ```  [EXE](https://github.com/Sienci-Labs/gsender/releases/download/v1.4.10/gSender-1.4.10-Windows-64Bit.exe) | ```  Available  ```  [DMG](https://github.com/Sienci-Labs/gsender/releases/download/v1.4.10/gSender-1.4.10-Mac-Universal.dmg) | ```  Available  ```  [DEB](https://github.com/Sienci-Labs/gsender/releases/download/v1.4.10/gSender-1.4.10-Linux-Intel-64Bit.deb) | ```  Available  ```  [DEB](https://github.com/Sienci-Labs/gsender/releases/download/v1.4.10/gSender-1.4.10-Linux-ARM-64Bit.deb) | ```  Available  ```  [DEB](https://github.com/Sienci-Labs/gsender/releases/download/v1.4.10/gSender-1.4.10-PI-64Bit.deb) |


### Notes for MacOS users

If you get the following error when running the gSender:

```
“gSender” is damaged and can’t be opened. You should move it to the Trash.
```

To fix this, you need to clear the extended attributes using the following command since gSender is not yet notarized with an Apple Developer ID, macOS may prevent it from running after installation or an upgrade.

```bash
xattr -c /Applications/gSender.app
```

[Check out the latest releases here.](https://github.com/Sienci-Labs/gsender/releases/)


## 📦 Current Features

* [Grbl](https://github.com/gnea/grbl/releases) and [grblHAL](https://github.com/grblHAL/core) controllers supported
* Full imperial/metric compatibility
* Smart machine connection
* 4-axis digital readout (DRO) with manual value entry
* All-directional jogging with XY diagonals, jog presets, and incremental/continuous single-button handling
* Zero-setting and Go Tos (with safe height)
* 3D toolpath visualization (no machine connection required)
* Probing in any direction plus safe continuity detection ensures no broken cutting tools
* Built-in gadgets for stock flattening, stock rounding, XY squaring, axis movement tuning, firmware flashing, and more
* Responsive screen design and workspace customizations including light and dark themes
* File insight on load (feed range, spindle range, tools used, estimated cutting time, and overall, max, and min dimensions)
* Feed override and active job status indicators
* Fully exposed keyboard shortcuts for external keyboard/keypad control
* Gamepad support built-in for a variety of controllers
* Safe height movements - accommodates machines with or without endstops
* Homing cycle and quick-movement locations available for machines with homing hardware
* Full spindle/laser support via manual control widgets, active alerting, and live overrides
* Full mist/flood coolant support via manual control widgets and active alerting
* Macros buttons (rearrangeable) with enhanced macro variables and individually assignable keyboard shortcuts
* Lightweight mode reduces processing intensity on less powerful hardware or when running larger files
* Easy workspace swapping for more advanced jigging or alignment work
* Supports 4th and rotary axes, even on vanilla grbl devices by hijacking Y-axis movements
* Built-in wizards to handle tool changing even on vanilla grbl CNCs
* Start-from-line functionality to resume jobs part-way through in case of failure of abort
* Job outlining to see the rough bounds of your file before cutting
* Customizable g-code injection events
* Tooltips for data entry points
* Alarm warning explanations to better contextualize CNC errors
* Sleep management to keep PC awake during g-code sending
* Pre-built machine profiles, including:
    - LongMill
    - AltMill
    - Mill One
* Generic support for other machines, including:
    - Shapeoko
    - X-Carve
    - OpenBuilds CNCs
    - Ooznest WorkBee
    - Nomad
    - Carvey
    - RatRig
    - 3018 CNC & PROVer
    - Bulk-Man 3D
    - FoxAlien
    - SainSmart/Genmitsu
    - YoraHome
    - Two Trees
    - BobsCNC
    - CNC4Newbie
    - MillRight
    - Onefinity (running grbl-based controller)
    - Mill One, and more...

## 🎓 Documentation

All up-to-date documentation on gSender can be found here: [https://sienci.com/gsender-documentation/](https://sienci.com/gsender-documentation/)

If you encounter issues or would like to recommend improvements for gSender, there's a link for feedback submission on the documentation page. We also have a place for discussion on our forum: [https://forum.sienci.com/c/gsender/](https://forum.sienci.com/c/gsender/)


## 📃 Example Files

If you'd like to test gSender's capabilities, there are several gcode files in the [examples](https://github.com/Sienci-Labs/sender/tree/master/examples) directory that can be downloaded and run locally.


## 💼 License

gSender is free software, provided as-is and available under the [GNU GPLv3 license](https://github.com/Sienci-Labs/sender/blob/master/LICENSE).


## 👓 Further Use

gSender is also designed in a way that it can be run locally on your computer browser or otherwise compiled for use on other systems which aren't listed in the downloads. We'd appreciate user input and contributions so we can compile documentation on how you can set this up yourself.


## 🕣 Development History
<details>
<summary>Expand to see all version notes</summary>

### 1.5.3 (August 4, 2025)
- Outline runs if visualizer disabled in lightweight mode
- Added new config option for outline - can now run detailed (old routines, travels rough shape of toolpath) or square (the bounding box)
- Alterations to connection to make grbl detection more robust.  FluidNC should now catch as grbl.
- Fixed unit miscalculation on file stats
- Remote mode configuration made more robust to reduce situations where the app fails to start.
- Unit conversion fixes in squaring and calibration tools
- Stock turning and Probe rotary properly disable when in non-rotary mode
- Jog presets in config now reflect selected Carve screen units.
- Units again appear in config when connected to grbl board.
- Fixed load state issue when previous file was paused
- Corner selection in probing now persists between gSender sessions.
- Re-added the bad file and bad line detection with some improvements.  They should now appear in the Helper.
- Rename rotary install track length to appropriate value
- Stats connection summary formatted correctly for ethernet connection.
- Firmware settings imports now apply immediately on import.
- Gamepad profiles now represent the button name if known instead of just numbers.
- Visualizer grid now respects carve screen units.
- Visualizer colours now correct with Light visualizer theme.
- Spindle dropdown again reflects the current firmware spindle.
- AXS parsing should be more robust on grblHAL devices.
- Fixed edge cases in surfacing generation that could miss strip in center.
- Spindle/Laser toggle behaviour more closely matches 1.4.12 implementation.
- Z jogging popup re-added to calibration tools.
- Various config sorting and filtering changes.
- Load File area looks a little better in dark mode.
- Fixed cases where visualizer could go blank and not re-appear until toggling camera.
- Added spindle delay option to rotary surfacing tool.
- Plus and Minus buttons behaviour tweaks on jog feeds and distances
- Force Hard and Soft Limits config options type updated and no longer crash the application.
- Various look and feel and text changes.


### 1.5.2 (July 15, 2025)
- Fix issues with remote mode disconnecting main client and jobs stopping when connecting from remote mode
- Significantly sped up file loading and rendering on larger files
- Job end notifications will no longer appear if toggled off
- SVG visualization no longer teeny-tiny on inches postprocessor files
- Plus and Minus buttons returned to jog speeds with the prior existing logic
- AutoZero touchplate renamed to just AutoZero
- Added new Config option for Jog Delay, which configures how long a keypress/UI press/gamepad press before swapping to continuous jogging
- Commands sent later in connection cycle to reduce situations where Error 1 occurs when unlocking and resetting the board
- Generating a surfacing file no longer causes issues on main visualizer if not sent there
- Motors sections again will disappear from config when empty
- Restore defaults and default highlight works correctly in Config on settings considered hybrid between grbl/grblHAL
- Prevented situations where alarm list was not populating correctly
- Continuous jog without soft limits now sends more sane values when jogging in Inches across both controllers
- Load bar now appears correctly in surfacing and rotary surfacing tools
- Stopping a file that has an early M0 already sent will no longer pop up the pause modal
- Stock turning and Probe Rotary Z disabled for grbl controllers when in non-Rotary mode
- Config look and Feel tweaks
- Shortcuts rearranged so more commonly set ones are higher up
- File stat feed rates now convert correctly
- Zero All on grblHAL no longer sends Zero on A if A Axis not reported
- Various look and feel changes

### 1.5.1 (June 27, 2025)
- Addressed issues where jog values kept reconverting
- Fixed crash when importing settings
- Updated some AltMill and LongMill default values
- Removed Zoom icons from visualizer
- Override sliders have switched to decaf and are now less jumpy
- Fixed unit issue with Go To popover and default values no longer populate Z with Y value
- Using tuning tools (Squaring and Steps/mm) now refresh EEPROM state and respect UI units
- Abs/Inc toggle in Go To popup moved to top
- Fixed issue where M0 in macros could result in a paused feeder state after unlocking preventing further code sending
- Fixed issue where Machine status overlapped unlock and connect on smaller resolutions and made them unclickable
- Disabling a drawer tool now defaults you to the first drawer element
- Fixed issue with tool select in probing working inconsistently and defaulting to Auto
- Rotary Axis travel resolution and maximum rate appearing again when connected with grbl

### 1.5.0 (June 18th, 2025)
- All new user experience - we've streamlined and modernized the UI, with a focus on touch devices and usability.  It should seem familiar to previous gSender users with a number of new improvements.
- Firmware now detected on connection - no more firmware selector, gSender can just use the correct controller type
- All new Stats tool which collates your job run statistics, alarms and errors, maintenance tasks, and diagnostics
- Firmware settings and gSender settings have been combined into a new streamlined Config tool, allowing you to easily configure your machine setup and application behaviour
- All settings (both EEPROM and application) can be filtered by non-default and restored to default values at a single click
- Rotary now a first-class citizen - enabling rotary functionality adds all DRO and jogging controls you could need to the main UI
- Some new perspectives - gSender now comes with a configurable dark mode, selectable in config.  As well, portrait mode is available by rotating your device.
- Updated remote mode - more functionality at your finger tips
- What'd I miss - all new notifications center to keep you informed about what's happened when running your job
- Helper - Alarm explanations and toolchanging are now helpers, which will pop up as required
- Visualizer - Lightweight mode has had some behaviour changes, and better supports touch movements like pinch and zoom
- Tools - All tools and widgets are collated on the new Tools interface, allowing you to easily access tools and widgets

### 1.4.12 (March 10th, 2025)
- Added new machine profiles for AltMill 2X4
- Added support for new rotary track options
- Added fallback for jog values in cases where they were undefined
- Added EEPROM settings export with diagnostic
- Fixed stepover for rotary surfacing on closed loop motors converting unnecessarily
- Dialog on code option now shows on grbl controller

### 1.4.11 (December 16th, 2024)
- Added "Skip Dialog" option to code toolchange which combines both blocks and skips the "Continue" dialog
- Diagnostics now generates a zip file which includes the original diagnostic PDF, a copy of current gSender settings, and any loaded toolpath for better support.
- Continuous jogging now bitwise compares homing location to avoid non-XYZ axes causing invalid corner detection
- You are now able to update EEPROM values using the firmware tool when in Alarm state
- Start from Line now starts the spindle after the Z safe movement but before X and Y
- Fix for A axis jog keybinds not working on standard grbl controller
- Reverted HAL changes $G using the realtime alternative to reduce instances of error 1 since it was not playing nicely with the new line parser
- Fix for available axes and axes count not being emitted properly when disconnecting and reconnecting over ethernet
- Auto Zero touch plate probing now properly converts bit diameter when using imperial preferred units and a specific bit size
- Available ports are now case insensitive when matching known controller types (Thanks Dymk!)
- Macros no longer overflow the macro widget
- Tweak to 30X30 machine profile for missing acceleration change for $111
- Fixed rare situation where connecting to grblHAL controller, disconnecting, and reconnecting to grbl controller caused invalid laser/spindle mode toggle behaviour.

### 1.4.10 (October 28, 2024)
- Jog no longer sends double jog commands on touch devices
- $G output emitted to UI when connected using grblHAL and manually sent
- AltMill profile updated $103 A steps to account for compiled microstepping
- SLB profiles updated with new values
- Updated defaults on Mk2, Mk1, and MillOne profiles
- AutoZero touch routine updated when running specific diameter bits to be more accurate, and retract distance on Z slightly increased for non-tip routines.
- Rotary toggle no longer updates values when cancelled on grblHAL
- Changed Spindle/Laser toggle behaviour for when to use gSender settings vs EEPROM settings for laser offset and spindle/laser min and max
- Custom theme visualizer background now saving correctly
- AltMill profile now at top of profiles with other Sienci Machines

### 1.4.9 (August 5, 2024)
- Fix for time remaining converting timestamps incorrectly
- Firmware groups now always emitted to UI on connection
- Reduced situations where error 1 should appear on connection or homing
- Alterations to AltMill default profile for Z acceleration
- Enabling rotary mode for grblHAL now disables homing, and disabling rotary mode restores your previous homing value
- Updated LongMill HAL A axis travel resolution for compiled microstepping value
- Main window should no longer be focused on load file dialog

### 1.4.8 (July 11, 2024)
- Added AltMill profiles
- Start from line now also accounts for A axis if file contains those movements
- Fixed situation where progress bar could be greater than 100%
- Some time estimation alterations specifically when pausing jobs
- Fixed issue where console copy prompt stated limit other than 50
- Spindle delay on start is now a configurable value in ms
- Changes to ethernet behaviour to allow reconnection in more cases the board closes the connection early
- Maintenance tasks that are due now prompt the user to take care of them on application start
- Changed max value for spindle RPM in rotary surfacing tool
- Fix for rotary tab gaining focus and preventing keybinds from working
- Changes to console scrollbar size and sensitivity
- Setting A-axis zero now updates visualizer rotation correctly
- Homing enabled in diagnostics now correct for SLB
- A-axis DRO with $13 enabled now no longer converts incorrectly
- Relative Go To now correctly uses input values for all 3 axes
- Alarm 14 and 17 now reset and unlock instead of just unlock using UI buttons
- Firmware tool inputs now disabled in Alarm state
- Added preference for end of job modal to not appear
- Fixed crash on toggling lightweight mode
- End of probe code now correctly restore G90/G91 to previous state


### 1.4.7 (April 30, 2024)
- Rapid position buttons work as expected with A-axis invert enabled
- Updated defaults for SLB homing speeds
- Added setting highlight and restore individual defaults to HAL firmware tool
- Fixed issue where SLB flashing could fail silently if connected before flashing
- Tweaks to finish time estimation
- Firmware flavour for SLB now included in diagnostic file
- Prevented soft reset on exiting check mode on SLB from getting the firmware not leaving check mode
- Alterations to behaviour of planning line in visualizer
- Go to button default values are now current position if absolute movement and 0 if relative movement
- Fixed issue where error would prevent the file from resuming in some situations
- grbl controller now will always send $$ command eventually even if no startup message received`

### 1.4.6 (April 5, 2024)
- Values properly convert in surfacing tool when swapping between metric and imperial preferred units
- Fixed default UI value precision when swapping between metric and imperial preferred units
- Handle error silently when checking for updates but no internet connection is available
- Added default profiles for all machines when connected using grblHAL and using the 'Restore Defaults' functionality
- No longer emit error 79 when connecting with e-stop enabled on SLB
- Fixed issue with soft limit Z jogging when trying to jog from machine limits
- Fixed status query mask when sending 0x87 complete status report vs ? partial status report to prevent alarm states from being slow to clear on UI

### 1.4.5 (March 28, 2024)
- Fix for jog shortcuts not sending short movement when quick pressed
- grbl firmware tool correctly updates values when list shortened with search term
- More rounding in tool changing values
- Various updates to diagnostic PDF to include more at-a-glance information
- HAL firmware categories loaded more consistently on connection
- HAL errors/alarms list populates more consistently on connection
- Renamed some firmware categories for clearer organization
- Better handling of cycle start, pause, and halt macro button functionalities
- Fixed choppiness in visualization in 4-axis mode
- A-axis continuous jogging works as expected with soft limits enabled in 4-axis mode
- Feeder no longer pauses when setting EEPROM macro code block with a M0/M1 included
- Rotary mode status correctly set on connection
- Random errors no longer appear on connection
- Error log cleared on job start to prevent errors from not sending a job aren't included in the job error report
- Adjust HAL jogging values
- Added ability to flash SLB already in DFU mode
- Flashing UX improvements for HAL

### 1.4.4 (March 15, 2024)
- Firmware selection hidden by default to avoid misclicks, and selected firmware reset to grbl for all users.
- Removed situations where no firmware option was selected on initial update of gSender
- Fixed tabbed widget overlapping on some screen resolutions
- Fixed issue with toolpath Z dimensions calculating incorrectly
- Probe XYZ now goes to XY zero on completion of routine similar to prior behaviour
- Errors from feeder are also now emitted to UI
- Rotary axis toggle and other rotary tools now disabled in alarm state
- Fixed situations where pausing and unpausing repeatedly could overflow firmware buffer
- Fixed jog values reconverting and resetting on UI
- Prevented warning appearing in movement calibration tool erroneously
- Added A-axis limit pin indicator to diagnostics panel
- Some tweaks to diagnostic report layout
- Fixes for AutoZero probing routines with $13 enabled
- Better error reporting on UI in general for macro and console errors
- Renamed Mac build from Intel to Universal for clarification
- Fixed some problematic shortcut behaviours on gamepad
- Fixed issue with final Z on automatic tool change being off by the retract distance
- Visualizer no longer displays miscalculated toolpath when loading the same file twice in a row
- Fixed continuous jogging with soft limits enabled on some EEPROM configurations on HAL
- HAL spindle selector now uses on-board EEPROM values for SLB_LASER option
- HAL flashing should now be usable and the board should be connectable without power cycling
- Repeated errors in HAL should be reported to the user less often
- Spindle selector now uses reported current spindle
- Fixed issue where spindle selector could get duplicate entries on ID change
- Fixed toolchange program feedrate variable on HAL
- Setting import in HAL firmware tool now correctly updates radio button options

### 1.4.3 (February 22, 2024)
- Fix for probe migration values not running
- Fix for jog value migration not running
- Spindles on HAL no longer duplicate when running the spindle command multiple times
- Connection widget should no longer zero out selected controller in some situations
- Toolchanger should no longer error out in situations when the user has connected then disconnected

### 1.4.2 (February 16, 2024)
- Added ability to assign macros to gamepad buttons
- Controller type is now annotated in the Errors and Alarms report and diagnostic file
- Go To function on UI now accounts for preferred units
- Added spindle selector to Laser/Spindle tab when using grblHAL firmware
- Unlock button now only shows 100% of the time when using grblHAL controller
- Fixed machine profiles missing in some situations
- Remote mode UI jog controls are once again properly contained within their widget container
- Fix for remote mode settings crashing on Firefox
- Fixed toggling laser offsets with inches enabled
- Various improvements to time estimation
- "Use Last Port" button in firmware tool should now properly connect when the last connection was over Ethernet
- Alterations to outline behaviour - should move in a consistent direction and more accurately outline the toolpath
- Fixed tool change offsets being concatenated as strings instead of added
- Surfacing tool better handles extreme values by warning the user instead of exceeding the call stack
- Various rotary fixes
- Fix for pass-through toolchanging in macros
- Fix for spindle delay being added when the line already had a delay from the post-processor
- Start-From-Line should now better handle starting G2/G3 commands and clear errors on grblHAL controller
- Fix for toolchange wizard not resuming correctly on grblHAL controller
- Verify job should behave more consistently like grbl controller on grblHAL firmware

### 1.4.1 (January 26, 2024)
- Fix for black screen on application startup in some situations
- Fix for jog buttons on UI not registering click events correctly on some operating systems
- Strip comments sent to controller to prevent buffer overflow and better support Shapeoko
- Fix issue with firmware tool not updating values correctly if settings limited by search bar
- Handle missing file name in recent files
- Updated EEPROM values for travel on multiple Sienci profiles
- Fixed issue with surfacing tool crashing in some situations
- Fixed several bugs with gamepad support

### 1.4.0 (January 23, 2024)
- Added Rotary Mode
  - gSender is now able to run 2+1 axis files on grbl and 4 axis files on grblHAL
  - Visualizer updated to support 4 axis rotations
  - A-axis DRO and jogging
  - Rotary probing
- Added grblHAL controller support
  - Connect to and run jobs as normal on any grblHAL device
  - Connect over ethernet where hardware is supported
  - New grblHAL specific firmware tool that is dynamically generated based on reported settings
  - New UI elements where appropriate to support new functionality such as single axis homing
- Gamepad improvements
  - Restructured logic and mapping of buttons to actions
  - Add secondary functionality to buttons
  - Added joystick MPG mode
  - Added lockout button to deactivate gamepad when needed
- Improved job time estimation
  - Significantly improved initial time estimation algorithm based on machine acceleration and max speeds
  - Mid-job estimation uses initial estimate per line for more accurate remaining duration
- Multi-corner probing - touch off any corner using both standard and auto-zero touchplates
- Added Go To UI button to quickly go to an absolute or relative workspace coordinate
- Clearer distinction on planned lines vs cut lines - planned lines show up as a (customizable) yellow instead of the default cut gray
- Remote mode improvements
  - Added QR code for easier navigation to remote address on phone
  - Added workflow controls and unit selection to remote mode UI
- Added preference to prompt on Zero to prevent accidentally resetting zero on any axis
- Code block toolchange again supported
- Firmware active modals now displayed in diagnostic tab
- PRB values available to use in macros
- Files are now parsed once per run time
- Fix for DRO precision in some situations
- Improved job stats area - now tracks jobs per com port, more information about each job run and the number of problems encountered
- Maintenance reminders - set up and customize maintenance reminders to prompt tasks after specific run time totals have occurred
- Improved alarm and error recording

### 1.2.2 (Jul 6, 2023)
- Fix for overrides leading to gcode errors
- Override value correctly updates with keybind usage
- Using override keybind should now display the override panel
- Multiple tool changes in a single file now display the correct tool in the Wizard
- Controller binds should work with tool change wizard active
- Spindle RPM no longer incorrectly converting units
- Spindle slider now reflects EEPROM values for min and max
- Jog speed properly converts through preferred unit changes
- Larger margin on shortcut printout
- M0 in feeder macros now displays M0 pause dialog
- Added missing outline keybinds
- Unlock keybind should work in more situations where a soft reset was required

### 1.2.1 (Jun 22, 2023)
- Fix for files not loading for some users
- Tool change strategy missing units added
- Controller functionality issues addressed
- Calibration tools calculate correct values based on input
- Surfacing unit conversion on RPM removed
- Laser unit renamed to Power from RPM
- Color theme loading no longer loads non-existent file

### 1.2.0 (Jun 19, 2023)
- gSender runs noticeably faster and lighter!
    - There were multiple areas where we were able to make file processing on average 20% more efficient and reduce overall program memory usage by an average of 2/3rds due to an increased node sandbox memory size and improvements to multiple run times
    - On files that still take a while to load we’ve now added a loading bar window to show file loading progress
- Added new job recovery functionality
    - In specific instances where your machine's USB port disconnects from gSender during a job it’ll be able to recommend where you should restart from
- Updates to gamepad controller support
    - List of officially tested controllers if you’d like to select a gamepad that works more reliably with gSender
    - Tested controllers come with their own pre-loaded presets
    - Improved UI for creating controller profiles
- Available PDF printout of shortcuts to hang up near your machine
- Better support for Laser Diodes
    - Optional low-power laser enable on outlining
    - Laser-specific visualization: there’s a different style when laser mode is on and that colour can be customized
    - Bug fix: Laser offset now allows for negative offset values
- New Diagnostic tab inside the Calibrate Tool
    - See at-a-glance information on whether your limit switches, touch probe, or other pins are activated
    - General summary on your CNCs firmware settings
    - The ability to generate a Diagnostic PDF file that includes information on your computer, CNC, recent alarms / errors, any currently loaded g-code file, and more! Very handy to share with our support team or other CNCers to help diagnose problems your CNC might be experiencing
- Remote Mode, control your CNC remotely!
    - Connect to your CNC from a myriad of other internet-connected devices for loading files from other computers or jogging and zeroing from your phone
    - Easy to set up and configure
- Tool changing is now more fully supported by our new Wizard
    - gSender already recognized M0 and M6 commands to initialize a pause in the middle of a file
    - New processes to support using the ‘paper method’, a touch plate, or a tool length sensor (choose based on your CNC setup) now allow more flexibility in handling tool changing and in some cases can pop up a Wizard to direct you through each step and without the need for custom macros
- Other assorted features
    - Slider overrides for easier feed rate and spindle / laser adjustment on the fly
    - Ability to toggle between job overrides and file attributes before starting a job to fine-tune feed and speed overrides before starting a job
    - Get a top-down snapshot image of your job with the new SVG Visualizer that bridges the gap between a fully disabled visualizer or the full 3D one (useful for less powerful computers)
    - Colour coded Console on certain commands like alarms and errors that can also now pop-out
- Assorted other settings
    - New safety tab for tracking alarms and errors and accessing safety settings
    - Soft limit warning on file load if machine has limit switches
    - Customizable probe fail distance in Z
    - More visualization theme customizations for ‘light’, ‘dark’, or your own fully custom design
    - New Shortcuts for controlling Probing, Visualization, and Macros and the ability to filter shortcuts by category to easily find and edit them
    - New stats tab for tracking jobs run on your CNC
    - Custom decimal places on the DRO
- and other bug fixes for Linux auto updates, Settings exporting, Preferred units and file unit modals, Bounding box relative movement, Shortcut printing and more!

### 1.1.7 (Oct 26, 2022)
- Fix for XYZ probe profile when $13 enabled
- Fix for machine position overflowing bounds
- Fix for some keybinds no longer recognizing when they were released

### 1.1.6 (Oct 19, 2022)
- Improved surfacing tool - pattern now ramps in to support more surfacing bit types, cut direction is reversible, able to start from center, can copy gcode to clipboard for saving.
- Major improvements to visualizer memory usage and parsing speed
- Start from Line should account for maximum file Z height when moving into position to account for situations where Z0 is set at the spoilboard
- Probe code should always return to the exact starting location instead of approximating it
- Improvements to firmware flashing UX - can now select profile and port inside tool
- Fix for auto-probe code movements being too small when "$13 report as inches" EEPROM value enabled
- Go To buttons only use safe height if below that position when limit switches are enabled to avoid moving downwards
- Fixed values in some machine profiles
- Added machine state guards to some keyboard shortcuts
- UI modals now more difficult to close accidentally
- Bracket Comments on M0/M1 now emitted to UI
- Laser offsets preferences allow negative values again
- Bounding Box variables once again available to macros
- Mac version now exits completely on close
- Higher UI clarity when connecting to board with invalid/unrecognizable firmware
- Styling changes in Firmware Tool
- Fixed overflow when OS had screen zoom above 100%

### 1.1.4 (Aug 26, 2022)
* Fixed firmware tool control for setting $23
* Flashing again available without connecting to device
* Improvements to continuous jogging (thanks @cotepat)
* Fixed issue with some settings not properly persisting
* Outline tool improvements - moved to worker thread, G0 movements included, tweaks to accuracy
* More accurate file length estimates when connected - virtualizer now uses EEPROM acceleration values
* Probe function now available in manual tool change
* Better datafilter for invalid UTF8/UTF16 characters

### 1.1.3 (Aug 12, 2022)
* Added profiles for LongMill extension kits
* Machine profile removed from preferences and placed in firmware tool
* Fixed incorrect default values in some machine profiles
* Test mode now restores WCS after the soft reset performed while exiting check mode
* Fixed issue with test mode that would occasionally have it start running the file after test was complete
* Fixed issue with continuous jog when soft limits were enabled and report in inches EEPROM value was enabled
* Firmware tool improvements - new convenient profile selection, setting search, performance improvements, highlighted changed values
* Improvements to value inputs - should no longer default to min value if there is too long a pause in typing
* Surfacing labels changed to X/Y rather than length/width
* Minor styling changes

### 1.1.2 (Jul 15, 2022)
* Fix for start button sometimes not working when "Start Event" block enabled but empty
* Laser offsets applied more intelligently
* Fixed styling regression in probe widget height
* Infrastructure for edge version

### 1.1.1 (Jul 4, 2022)
* Reversion of electron 18 patch to fix issue where application would hang on splash screen
* Patch notes now displayed in "About" section of preferences
* Laser offsets no longer applied on laser mode toggle if set to 0
* Added new machine profiles for Bluecarve and Yorahome CNC
* Dependency updates

### 1.1.0 (Jun 24, 2022)
* Fix for start g-code event not sending entire code block in some situations and make it more consistent in all situations
* Firmware now highlights settings that are different from default for Sienci machines
* Support for edge/beta channels for those who want to opt into new features for testing
* Improvements to controller movement using joystick
* Brighter cut lines in visualizer
* More sensible timeout on fetching updates
* MK2 12X30 configuration now properly selectable
* Added Mist, flood, and stop coolant keyboard shortcuts
* Fixed issue with surfacing spiral pattern where center strip could be missed with some parameters
* Fixed issue in calibration where the direction it asked you to move gantries wasn't correct in some situations
* Laser offset no longer resets to previous value on toggle of laser mode
* Numerous surfacing tooltip and unit conversion issues fixed
* Surfacing now lets you select M3 or M4 movement
* Rapid position buttons now use $27 pulloff value for determining final positions
* Outline tool now stores and restores modals on completion
* Improvements to settings storage and persistence
* Migrated from Electron 10 to Electron 18

### 1.0.6 (Apr 14, 2022)
* Fixed issue that could cause continuous jog to fail in some situations with soft limits enabled
* Fixed issues with start probe and confirm probe keybinds
* Laser offset now saved and applied correctly
* Fixed mouse button combination that could crash visualizer
* WCS is reset to current selection on job stop
* Movement modal included in start-from-line functionality
* Start-from-line should prefer selected WCS if different from default G54
* Fixed issue with spindle max/min not saving in some situations
* Disabled surfacing generation when job is running
* Laser/Spindle EEPROM ($31) and spindle/laser min/max should more accurately be reflected in firmware UI
* Macro movement and re-ordering should be easier and more consistent
* Start-from-line should use a more sane decimal place for position values
* Rapid position buttons should now account for machines not running Sienci-specific firmware and offset position from 0
* Dependency updates

### 1.0.5 (Mar 4, 2022)
* Tool commands now emitted to UI if they occur alongside M6 commands
* Start from line should more consistently set feed rate and spindle speed
* Fixed issue where laser min and laser max were reversed on initializing laser mode
* Rewrite of jog UI control to gain more consistent behaviour
* Alterations to jog keybinds to gain more consistent behaviour
* Added logic on tool change to prevent sender from starting before post hook is complete
* Alterations to profile default spindle min and max and laser min and max values

### 1.0.4 (Feb 15, 2022)
* Add support for distinct Spindle max and Spindle Min while in laser or spindle mode
* "Pause" tool change workflow renamed to "Manual", and now allows jogging and macros to be run
* Default feed rate in "start from line" now reflects file unit modal
* Fixed issue where units weren't consistent on Go-To buttons leading to Z plunge
* Tool diameter selection hidden on Z probe to prevent user confusion
* Lowered minimum resolution from 1280X960 to 1024X768 and added responsiveness to account for that
* Trimmed machine profile list to generic set and made it more obvious that machine dimensions are as reported from EEPROM
* Added MK2 machine profiles and support for default settings for new machines
* Updated firmware images for MK1 and MK2
* Fixed regression where comments weren't properly stripped before sending to grbl
* Corrections to Auto-diameter probe profiles
* Fixed issue where T commands could cause errors when on a line with M6 commands
* Stop job should now consistently reset board (0x18) as intended
* Fixed various tooltip errors
* Fixed issue where calibration tools weren't using correct jog controls

### 1.0.3 (Dec 22, 2021)
* ; Comments are now emitted to UI on M0, M1, and M6 workflow stops
* Fixed issue where jog cancel realtime command wasn't properly sent to controller
* Fixed issue where default values instead of custom jog speeds weren't used on initial program load
* Start from line now sends more modals to make sure IoT devices are enabled if that line is skipped
* Improvements to outline feature - head should now return to original position, better support for disjointed/tiled carves
* Fixed timestamps from causing UI elements to jump around
* Fixed DRO being cut off on small resolutions or screen sizes
* Fixed application not being full-screen on startup
* Increases on movement limits for jog presets
* UI fields should be more easily clearable and return to previous value if not changed
* Workflow controls no longer disappear during jogging
* Changes to updater to prevent 32 bit application updating to 64 bit
* Added new laser support preferences with basic offset
* Alarm 2 should now be unlockable
* Fixed edge case where surfacing would leave an unfinished pass in the center
* Updates to serial connection library and workflow
* New touchplate images and support for upcoming auto-diameter touchplate

### 1.0.2 (Dec 3, 2021)
* Fixed regression with XYZ probe
* Fixed regression in probe preferences

### 1.0.1 (Nov 26, 2021)
* Rapid position buttons now use EEPROM values for more accurate movements and machine profile limits should be set from EEPROM on connect
* Spindle rate hidden by default - Spindle/Laser must be toggled on in machine profile to view overrides during job run
* Surfacing tool now runs last pass in Zig-Zag pattern
* Added support for $13 in feedrate reporting
* Safe height should no longer send router to Z0
* Added new machine profiles
* Fix for F-key shortcuts not working
* Added missing units
* G28 commands no longer ignored
* Alterations to XY probing
* More accurate error line reporting
* Various styling issue fixed

### 1.0.0 (Oct 29, 2021)
* Unlock button on UI to avoid homing/unlock from M0 state
* More user-friendly number inputs that allow clearing are more forgiving on changing value
* Minimize Renders turned on by default when lite mode toggled on
* Styling changes to probe widget
* Various UI look and feel changes
* New machine profiles
* Slight alteration to colour of lines that have entered planner to make them more visible
* Fixed issue with jog/play shortcuts
* Fixed bug where homing using the visualizer Home button did not unlock rapid position buttons
* Fixed issue where firmware settings could be sent when machine was locked/alarmed resulting in settings not updating
* Fixed issue where M0 commands in tool change hooks would result in post hook not executing

### Open Beta 0.7.5 (Oct 22, 2021)
* Improvements to surfacing tool - new motions and layout
* Improvements to pause commands (M0/M1) in macros
* WCS dropdown now accurately reflects workspace modal
* Improvements to flashing workflow and reduced situations where it's possible to fail
* Improvements to probe settings
* Fixed issue with quick movement buttons
* Fixed issue with soft limit behaviour and continuous jogging if firmware flag to set machine 0,0,0 not set
* Fixed issue with imperial units and continuous jogging with soft limits enabled
* Fixed numerous UI inconsistencies and other styling issues

### Open Beta 0.7.4 (Oct 08, 2021)
* Minimize render mode for visualizer to improve performance
* Visualizer improvements to render speed
* Fix render worker being started if visualizer disabled
* Probe dimensions correctly update if changed in preferences
* Can once again copy from console
* Redesigned probe module
* Fix for quick-movement buttons if home set to back-left
* Fix for T commands on the same line as M6 commands
* Fixed firmware tool values occasionally not reflecting actual EEPROM settings
* Style changes

### Open Beta 0.7.3 (Sept 20, 2021)
* Code signed! (this means security certification - i.e. no more firewall warnings)
* New recognized CNCs added and unrecognized devices are now accessible from the connection widget
* UI fixes for incorrect baud rate
* New EEPROM categories for easier navigation
* Clearer Help menu
* More fixes and improvements to endstop-related functions
* New LongMill default firmware that better supports endstops
* Fix for jog not stopping immediately due to debounce
* Various styling fixes

### Open Beta 0.7.2 (Sept 10, 2021)
* Manual value entry for X, Y, and Z locations by clicking on the location indicator
* Re-designed job progress indicator that better shows operating time and path of current file
* Now able to use variables in start/stop g-code blocks and tool changing
* Ability to enable or disable start/stop g-code blocks without clearing code
* Updates to included firmware image and LongMill default EEPROM settings in firmware tool to support endstops
* Endstop buttons now appear automatically if homing is enabled, and the home button is available on machine connect
* Rapid position buttons now available and updated to use new firmware settings
* Individual X and Y axis Go To buttons now use safe height if set in preferences, GotoXYZ0 now changed to GotoXY0, and safe height now complies to endstop-enabled machines and doesn’t descend after movement
* Better support of physical hold/unhold buttons on Longboard controller
* Tweaks to Z jogging to reduce runaway issues
* Fixed hard limit alarms to allow easier resuming of workflow
* Fixed bug with Z movement at end of surfacing program in imperial units
* Joystick jogging should now send jog cancel at direction control release
* Fixed last line run to reset on job completion

### Open Beta 0.7.1 (Aug 20, 2021)
* Improvements to UI connection to CNC machine to prevent frequent disconnections during long job runs
* Program will now prevent your computer from going into sleep mode during long jobs
* Several styling fixes across the UI
* Fixed issue with machine locking up after pressing the jog control buttons in some situations
* Fixed issue with program freezing after a job has finished

### Open Beta 0.7.0 (Aug 13, 2021)
* Start from line feature
* Sortable macros
* Preliminary support for joystick control and keybinding
* Improvements to outline tool to prevent moving below the Z 0 on completion
* Fixed issue where file would be re-rendered or unloaded when connecting and disconnecting
* Fixed issue where inch grid lines weren't aligned with zero point
* Improvements to file loading speed
* Improvements to visualization and rendering speed
* Improvements to file parsing speed
* Various library upgrades aimed at improving performance and preventing UI hanging

### Open Beta 0.6.9 (Jul 23, 2021)
* New outline tool which will generate and run a rough outline of a loaded project file
* Fixes for load file window not appearing in rare circumstances, jogging runaway in rare circumstances, and probe settings not being reflected in probe module until restart
* Fixed issue with surfacing tool limits and ease of changing inputs

### Open Beta 0.6.8 (Jul 8, 2021)
* Fix for duplicated keybinds
* Fix for Carbide Create files and M0 commands
* Fix for new macros not appearing as possible keybinds
* Optional updates for future versions
* New logging engine for electron app
* Socket polling to help keep connection alive
* PowerSaveBlock added to reduce cases of machine sleeping while running long jobs
* Alterations to load file to hopefully reduces cases of the dialog appearing in some users

### Open Beta 0.6.7 (Jul 1, 2021)
* New Movement Tuning tool that can be used to calibrate motor axis movements
* New feature for running G-code at program Start and Stop - enter and save your own commands in the settings
* More exposed keyboard shortcut options and new categorization
* Now able to assign shortcuts to macros!
* Added coolant buttons and status indicator
* Better M0/M1 command support - notification in the UI when command encountered and easier to resume the program
* Clearer visualization due to reduced rapid line opacity
* Improvements to the surfacing tool limits and settings persisting
* Ability to reset gSender settings to default
* Added reconnect logic to client to reduce instances of UI no longer updating on long jobs
* Fixed an issue where the "Home machine" button wouldn't disappear on homing cycle
* Fixed an issue where macro exports were unable to be re-imported
* Fixed issue with jogging while $15 was enabled
* Other minor bug fixes

### Open Beta 0.6.6 (Jun 11, 2021)
* Sticky folders! Load files from the last place you navigated to
* New tool change functionality - can now pause, ignore, or run code blocks on M6 commands
* Added a prototype Calibration tool for axis alignment - step by step process to make sure your CNC is square
* Alarm warnings now show an explanation of what the alarm code means
* Faster splash screen
* Spindle/Laser ‘active’ state changes are now updated more quickly in the UI along with other Laser widget improvements
* Copy and paste text from the terminal
* Tweaks to handling correct units display in overrides and surfacing
* Refactored file information to Redux
* Loads of small bug fixes pertaining to keyboard shortcuts, jogging, probing, comment processing, and the firmware tool
* Minor styling changes

### Open Beta 0.6.5 (May 28, 2021)
* New tool for surfacing
* Moved most controllerEvent listeners to redux store to improve performance
* Improved Job Time Estimation
* Updates to Laser/Spindle widget to better track on/off state
* New 'About' information
* Fixed file units mismatch with preferred units

### Open Beta 0.6.4 (May 14, 2021)
* Improvements to job handling
* Tooltips created for data entry points
* Splash screen tweaks
* Working PI build!?

### Closed Beta 0.6.0 (May 7, 2021)
* Altered how files are loaded to improve UI performance
* Added estimated time to run calculation on file load
* File attributes now persists on disconnect
* Fixed issues with macro editing and adding

### Closed Beta 0.5.8 (Apr 30, 2021)
* New experimental Winx32 and RasPi builds
* Firmware tool improvements and bug fixes
* More accurate parsing of tool and spindle speeds
* Various keybind bug fixes, addressing special characters
* Added recent files button and file unloading
* New 'Check mode' state for testing files before starting job
* Verbose commands now in console
* New macro behaviours and import/export
* gSender now officially licensed under GPLv3
* Homing state and other small bugs and styling fixes
* New logo/branding throughout!

### Closed Beta 0.5.6 (Apr 1, 2021)
* Fixed jog stepping with keybindings, continuous jogging bugs, and other jogging unreliabilities
* Added new keybindings for improved, keyboard-based actions (unsure if issues with particular symbols such as '*' have persisted)
* Took another look through to ensure proper unit consistency and conversion
* Repairs to probing
* More work done on the Firmware tool for refined functions and display
* Indication of current jog preset selected
* New base modals created for use across tools and confirmations

### Closed Beta 0.5.5 (Mar 26, 2021)
* Added combo laser/spindle widget (toggleable in settings)
* Re-designed location widget
* Re-designed layout of job status information to include min and max extents for file dimensions
* Added safe-height retraction settings for goto XYZ0 (accessible in settings)
* Added splash screen on application load
* Migration to most recent Electron release plus implemented logging

### Closed Beta 0.5.4 (Mar 19, 2021)
* Set up in-app feedback submission button
* Better formatting and sizing of various gSender elements
* New visualizer theme "light mode" available in settings
* Experimental "lightweight" options to reduce visualizer rendering computation (meant for less powerful hardware)
* Keybinding tweaks to prevent jogging runaway and other small bugs
* New bottom, left-hand toast notifications for feedback on certain actions
* Imperial / metric units should now extend to all aspects of the sender
* Buttons to goto X, Y, and Z individually
* Better handling of Alarm states with unlock
* New g-code validation on file load and job run
* New feature to automatically download updates for future gSender Windows versions
* Better handling of movement cancel button so that all positioning-related movements should be able to be cancelled
* Migration to most recent React
* New in-app updating management prompted via server releases

### Closed Beta 0.1 (Mar 5, 2021)
* gSender decided as official name :D
* Buttons added for homing, quick-travel, jog cancel, diagonal jog, and an awesome isocube!
* New macros widget
* New customizable settings: jogging presets, baud rate, and more.
* Visual overhaul on settings, probing, file attributes, and visual consistency across entire program
* Logo implemented and the loading of Louis
* Responsiveness overhaul on entire program
* Mac (intel) version released March 8

### Closed Alpha 3.0 (Feb 19, 2021)
* Continuous jogging!
* Unit switching in settings (metric/imperial)
* Keybinding functionality to jog and other key functions with keypresses (can change bindings in settings)
* Probe returning to original position
* New, separate settings files won't interfere with CNCjs
* Small colour and styling changes to hopefully increase clarity of items on the screen
* Some responsiveness addressed to help keep sender looking good across many screen sizes (though we still have a ways to go)
* Fixes to excessive decimal places in some areas
* New Firmware Tool in progress but will probably break your board right now

### Closed Alpha 2.0 (Feb 5, 2021)
* Resolved non-functional buttons, missing console, and some errors during sending
* New jogging widget and jog presets
* Improved probe function plus probe continuity checking
* New file attributes on load
* More visual improvements and a large buildout in new settings options

### Closed Alpha 1.0 (Jan 29, 2021)
* Still highly dependant on great infrastructure created by the CNCjs team
* Established Electron installer, git, and certificates
* Large visual overhaul in how widgets and displayed and operational flow of sender
* New probing widget, machine profiles, settings, and visualizer

</details>

## Made in Canada with ❤️
```geojson
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "ID": 0
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
              [-80.52,43.420],
              [-80.54,43.4275],
              [-80.57,43.4425],
              [-80.59,43.4575],
              [-80.60,43.4775],
              [-80.605,43.4925],
              [-80.60,43.5075],
              [-80.585,43.520],
              [-80.56,43.5225],
              [-80.54,43.5150],

              [-80.52,43.5000],

              [-80.50,43.5150],
              [-80.48,43.5225],
              [-80.455,43.520],
              [-80.44,43.5075],
              [-80.435,43.4925],
              [-80.44,43.4775],
              [-80.45,43.4575],
              [-80.47,43.4425],
              [-80.50,43.4275],
              [-80.52,43.420]
          ]
        ]
      }
    }
  ]
}
```
<!---
-## is more West (left), ## is more North (up)
-->

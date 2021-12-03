# ![gSender logo](https://github.com/Sienci-Labs/sender/blob/master/src/app/images/icon-git.png?raw=true)gSender: connect to and control [Grbl](https://github.com/grbl/grbl)-based CNCs

gSender is a feature-packed CNC interface software designed to be clean and easy to learn while retaining a depth of capabilities for advanced users. Its development was begun out of a passion for hobby CNC machines: an interface rebuilt to suit the needs of the at-home CNC user.
* Accepts standard, GRBL-compliant g-code and has been verified to work with many of the common CAM programs
* Began development to bring new concepts to the existing landscape of GRBL senders in an effort to advance functionality and ease-of-use
* Javascript-based CNC interface software which leverages [Electron](https://www.electronjs.org/) for cross platform use
* Is a branch off of the popular [CNCjs CNC controller interface](https://github.com/cncjs/cncjs) 

Some things that we’re looking to accomplish with this sender:
* Reliability of operation
* Accommodates all ranges of computing systems (low-end PC to RasPi | ‘light mode’)
* Clean and easy to use no matter your previous CNC experience
* Makes available all normally expected functions
* Addresses common error throwing conditions automatically
* Built-in gadgets for surface probing, stock flattening, firmware editing, and g-code editing with syntax highlighting, command navigation, and more
* 3D cutting visualization

![gSender](https://resources.sienci.com/wp-content/uploads/2021/04/gSender-main-page-machine-interface-850x479.png)

## 💻 Download [![Github All Releases](https://img.shields.io/github/downloads/Sienci-Labs/gsender/total.svg)]()

gSender is available for the following systems and does not yet support headless Pi operation
| ![Windows](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/WIN.png)<br>Windows (x32) | ![Windows](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/WIN.png)<br>Windows (x64) | ![Mac](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/MAC.png)<br>Mac (Intel) | ![Linux](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/LIN.png)<br>Linux | ![RasPi](https://github.com/iiiypuk/rpi-icon/blob/master/48.png)<br>Ras Pi
|-|-|-|-|-
 ``` Available ```[EXE](https://github.com/Sienci-Labs/gsender/releases/download/v1.0.2/gSender-1.0.2-windows-x86.exe) | ``` Available ``` [EXE](https://github.com/Sienci-Labs/gsender/releases/download/v1.0.2/gSender-1.0.2-windows-x64.exe) | ``` Available ``` [DMG](https://github.com/Sienci-Labs/gsender/releases/download/v1.0.2/gSender-1.0.2.dmg) | ``` Available ``` [DEB](https://github.com/Sienci-Labs/gsender/releases/download/v1.0.2/gSender_1.0.2_amd64.deb) | ``` Available ``` [ApIm](https://github.com/Sienci-Labs/gsender/releases/download/v1.0.2/gSender-1.0.2-armv7l.deb)

[Check out the latest releases here.](https://github.com/Sienci-Labs/gsender/releases/)


## 📦 Current Features

* [GRBL](https://github.com/gnea/grbl/releases) controllers supported
* Smart machine connection
* 3-axis digital readout (DRO) with manual value entry
* All-directional jogging with XY diagonals, jog presets, and incremental/continuous single-button handling
* Zero-setting and gotos (independent and combined)
* Probing in any direction plus safe continuity detection ensures no broken cutting tools
* Full imperial/metric compatibility
* Responsive screen design and workspace customizations including visualizer light and dark theme
* 3D toolpath visualization (no machine connection required)
* File insight on load (feed range, spindle range, tools used, estimated cutting time, and overall, max, and min dimensions)
* Feed override and active job status indicators
* Fully exposed keyboard shortcuts for external keyboard/keypad control
* Joystick support built-in for a variety of controllers
* Safe height movements - accommodates machines with or without endstops
* Homing cycle and quick-movement locations available for machines with homing hardware
* Full spindle/laser support via manual control widgets, active alerting, and live overrides
* Full mist/flood coolant support via manual control widgets and active alerting
* Macros buttons (rearrangeable) with enhanced macro variables and individually assignable keyboard shortcuts
* Lightweight mode reduces processing intensity on less powerful hardware or when running larger files
* Easy workspace swapping for more advanced jigging or alignment work
* Optional automatic handling for common error throwing g-code
* Firmware tool for easier GRBL EEPROM changes, loading defaults, and GRBL flashing
* Surfacing tool auto-generates surfacing g-code based on machine cutting area and other preferences, ready to execute
* Calibration tool for axis alignment - a step by step process to make sure your CNC is square
* Movement tuning tool for calibrating motor axis movements
* Tool change functionality - pause, ignore, or run code blocks on M6 commands
* Start-from-line functionality to resume jobs part-way through in case of failure of abort
* Outline functionality indicates the rough bounds of the job before cutting
* Customizable g-code injection at job start & end
* Tooltips for data entry points
* Alarm warning explanations to better contextualize CNC errors
* Sleep management to keep PC awake during g-code sending
* Pre-built machine profiles, including:
    - LongMill
    - Shapeoko
    - X-carve 
    - OpenBuilds CNCs
    - 3018 CNC & PROVer
    - BobsCNC CNCs
    - CNC4Newbie CNCs
    - Mill Right CNCs
    - Ooznest WorkBee
    - Nomad
    - Carvey
    - Mill One, and more...

## 🎓 Documentation

All up-to-date documentation on gSender can be found here: [https://sienci.com/gsender-documentation/](https://sienci.com/gsender-documentation/)

If you encounter issues or would like to recommend improvements for gSender, there's a link for feedback submission on the documentation page. We also have a place for discussion on our forum: [https://forum.sienci.com/c/gsender/](https://forum.sienci.com/c/gsender/)


## 📃 Example Files

If you'd like to test gSender's capabilities, there are several gcode files in the [examples](https://github.com/Sienci-Labs/sender/tree/master/examples) directory that can be downloaded and run locally.


## 💼 License

gSender is free software, provided as-is and available under the [GNU GPLv3 license](https://github.com/Sienci-Labs/sender/blob/master/LICENSE).


## 👓 Further Use

gSender is also designed in a way that it can be run locally on your computer browser or otherwise compiled for use on other systems which aren't listed in the downloads. There will soon be documentation on how you can set this up yourself listed below once there's been a bit more testing completed.


## 🕣 Development History

### 1.0.2 (December 3rd, 2021)
* Fixed regression with XYZ probe
* Fixed regression in probe preferences

### 1.0.1 (November 26th, 2021)
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
* Fixed issue where M0 commands in toolchange hooks would result in post hook not executing

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
* Updates to included firmware image and Longmill default EEPROM settings in firmware tool to support endstops
* Endstop buttons now appear automatically if homing is enabled, and the home button is available on machine connect
* Rapid position buttons now available and updated to use new firmware settings
* Individual X and Y axis Go To buttons now use safe height if set in preferences, GotoXYZ0 now changed to GotoXY0, and safe height now complies to endstop-enabled machines and doesn’t descend after movement
* Better support of physical hold/unhold buttons on Longboard controller
* Tweaks to Z jogging to reduce runaway issues
* Fixed hard limit alarms to allow easier resuming of workflow
* Fixed bug with Z movement at end of surfacing program in imperial units
* Joystick jogging should now send jog cancel at direction control release
* Fixed last line run to reset on job completion

### Open Beta 0.7.1 (August 20, 2021)
* Improvements to UI connection to CNC machine to prevent frequent disconnections during long job runs
* Program will now prevent your computer from going into sleep mode during long jobs
* Several styling fixes across the UI
* Fixed issue with machine locking up after pressing the jog control buttons in some situations
* Fixed issue with program freezing after a job has finished

### Open Beta 0.7.0 (August 13, 2021)
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

### Open Beta 0.6.9 (July 23, 2021)
* New outline tool which will generate and run a rough outline of a loaded project file
* Fixes for load file window not appearing in rare circumstances, jogging runaway in rare circumstances, and probe settings not being reflected in probe module until restart
* Fixed issue with surfacing tool limits and ease of changing inputs

### Open Beta 0.6.8 (July 8, 2021)
* Fix for duplicated keybinds
* Fix for Carbide Create files and M0 commands
* Fix for new macros not appearing as possible keybinds   
* Optional updates for future versions
* New logging engine for electron app 
* Socket polling to help keep connection alive  
* PowerSaveBlock added to reduce cases of machine sleeping while running long jobs
* Alterations to load file to hopefully reduces cases of the dialog appearing in some users

### Open Beta 0.6.7 (July 1, 2021)
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

### Open Beta 0.6.6 (June 11, 2021)
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

### Notable features still in progress:
* G-code editing
* Pendant
* Full 3D Visualization

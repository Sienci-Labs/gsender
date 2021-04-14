# gSender: connect to and control [Grbl](https://github.com/grbl/grbl)-based CNCs

gSender is a feature-packed CNC interface software designed to be clean and easy to learn while retaining a depth of capabilites for advanced users. Its development was begun out of a passion for hobby CNC machines: an interface rebuilt to suit the needs of the at-home CNC user.
* Accepts standard, GRBL-compliant g-code and has been verified to work with many of the common CAM programs
* Began development to bring new concepts to the existing landscape of GRBL senders in an effort to advance functionality and ease-of-use
* Javascript-based CNC interface software which leverages [Electron](https://www.electronjs.org/) for cross platform use
* Is a branch off of the popular [CNCjs CNC controller interface](https://github.com/cncjs/cncjs) 

Some things that we’re looking to accomplish with this sender:
* Reliability of operation
* Accommodates all ranges of computing systems (low-end PC to RasPi | ‘light mode’)
* Highly easy to use
* Makes available all normally expected functions
* Addresses common error throwing conditions automatically
* Built-in gadgets for surface probing, stock flattening, firmware editing, and g-code editing with syntax highlighting, command navigation, and more
* 3D cutting visualization

![gSender](https://sienci.com/wp-content/uploads/2021/04/gSender-Main-Screen-0.5.6.png)

## 💻 Download

![Windows](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/windows.png)<br>Windows (x32) | ![Windows](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/windows.png)<br>Windows (x64) | ![Mac](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/mac.png)<br>Mac (Intel) | ![Mac](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/mac.png)<br>Mac (M1) | ![Linux](https://github.com/EgoistDeveloper/operating-system-logos/blob/master/src/48x48/linux.png)<br>Linux
--- | --- | --- | --- | --- |
 In Progress | [0.5.6 (EXE)](https://github.com/Sienci-Labs/sender/releases/download/v0.5.6/gSender-Setup-0.5.6.exe) | [0.5.6 (DMG)](https://github.com/Sienci-Labs/sender/releases/download/v0.5.6/gSender-0.5.6.dmg) | In Progress | In Progress |

## 📦 Current Features

* GRBL controllers supported ([Download](https://github.com/gnea/grbl/releases))
* Smart machine connection
* 3-axis digital readout (DRO)
* All-directional jogging with XY diagonals, jog presets, and incremental/continuous single-button handling
* Zero-setting and gotos (independant and combined)
* Probing in any direction plus safe continuity detection ensures no broken cutting tools
* Full imperial/metric compatibility
* Responsive screen design and workspace customizations including visualizer light and dark theme
* 3D toolpath visualization (no machine connection required)
* File insight on load (feed range, spindle range, tools used, estimated cutting time, and overall, max, and min dimensions)
* Feed override and active job status indicators
* Keybindings available for most functions for external keyboard/keypad control
* Safe height movements
* Homing cycle and quick-movement locations available for machines with homing hardware
* Full spindle/laser support via manual control widgets and live overrides
* Custom macros buttons with optional macro variables
* Lightweight mode reduces processing intensity on less powerful hardware or when running larger files
* Easy workspace swapping for more advanced jigging or alignment work
* Optional automatic handling for common error throwing gcode
* Firmware tool for easier GRBL eeprom changes, loading defaults, and GRBL flashing
* Pre-build machine profiles, including:
    - Shapeoko
    - X-carve
    - LongMill
    - OpenBuilds CNCs
    - Onefinity
    - BobsCNC CNCs
    - CNC4Newbie CNCs
    - Mill Right CNCs
    - Ooznest WorkBee
    - Nomad
    - Carvey
    - Mill One


## 🎓 Documentation

In progress.


## 📃 Example Files

If you'd like to test gSender's capabilities, there are several gcode files in the [examples](https://github.com/Sienci-Labs/sender/tree/master/examples) directory that can be downloaded and run locally.


## 💼 License

gSender is free software, provided as-is and available under the [GPLv3 license](https://github.com/Sienci-Labs/sender/blob/master/LICENSE).

# 👓 Further Use

gSender is also designed in a way that it can be run locally on your computer browser or otherwise compiled for use on other systems which aren't listed in the downloads. The following is documentation on how to set this up yourself:

## Browser Support

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png)<br>Chrome | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png)<br>Edge | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png)<br>Firefox | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png)<br>IE | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png)<br>Opera | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png)<br>Safari
--- | --- | --- | --- | --- | --- |
 Yes | Yes | Yes| Not supported | Yes | Yes | 

## Supported Node.js Versions

 Version | Supported Level
:------- |:---------------
 4       | Dropped support
 6       | Supported
 8       | Supported
 10      | Recommended
 12      | Recommended

## Getting Started

### Node.js Installation

Node.js 8 or higher is recommended. You can install [Node Version Manager](https://github.com/creationix/nvm) to manage multiple Node.js versions. If you have `git` installed, just clone the `nvm` repo, and check out the latest version:
```
git clone https://github.com/creationix/nvm.git ~/.nvm
cd ~/.nvm
git checkout `git describe --abbrev=0 --tags`
cd ..
. ~/.nvm/nvm.sh
```

Add these lines to your `~/.bash_profile`, `~/.bashrc`, or `~/.profile` file to have it automatically sourced upon login: 
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
```

Once installed, you can select Node.js versions with:
```
nvm install 10
nvm use 10
```

It's also recommended that you upgrade npm to the latest version. To upgrade, run:
```
npm install npm@latest -g
```

### Installation

Install cncjs as a non-root user, or the [serialport](https://github.com/node-serialport/node-serialport) module may not install correctly on some platforms like Raspberry Pi.
```
npm install -g cncjs
```

If you're going to use sudo or root to install cncjs, you need to specify the `--unsafe-perm` option to run npm as the root account.
```
sudo npm install --unsafe-perm -g cncjs
```

Check out [https://github.com/cncjs/cncjs/wiki/Installation](https://github.com/cncjs/cncjs/wiki/Installation) for other installation methods.

### Upgrade

Run `npm install -g cncjs@latest` to install the latest version. To determine the version, use `cncjs -V`.

### Usage

Run `cncjs` to start the server, and visit `http://yourhostname:8000/` to view the web interface. Pass `--help` to `cncjs` for more options.

```
pi@rpi3$ cncjs -h

  Usage: cncjs [options]


  Options:

    -V, --version                       output the version number
    -p, --port <port>                   Set listen port (default: 8000)
    -H, --host <host>                   Set listen address or hostname (default: 0.0.0.0)
    -b, --backlog <backlog>             Set listen backlog (default: 511)
    -c, --config <filename>             Set config file (default: ~/.cncrc)
    -v, --verbose                       Increase the verbosity level (-v, -vv, -vvv)
    -m, --mount <route-path>:<target>   Add a mount point for serving static files
    -w, --watch-directory <path>        Watch a directory for changes
    --access-token-lifetime <lifetime>  Access token lifetime in seconds or a time span string (default: 30d)
    --allow-remote-access               Allow remote access to the server (default: false)
    --controller <type>                 Specify CNC controller: Grbl|Marlin|Smoothie|TinyG|g2core (default: '')
    -h, --help                          output usage information

  Examples:

    $ cncjs -vv
    $ cncjs --mount /pendant:/home/pi/tinyweb
    $ cncjs --mount /widget:~+/widget --mount /pendant:~/pendant
    $ cncjs --mount /widget:https://cncjs.github.io/cncjs-widget-boilerplate/v1/
    $ cncjs --watch-directory /home/pi/watch
    $ cncjs --access-token-lifetime 60d  # e.g. 3600, 30m, 12h, 30d
    $ cncjs --allow-remote-access
    $ cncjs --controller Grbl
```

Instead of passing command line options for `--watch-directory`, `--access-token-lifetime`, `--allow-remote-access`, and `--controller`, you can create a `~/.cncrc` file that contains the following configuration in JSON format:
```json
{
    "mountPoints": [
        {
            "route": "/pendant",
            "target": "/home/pi/tinyweb"
        },
        {
            "route": "/widget",
            "target": "https://cncjs.github.io/cncjs-widget-boilerplate/v1/"
        }
    ],
    "watchDirectory": "/path/to/dir",
    "accessTokenLifetime": "30d",
    "allowRemoteAccess": false,
    "controller": ""
}
```

To troubleshoot issues, run:
```
cncjs -vvv
```

### Configuration File

The configuration file <b>.cncrc</b> contains settings that are equivalent to the cncjs command-line options. The configuration file is stored in user's home directory. To find out the actual location of the home directory, do the following:

* Linux/Mac
  ```sh
  echo $HOME
  ```

* Windows
  ```sh
  echo %USERPROFILE%
  ```

Check out an example configuration file [here](https://github.com/cncjs/cncjs/blob/master/examples/.cncrc).

### File Format

See https://github.com/cncjs/cncjs/issues/242#issuecomment-352294549 for a detailed explanation.

```json
{
  "ports": [
     {
       "comName": "/dev/ttyAMA0",
       "manufacturer": ""
     }
  ],
  "baudrates": [115200, 250000],
  "mountPoints": [
    {
      "route": "/widget",
      "target": "https://cncjs.github.io/cncjs-widget-boilerplate/v1/"
    }
  ],
  "watchDirectory": "/path/to/dir",
  "accessTokenLifetime": "30d",
  "allowRemoteAccess": false,
  "controller": "",
  "state": {
    "checkForUpdates": true,
    "controller": {
      "exception": {
        "ignoreErrors": false
      }
    }
  },
  "commands": [
    {
      "title": "Update (root user)",
      "commands": "sudo npm install -g cncjs@latest --unsafe-perm; pkill -f cncjs"
    },
    {
      "title": "Update (non-root user)",
      "commands": "npm install -g cncjs@latest; pkill -f cncjs"
    },
    {
      "title": "Reboot",
      "commands": "sudo /sbin/reboot"
    },
    {
      "title": "Shutdown",
      "commands": "sudo /sbin/shutdown"
    }
  ],
  "events": [],
  "macros": [],
  "users": []
}
```

# 🕣 Development History

## Beta 0.5.6 (Apr 1, 2021)
* Fixed jog stepping with keybindings, continuous jogging bugs, and other jogging unreliabilities
* Added new keybindings for improved, keyboard-based actions (unsure if issues with particular symbols such as '*' have persisted)
* Took another look through to ensure proper unit consistency and conversion
* Repairs to probing
* More work done on the Firmware tool for refined functions and display
* Indication of current jog preset selected
* New base modals created for use across tools and confirmations

## Beta 0.5.5 (Mar 26, 2021)
* Added combo laser/spindle widget (toggleable in settings)
* Re-designed location widget
* Re-designed layout of job status information to include min and max extents for file dimensions
* Added safe-height retraction settings for goto XYZ0 (accessible in settings)
* Added splash screen on application load
* Migration to most recent Electron release plus implemented logging

## Beta 0.5.4 (Mar 19, 2021)
* Set up in-app feedback sumbmission button
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

## Beta 0.1 (Mar 5, 2021)
* gSender decided as official name :D
* Buttons added for homing quicktravel, jog cancel, diagonal jog, and an awesome isocube!
* New macros widget
* New customizable settings: jogging presets, baud rate, and more.
* Visual overhaul on settings, probing, file attributes, and visual consistency accross entire program
* Logo implemented and the loading of Louis
* Responsiveness overhaul on entire program
* Mac (intel) version released March 8
    
## Alpha 3.0 (Feb 19, 2021)
* Continuous jogging!
* Unit switching in settings (metric/imperial)
* Keybinding functionality to jog and other key functions with keypresses (can change bindings in settings)
* Probe returning to original position
* New, separate settings files won't interfere with CNCjs
* Small colour and styling changes to hopefully increase clarity of items on the screen
* Some responsiveness addressed to help keep sender looking good across many screen sizes (though we still have a ways to go)
* Fixes to excessive decimal places in some areas
* New Firmware Tool in progress but will probably break your board right now

## Alpha 2.0 (Feb 5, 2021)
* Resolved non-functional buttons, missing console, and some errors during sending
* New jogging widget and jog presets
* Improved probe function plus probe continuity checking
* New file attributes on load
* More visual improvements and a large buildout in new settings options

## Alpha 1.0 (Jan 29, 2021)
* Still highly dependant on great infrastructure created by the CNCjs team
* Established Electron installer, git, and certificates 
* Large visual overhaul in how widgets and displayed and operational flow of sender
* New probing widget, machine profiles, settings, and visualizer

## Notable features still in progress:
* Win x32 version and Raspi versions
* "Flatten", "Surface", and "Calibrate" tools
* Handling tool changing
* Event hooks
* Joystick control
* Settings saving
* G-code editing
* Pendant
* Full 3D Visualization

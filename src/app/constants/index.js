/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

// AXIS
export const AXIS_E = 'e';
export const AXIS_X = 'x';
export const AXIS_Y = 'y';
export const AXIS_Z = 'z';
export const AXIS_A = 'a';
export const AXIS_B = 'b';
export const AXIS_C = 'c';

// Imperial System
export const IMPERIAL_UNITS = 'in';
export const IMPERIAL_STEPS = [
    0.0001,
    0.0002,
    0.0003,
    0.0005,
    0.001,
    0.002,
    0.003,
    0.005,
    0.01,
    0.02,
    0.03,
    0.05,
    0.1,
    0.2,
    0.3,
    0.5,
    1, // Default
    2,
    3,
    5,
    10,
    20
];

// Metric System
export const METRIC_UNITS = 'mm';
export const METRIC_STEPS = [
    0.001,
    0.002,
    0.003,
    0.005,
    0.01,
    0.02,
    0.03,
    0.05,
    0.1,
    0.2,
    0.3,
    0.5,
    1, // Default
    2,
    3,
    5,
    10,
    20,
    30,
    50,
    100,
    200,
    300,
    500
];

// Controller
export const GRBL = 'Grbl';
export const GRBLHAL = 'grblHAL';
export const MARLIN = 'Marlin';
export const SMOOTHIE = 'Smoothie';
export const TINYG = 'TinyG';

// Workflow State
export const WORKFLOW_STATE_IDLE = 'idle';
export const WORKFLOW_STATE_PAUSED = 'paused';
export const WORKFLOW_STATE_RUNNING = 'running';

// Grbl Active State
export const GRBL_ACTIVE_STATE_IDLE = 'Idle';
export const GRBL_ACTIVE_STATE_RUN = 'Run';
export const GRBL_ACTIVE_STATE_HOLD = 'Hold';
export const GRBL_ACTIVE_STATE_DOOR = 'Door';
export const GRBL_ACTIVE_STATE_HOME = 'Home';
export const GRBL_ACTIVE_STATE_SLEEP = 'Sleep';
export const GRBL_ACTIVE_STATE_ALARM = 'Alarm';
export const GRBL_ACTIVE_STATE_CHECK = 'Check';
export const GRBL_ACTIVE_STATE_JOG = 'Jog';
export const GRBL_ACTIVE_STATE_TESTING = 'Testing File';

// grblHal Active State
export const GRBL_HAL_ACTIVE_STATE_IDLE = 'Idle';
export const GRBL_HAL_ACTIVE_STATE_RUN = 'Run';
export const GRBL_HAL_ACTIVE_STATE_HOLD = 'Hold';
export const GRBL_HAL_ACTIVE_STATE_DOOR = 'Door';
export const GRBL_HAL_ACTIVE_STATE_HOME = 'Home';
export const GRBL_HAL_ACTIVE_STATE_SLEEP = 'Sleep';
export const GRBL_HAL_ACTIVE_STATE_ALARM = 'Alarm';
export const GRBL_HAL_ACTIVE_STATE_CHECK = 'Check';
export const GRBL_HAL_ACTIVE_STATE_JOG = 'Jog';
export const GRBL_HAL_ACTIVE_STATE_TESTING = 'Testing File';

export const LASER_MODE = 'laser';
export const SPINDLE_MODE = 'spindle';

export const ALL_CATEGORY = 'All';
export const CARVING_CATEGORY = 'Carving';
export const OVERRIDES_CATEGORY = 'Overrides';
export const VISUALIZER_CATEGORY = 'Visualizer';
export const LOCATION_CATEGORY = 'Location';
export const JOGGING_CATEGORY = 'Jogging';
export const MACRO_CATEGORY = 'Macros';
export const PROBING_CATEGORY = 'Probing';
export const SPINDLE_LASER_CATEGORY = 'Spindle/Laser';
export const GENERAL_CATEGORY = 'General';
export const TOOLBAR_CATEGORY = 'Toolbar';
export const COOLANT_CATEGORY = 'Coolant';
export const ALL_CATEGORIES = [ // keep in alphabetical order
    ALL_CATEGORY,
    CARVING_CATEGORY,
    COOLANT_CATEGORY,
    GENERAL_CATEGORY,
    JOGGING_CATEGORY,
    LOCATION_CATEGORY,
    MACRO_CATEGORY,
    OVERRIDES_CATEGORY,
    PROBING_CATEGORY,
    SPINDLE_LASER_CATEGORY,
    TOOLBAR_CATEGORY,
    VISUALIZER_CATEGORY,
];

export const RENDER_NO_FILE = 'RENDER_NO_FILE';
export const RENDER_LOADING = 'RENDER_LOADING';
export const RENDER_RENDERING = 'RENDER_RENDERING';
export const RENDER_RENDERED = 'RENDER_RENDERED';

export const SPIRAL_MOVEMENT = 'SPIRAL_MOVEMENT';
export const ZIG_ZAG_MOVEMENT = 'ZIG_ZAG_MOVEMENT';

export const START_POSITION_BACK_LEFT = 'START_POSITION_BACK_LEFT';
export const START_POSITION_BACK_RIGHT = 'START_POSITION_BACK_RIGHT';
export const START_POSITION_FRONT_LEFT = 'START_POSITION_FRONT_LEFT';
export const START_POSITION_FRONT_RIGHT = 'START_POSITION_FRONT_RIGHT';
export const START_POSITION_CENTER = 'START_POSITION_CENTER';

export const SURFACING_VISUALIZER_CONTAINER_ID = 'SURFACING_VISUALIZER_CONTAINER_ID';
export const VISUALIZER_PRIMARY = 'VISUALIZER_PRIMARY';
export const VISUALIZER_SECONDARY = 'VISUALIZER_SECONDARY';

export const MACRO_FORM_TYPES = ['ADD', 'EDIT'];

export const SPINDLE_MODES = ['M3', 'M4', 'M5'];

export const SURFACING_DWELL_DURATION = 4;

// Event Triggers
export const PROGRAM_START = 'gcode:start';
export const PROGRAM_END = 'gcode:stop';
export const PROGRAM_PAUSE = 'gcode:pause';
export const PROGRAM_RESUME = 'gcode:resume';

export const CONTROLLER_READY = 'controller:ready';

export const FILE_UNLOAD = 'file:unload';

export const FEED_HOLD = 'feedhold';
export const CYCLE_START = 'cyclestart';

export const HOMING = 'homing';
export const SLEEP = 'sleep';

export const MACRO_RUN = 'macro:run';
export const MACRO_LOAD = 'macro:load';

export const PROGRAM_EVENTS = [
    PROGRAM_START,
    PROGRAM_END,
    PROGRAM_PAUSE,
    PROGRAM_RESUME
];

export const USER_DATA_COLLECTION = {
    INITIAL: 'INITIAL',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
};

export const OVERRIDE_VALUE_RANGES = {
    MIN: 20,
    MAX: 200
};

export const ROTARY_MODE_FIRMWARE_SETTINGS = {
    $101: '19.75308642',
    $111: '8000.00',
    $21: '0'
};

export const WORKSPACE_MODE = {
    DEFAULT: 'DEFAULT',
    ROTARY: 'ROTARY',
};

export const FILE_TYPE = {
    DEFAULT: 'DEFAULT',
    ROTARY: 'ROTARY',
    FOUR_AXIS: 'FOUR_AXIS'
};

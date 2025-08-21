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
export const AXES = {
    AXIS_E: 'e',
    AXIS_X: 'x',
    AXIS_Y: 'y',
    AXIS_Z: 'z',
    AXIS_A: 'a',
    AXIS_B: 'b',
    AXIS_C: 'c',
};

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
    20,
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
    500,
];

// Controller
export const GRBL = 'Grbl';
export const GRBLHAL = 'grblHAL';
export const MARLIN = 'Marlin';
export const SMOOTHIE = 'Smoothie';
export const TINYG = 'TinyG';
export const FIRMWARE_TYPES = {
    GRBL: 'Grbl',
    GRBLHAL: 'grblHAL',
    MARLIN: 'Marlin',
    SMOOTHIE: 'Smoothie',
    TINYG: 'TinyG',
};

// Workflow State
export const WORKFLOW_STATE_IDLE = 'idle';
export const WORKFLOW_STATE_PAUSED = 'paused';
export const WORKFLOW_STATE_RUNNING = 'running';
export const WORKFLOW_STATES = {
    WORKFLOW_STATE_IDLE: 'idle',
    WORKFLOW_STATE_PAUSED: 'paused',
    WORKFLOW_STATE_RUNNING: 'running',
};

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
export const GRBL_ACTIVE_STATE_TOOL = 'Tool';
export const GRBL_ACTIVE_STATES = {
    GRBL_ACTIVE_STATE_IDLE: 'Idle',
    GRBL_ACTIVE_STATE_RUN: 'Run',
    GRBL_ACTIVE_STATE_HOLD: 'Hold',
    GRBL_ACTIVE_STATE_DOOR: 'Door',
    GRBL_ACTIVE_STATE_HOME: 'Home',
    GRBL_ACTIVE_STATE_SLEEP: 'Sleep',
    GRBL_ACTIVE_STATE_ALARM: 'Alarm',
    GRBL_ACTIVE_STATE_CHECK: 'Check',
    GRBL_ACTIVE_STATE_JOG: 'Jog',
    GRBL_ACTIVE_STATE_TESTING: 'Testing File',
    GRBL_ACTIVE_STATE_TOOL: 'Tool',
};

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
export const GRBL_HAL_ACTIVE_STATE_TOOL = 'Tool';
export const GRBL_HAL_ACTIVE_STATES = {
    GRBL_HAL_ACTIVE_STATE_IDLE: 'Idle',
    GRBL_HAL_ACTIVE_STATE_RUN: 'Run',
    GRBL_HAL_ACTIVE_STATE_HOLD: 'Hold',
    GRBL_HAL_ACTIVE_STATE_DOOR: 'Door',
    GRBL_HAL_ACTIVE_STATE_HOME: 'Home',
    GRBL_HAL_ACTIVE_STATE_SLEEP: 'Sleep',
    GRBL_HAL_ACTIVE_STATE_ALARM: 'Alarm',
    GRBL_HAL_ACTIVE_STATE_CHECK: 'Check',
    GRBL_HAL_ACTIVE_STATE_JOG: 'Jog',
    GRBL_HAL_ACTIVE_STATE_TOOL: 'Tool',
    GRBL_HAL_ACTIVE_STATE_TESTING: 'Testing File',
};

export const LASER_MODE = 'laser';
export const SPINDLE_MODE = 'spindle';
export const SPINDLE_LASER = {
    LASER_MODE: 'laser',
    SPINDLE_MODE: 'spindle',
};

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
export const ALL_CATEGORIES = [
    // keep in alphabetical order
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
export const SHORTCUT_CATEGORY = {
    // keep in alphabetical order
    // ALL_CATEGORY: 'All',
    CARVING_CATEGORY: 'Carving',
    OVERRIDES_CATEGORY: 'Overrides',
    VISUALIZER_CATEGORY: 'Visualizer',
    LOCATION_CATEGORY: 'Location',
    JOGGING_CATEGORY: 'Jogging',
    MACRO_CATEGORY: 'Macros',
    PROBING_CATEGORY: 'Probing',
    SPINDLE_LASER_CATEGORY: 'Spindle/Laser',
    GENERAL_CATEGORY: 'General',
    TOOLBAR_CATEGORY: 'Toolbar',
    COOLANT_CATEGORY: 'Coolant',
};

export const RENDER_NO_FILE = 'RENDER_NO_FILE';
export const RENDER_LOADING = 'RENDER_LOADING';
export const RENDER_RENDERING = 'RENDER_RENDERING';
export const RENDER_RENDERED = 'RENDER_RENDERED';
export const RENDER_STATE = {
    RENDER_NO_FILE: 'RENDER_NO_FILE',
    RENDER_LOADING: 'RENDER_LOADING',
    RENDER_RENDERING: 'RENDER_RENDERING',
    RENDER_RENDERED: 'RENDER_RENDERED',
};

export const SPIRAL_MOVEMENT = 'SPIRAL_MOVEMENT';
export const ZIG_ZAG_MOVEMENT = 'ZIG_ZAG_MOVEMENT';

export const START_POSITION_BACK_LEFT = 'START_POSITION_BACK_LEFT';
export const START_POSITION_BACK_RIGHT = 'START_POSITION_BACK_RIGHT';
export const START_POSITION_FRONT_LEFT = 'START_POSITION_FRONT_LEFT';
export const START_POSITION_FRONT_RIGHT = 'START_POSITION_FRONT_RIGHT';
export const START_POSITION_CENTER = 'START_POSITION_CENTER';

export const SURFACING_VISUALIZER_CONTAINER_ID =
    'SURFACING_VISUALIZER_CONTAINER_ID';
export const JOINTER_VISUALIZER_CONTAINER_ID =
    'JOINTER_VISUALIZER_CONTAINER_ID';
export const VISUALIZER_PRIMARY = 'VISUALIZER_PRIMARY';
export const VISUALIZER_SECONDARY = 'VISUALIZER_SECONDARY';
export const VISUALIZER_TYPES = {
    VISUALIZER_PRIMARY: 'VISUALIZER_PRIMARY',
    VISUALIZER_SECONDARY: 'VISUALIZER_SECONDARY',
};

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
    PROGRAM_RESUME,
];

export const USER_DATA_COLLECTION = {
    INITIAL: 'INITIAL',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
};

export const OVERRIDE_VALUE_RANGES = {
    MIN: 20,
    MAX: 200,
};

export const ROTARY_MODE_FIRMWARE_SETTINGS = {
    $101: '19.75308642',
    $111: '8000.00',
    $20: '0',
    $21: '0',
};

export const DEFAULT_FIRMWARE_SETTINGS = {
    $101: '200',
    $111: '4000',
    $20: '0',
    $21: '0',
};

export const WORKSPACE_MODE = {
    DEFAULT: 'DEFAULT',
    ROTARY: 'ROTARY',
};

export const FILE_TYPE = {
    DEFAULT: 'DEFAULT',
    ROTARY: 'ROTARY',
    FOUR_AXIS: 'FOUR_AXIS',
};

export const STOCK_TURNING_METHOD = {
    HALF_AND_HALF_SPIRALS: 'HALF_AND_HALF_SPIRALS',
    FULL_SPIRALS: 'FULL_SPIRALS',
};

export const ROTARY_TOGGLE_MACRO = `
    G04 P0.5
    G0 G90 Y[posy]
`;

export const ALARM = 'ALARM';
export const ERROR = 'ERROR';

export const ALARM_ERROR_TYPES = [ALARM, ERROR];

export const JOB_TYPES = {
    JOB: 'JOB',
    MAINTENANCE: 'MAINTENANCE',
};

export const JOB_STATUS = {
    COMPLETE: 'COMPLETE',
    STOPPED: 'STOPPED',
};

export const OVERALL_STATS = 'Overall Stats';
export const JOB_PER_PORT = 'Jobs Per Com Port';
export const RUN_TIME_PER_PORT = 'Run Time Per Com Port';

export const STATS_PAGES = {
    OVERALL_STATS,
    JOB_PER_PORT,
    RUN_TIME_PER_PORT,
};

export const DB_NAME = 'ParsedDataDB';
export const OBJECT_STORE = 'parsedData';
export const DATA_ID = 'data';

export const USAGE_TOOL_NAME = {
    LOCATION: 'LOCATION',
    JOG_CONTROL: 'JOG_CONTROL',
    PROBING: 'PROBING',
    MACROS: 'MACROS',
    CONSOLE: 'CONSOLE',
    COOLANT: 'COOLANT',
    SPINDLE_LASER: 'SPINDLE_LASER',
    ROTARY: 'ROTARY',
    DIAGNOSTICS: 'DIAGNOSTICS',
    SURFACING: 'SURFACING',
    XY_SQUARING: 'XY_SQUARING',
    MOVEMENT_TUNING: 'MOVEMENT_TUNING',
    FIRMWARE: 'FIRMWARE',
    HELP: 'HELP',
    SETTINGS: {
        GENERAL: 'GENERAL_SETTINGS',
        SAFETY: 'SAFETY_SETTINGS',
        PROBE: 'PROBE_SETTINGS',
        SPINDLE_LASER: 'SPINDLE_LASER_SETTINGS',
        VISUALIZER: 'VISUALIZER_SETTINGS',
        SHORTCUTS: {
            KEYBOARD: 'KEYBOARD_SETTINGS',
            GAMEPAD: 'GAMEPAD_SETTINGS',
        },
        JOB_HISTORY: {
            STATISTICS: 'STATISTICS',
            JOB_TABLE: 'JOB_TABLE',
            MAINTENANCE: 'MAINTENANCE',
        },
        PROGRAM_EVENTS: 'PROGRAM_EVENTS_SETTINGS',
        TOOL_CHANGE: 'TOOL_CHANGE_SETTINGS',
        ROTARY: 'ROTARY_SETTINGS',
    },
};

export const HOMING_LOCATIONS = {
    FRONT_RIGHT: 'FR',
    FRONT_LEFT: 'FL',
    BACK_RIGHT: 'BR',
    BACK_LEFT: 'BL',
    OTHER: 'OT',
};

export const TOGGLE_STATUS = {
    jobStatus: 'jobStatus',
    overrides: 'overrides',
};

export const CAMERA_MODE_PAN = 'pan';
export const CAMERA_MODE_ROTATE = 'rotate';
export const CAMERA_MODES = {
    CAMERA_MODE_PAN: 'CAMERA_MODE_PAN',
    CAMERA_MODE_ROTATE: 'CAMERA_MODE_ROTATE',
};

export const DARK_THEME = 'Dark';
export const LIGHT_THEME = 'Light';
export const CUST_THEME = 'Custom';
export const THEMES = {
    DARK_THEME: DARK_THEME,
    LIGHT_THEME: LIGHT_THEME,
    CUST_THEME: CUST_THEME,
};
export const ALL_THEMES = [DARK_THEME, LIGHT_THEME, CUST_THEME];
export const CUSTOMIZABLE_THEMES = [CUST_THEME];

export const TERMINAL_GREY = 249;
export const TERMINAL_RED = 196;
export const TERMINAL_ALARM_RED = 167;

export const START = 'START';
export const PAUSE = 'PAUSE';
export const STOP = 'STOP';
export const MACHINE_CONTROL_BUTTONS = {
    START: START,
    PAUSE: PAUSE,
    STOP: STOP,
};

export const LIGHT = 'Light';
export const EVERYTHING = 'Everything';
export const LIGHTWEIGHT_OPTIONS = {
    LIGHT: LIGHT,
    EVERYTHING: EVERYTHING,
};

// Outline Modes
export const OUTLINE_MODE_DETAILED = 'Detailed';
export const OUTLINE_MODE_SIMPLE = 'Square';
export const OUTLINE_MODES = [OUTLINE_MODE_DETAILED, OUTLINE_MODE_SIMPLE];
export const OUTLINE_TIMEOUT = 15000;

// const SPINDLE_LABELS = {
//     SLB_SPINDLE: "SLB_SPINDLE",
//     HUANYANG_V1: "Huanyang v1",

// }
// export type SPINDLE_LABELS = typeof SPINDLE_LABELS[keyof typeof SPINDLE_LABELS];

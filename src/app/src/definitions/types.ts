import {
    AXES,
    GRBL_ACTIVE_STATES,
    GRBL_HAL_ACTIVE_STATES,
    HOMING_LOCATIONS,
    RENDER_STATE,
    SHORTCUT_CATEGORY,
    USAGE_TOOL_NAME,
    USER_DATA_COLLECTION,
    WORKFLOW_STATES,
    SPINDLE_LASER,
    FIRMWARE_TYPES,
    WORKSPACE_MODE,
    FILE_TYPE,
    VISUALIZER_TYPES,
    TOGGLE_STATUS,
} from '../constants';
import { PROBE_TYPES, TOUCHPLATE_TYPES } from '../lib/constants';
import { probeDirections } from '../lib/Probing';
import { BasicObject } from './interfaces/general';

export type BasicType = string | number | boolean | Array<any> | BasicObject;

export type UNITS_GCODE = 'G20' | 'G21'; // G20: Inches, G21: Millimeters
export type UNITS_EN = 'mm' | 'in';
export type EEPROM = `$${string}`;

export type SPINDLE_LASER_T =
    (typeof SPINDLE_LASER)[keyof typeof SPINDLE_LASER];
export type AXES_T = (typeof AXES)[keyof typeof AXES];
export type WORKFLOW_STATES_T =
    (typeof WORKFLOW_STATES)[keyof typeof WORKFLOW_STATES];
export type GRBL_ACTIVE_STATES_T =
    (typeof GRBL_ACTIVE_STATES)[keyof typeof GRBL_ACTIVE_STATES];
export type GRBL_HAL_ACTIVE_STATES =
    (typeof GRBL_HAL_ACTIVE_STATES)[keyof typeof GRBL_HAL_ACTIVE_STATES];
export type SHORTCUT_CATEGORY_T =
    (typeof SHORTCUT_CATEGORY)[keyof typeof SHORTCUT_CATEGORY];
export type RENDER_STATE_T = (typeof RENDER_STATE)[keyof typeof RENDER_STATE];
export type USER_DATA_COLLECTION_T =
    (typeof USER_DATA_COLLECTION)[keyof typeof USER_DATA_COLLECTION];
export type USAGE_TOOL_NAME_T =
    (typeof USAGE_TOOL_NAME)[keyof typeof USAGE_TOOL_NAME];
export type HOMING_LOCATIONS_T =
    (typeof HOMING_LOCATIONS)[keyof typeof HOMING_LOCATIONS];
export type PROBE_DIRECTIONS =
    (typeof probeDirections)[keyof typeof probeDirections];
export type FIRMWARE_TYPES_T =
    (typeof FIRMWARE_TYPES)[keyof typeof FIRMWARE_TYPES];
export type WORKSPACE_MODE_T =
    (typeof WORKSPACE_MODE)[keyof typeof WORKSPACE_MODE];
export type PROBE_TYPES_T = (typeof PROBE_TYPES)[keyof typeof PROBE_TYPES];
export type TOUCHPLATE_TYPES_T =
    (typeof TOUCHPLATE_TYPES)[keyof typeof TOUCHPLATE_TYPES];
export type FILE_TYPE_T = (typeof FILE_TYPE)[keyof typeof FILE_TYPE];
export type VISUALIZER_TYPES_T =
    (typeof VISUALIZER_TYPES)[keyof typeof VISUALIZER_TYPES];
export type TOGGLE_STATUS_T =
    (typeof TOGGLE_STATUS)[keyof typeof TOGGLE_STATUS];

// Motion Mode
export type MOTION = 'G0' | 'G1' | 'G2' | 'G3' | 'G80';
// Coordinate System Select
export type WCS = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';
// Plane Select
// G17: XY-plane, G18: ZX-plane, G19: YZ-plane
export type PLANE = 'G17' | 'G18' | 'G19';
// Distance Mode
// G90: Absolute, G91: Relative
export type DISTANCE = 'G90' | 'G91';
// Arc IJK distance mode
export type ARC = `G${string}`;
// Feed Rate Mode
// G93: Inverse time mode, G94: Units per minute mode, G95: Units per rev mode
export type FEEDRATE = 'G93' | 'G94' | 'G95';
// Cutter Radius Compensation
export type CUTTER = `G${string}`;
// Tool Length Offset
export type TLO = 'G43.1' | 'G49';
// Program Mode
export type PROGRAM = 'M0' | 'M1' | 'M2' | 'M30';
// Spingle State
export type SPINDLE = 'M3' | 'M4' | 'M5';
// Coolant State
export type COOLANT = 'M7' | 'M8' | 'M7' | 'M8' | 'M9';
// Tool Select
export type TOOL = number;

export type FirmwareSetting = {
    [key: `$${number}`]: string;
};

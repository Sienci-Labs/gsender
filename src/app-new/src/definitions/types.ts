import {
    AXES,
    GRBL_ACTIVE_STATES,
    GRBL_HAL_ACTIVE_STATES,
    HOMING_LOCATIONS,
    RENDER_STATE,
    SHORTCUT_CATEGORY,
    USAGE_TOOL_NAME,
    USER_DATA_COLLECTION,
    WORKFLOW_STATES 
} from "../constants";

export type UNITS_GCODE = 'G20' | 'G21';
export type UNITS_EN = 'mm' | 'in';
export type EEPROM = `$${string}`;

export type AXES_T = typeof AXES[keyof typeof AXES];
export type WORKFLOW_STATES_T = typeof WORKFLOW_STATES[keyof typeof WORKFLOW_STATES];
export type GRBL_ACTIVE_STATES_T = typeof GRBL_ACTIVE_STATES[keyof typeof GRBL_ACTIVE_STATES];
export type GRBL_HAL_ACTIVE_STATES = typeof GRBL_HAL_ACTIVE_STATES[keyof typeof GRBL_HAL_ACTIVE_STATES];
export type SHORTCUT_CATEGORY_T = typeof SHORTCUT_CATEGORY[keyof typeof SHORTCUT_CATEGORY];
export type RENDER_STATE_T = typeof RENDER_STATE[keyof typeof RENDER_STATE];
export type USER_DATA_COLLECTION_T = typeof USER_DATA_COLLECTION[keyof typeof USER_DATA_COLLECTION];
export type USAGE_TOOL_NAME_T = typeof USAGE_TOOL_NAME[keyof typeof USAGE_TOOL_NAME];
export type HOMING_LOCATIONS_T = typeof HOMING_LOCATIONS[keyof typeof HOMING_LOCATIONS];
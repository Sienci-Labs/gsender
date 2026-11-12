import {
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
} from 'app/constants';
import { type TranslationKey, tk, translateKey } from 'app/i18n';

// Display names for keyboard/gamepad shortcut actions, keyed by command ID.
// The command IDs, titles and categories stored with each shortcut stay in
// English; only the text shown to the user is translated.
const COMMAND_TITLES: Record<string, TranslationKey> = {
    CCW_LASER_TEST: tk('workspace:keyboard.commands.ccwLaserTest'),
    CONFIRM_PROBE: tk('workspace:keyboard.commands.confirmProbe'),
    CONTROLLER_COMMAND_ERROR_CLEAR: tk(
        'workspace:keyboard.commands.controllerCommandErrorClear',
    ),
    CONTROLLER_COMMAND_HOMING: tk(
        'workspace:keyboard.commands.controllerCommandHoming',
    ),
    CONTROLLER_COMMAND_REALTIME_REPORT: tk(
        'workspace:keyboard.commands.controllerCommandRealtimeReport',
    ),
    CONTROLLER_COMMAND_RESET: tk(
        'workspace:keyboard.commands.controllerCommandReset',
    ),
    CONTROLLER_COMMAND_TOOLCHANGE_ACKNOWLEDGEMENT: tk(
        'workspace:keyboard.commands.controllerCommandToolchangeAcknowledgement',
    ),
    CONTROLLER_COMMAND_UNLOCK: tk(
        'workspace:keyboard.commands.controllerCommandUnlock',
    ),
    CONTROLLER_COMMAND_VIRTUAL_STOP_TOGGLE: tk(
        'workspace:keyboard.commands.controllerCommandVirtualStopToggle',
    ),
    COPY: tk('workspace:keyboard.commands.copy'),
    CUT: tk('workspace:keyboard.commands.cut'),
    CW_LASER_ON: tk('workspace:keyboard.commands.cwLaserOn'),
    CYCLE_JOG_PRESETS: tk('workspace:keyboard.commands.cycleJogPresets'),
    DISPLAY_MACHINE_INFO: tk('workspace:keyboard.commands.displayMachineInfo'),
    DISPLAY_NOTIFICATIONS: tk(
        'workspace:keyboard.commands.displayNotifications',
    ),
    FEEDRATE_OVERRIDE_M: tk('workspace:keyboard.commands.feedrateOverrideM'),
    FEEDRATE_OVERRIDE_MM: tk('workspace:keyboard.commands.feedrateOverrideMm'),
    FEEDRATE_OVERRIDE_P: tk('workspace:keyboard.commands.feedrateOverrideP'),
    FEEDRATE_OVERRIDE_PP: tk('workspace:keyboard.commands.feedrateOverridePp'),
    FEEDRATE_OVERRIDE_RESET: tk(
        'workspace:keyboard.commands.feedrateOverrideReset',
    ),
    FLOOD_COOLANT: tk('workspace:keyboard.commands.floodCoolant'),
    GO_TO_A_AXIS_ZERO: tk('workspace:keyboard.commands.goToAAxisZero'),
    GO_TO_XY_AXIS_ZERO: tk('workspace:keyboard.commands.goToXyAxisZero'),
    GO_TO_X_AXIS_ZERO: tk('workspace:keyboard.commands.goToXAxisZero'),
    GO_TO_Y_AXIS_ZERO: tk('workspace:keyboard.commands.goToYAxisZero'),
    GO_TO_Z_AXIS_ZERO: tk('workspace:keyboard.commands.goToZAxisZero'),
    HOMING_GO_TO_BACK_LEFT_CORNER: tk(
        'workspace:keyboard.commands.homingGoToBackLeftCorner',
    ),
    HOMING_GO_TO_BACK_RIGHT_CORNER: tk(
        'workspace:keyboard.commands.homingGoToBackRightCorner',
    ),
    HOMING_GO_TO_FRONT_LEFT_CORNER: tk(
        'workspace:keyboard.commands.homingGoToFrontLeftCorner',
    ),
    HOMING_GO_TO_FRONT_RIGHT_CORNER: tk(
        'workspace:keyboard.commands.homingGoToFrontRightCorner',
    ),
    HOMING_PARK: tk('workspace:keyboard.commands.homingPark'),
    JOG_A_MINUS: tk('workspace:keyboard.commands.jogAMinus'),
    JOG_A_PLUS: tk('workspace:keyboard.commands.jogAPlus'),
    JOG_SPEED_D: tk('workspace:keyboard.commands.jogSpeedD'),
    JOG_SPEED_I: tk('workspace:keyboard.commands.jogSpeedI'),
    JOG_X_M: tk('workspace:keyboard.commands.jogXM'),
    JOG_X_M_Y_P: tk('workspace:keyboard.commands.jogXMYP'),
    JOG_X_P: tk('workspace:keyboard.commands.jogXP'),
    JOG_X_P_Y_M: tk('workspace:keyboard.commands.jogXPYM'),
    JOG_X_Y_M: tk('workspace:keyboard.commands.jogXYM'),
    JOG_X_Y_P: tk('workspace:keyboard.commands.jogXYP'),
    JOG_Y_M: tk('workspace:keyboard.commands.jogYM'),
    JOG_Y_P: tk('workspace:keyboard.commands.jogYP'),
    JOG_Z_M: tk('workspace:keyboard.commands.jogZM'),
    JOG_Z_P: tk('workspace:keyboard.commands.jogZP'),
    LIGHTWEIGHT_MODE: tk('workspace:keyboard.commands.lightweightMode'),
    LOAD_FILE: tk('workspace:keyboard.commands.loadFile'),
    MIST_COOLANT: tk('workspace:keyboard.commands.mistCoolant'),
    OPEN_PROBE: tk('workspace:keyboard.commands.openProbe'),
    PASTE: tk('workspace:keyboard.commands.paste'),
    PAUSE_JOB: tk('workspace:keyboard.commands.pauseJob'),
    PROBE_DIAMETER_SCROLL_DOWN: tk(
        'workspace:keyboard.commands.probeDiameterScrollDown',
    ),
    PROBE_DIAMETER_SCROLL_UP: tk(
        'workspace:keyboard.commands.probeDiameterScrollUp',
    ),
    PROBE_ROTARY_Y_AXIS: tk('workspace:keyboard.commands.probeRotaryYAxis'),
    PROBE_ROTARY_Z_AXIS: tk('workspace:keyboard.commands.probeRotaryZAxis'),
    PROBE_ROUTINE_SCROLL_LEFT: tk(
        'workspace:keyboard.commands.probeRoutineScrollLeft',
    ),
    PROBE_ROUTINE_SCROLL_RIGHT: tk(
        'workspace:keyboard.commands.probeRoutineScrollRight',
    ),
    RUN_OUTLINE: tk('workspace:keyboard.commands.runOutline'),
    SET_N_JOG_PRESET: tk('workspace:keyboard.commands.setNJogPreset'),
    SET_P_JOG_PRESET: tk('workspace:keyboard.commands.setPJogPreset'),
    SET_R_JOG_PRESET: tk('workspace:keyboard.commands.setRJogPreset'),
    SPINDLE_OVERRIDE_M: tk('workspace:keyboard.commands.spindleOverrideM'),
    SPINDLE_OVERRIDE_MM: tk('workspace:keyboard.commands.spindleOverrideMm'),
    SPINDLE_OVERRIDE_P: tk('workspace:keyboard.commands.spindleOverrideP'),
    SPINDLE_OVERRIDE_PP: tk('workspace:keyboard.commands.spindleOverridePp'),
    SPINDLE_OVERRIDE_RESET: tk(
        'workspace:keyboard.commands.spindleOverrideReset',
    ),
    START_JOB: tk('workspace:keyboard.commands.startJob'),
    START_PROBE: tk('workspace:keyboard.commands.startProbe'),
    STOP_COOLANT: tk('workspace:keyboard.commands.stopCoolant'),
    STOP_JOB: tk('workspace:keyboard.commands.stopJob'),
    STOP_LASER_OFF: tk('workspace:keyboard.commands.stopLaserOff'),
    SWITCH_WORKSPACE_MODE: tk(
        'workspace:keyboard.commands.switchWorkspaceMode',
    ),
    TOGGLE_INFO_HELPER: tk('workspace:keyboard.commands.toggleInfoHelper'),
    TOGGLE_MOUNTING_SETUP: tk(
        'workspace:keyboard.commands.toggleMountingSetup',
    ),
    TOGGLE_ROTARY_SURFACING: tk(
        'workspace:keyboard.commands.toggleRotarySurfacing',
    ),
    TOGGLE_SHORTCUTS: tk('workspace:keyboard.commands.toggleShortcuts'),
    TOGGLE_SPINDLE_LASER_MODE: tk(
        'workspace:keyboard.commands.toggleSpindleLaserMode',
    ),
    UNDO: tk('workspace:keyboard.commands.undo'),
    UNLOAD_FILE: tk('workspace:keyboard.commands.unloadFile'),
    VISUALIZER_VIEW_3D: tk('workspace:keyboard.commands.visualizerView3d'),
    VISUALIZER_VIEW_CYCLE: tk(
        'workspace:keyboard.commands.visualizerViewCycle',
    ),
    VISUALIZER_VIEW_FRONT: tk(
        'workspace:keyboard.commands.visualizerViewFront',
    ),
    VISUALIZER_VIEW_LEFT: tk('workspace:keyboard.commands.visualizerViewLeft'),
    VISUALIZER_VIEW_RESET: tk(
        'workspace:keyboard.commands.visualizerViewReset',
    ),
    VISUALIZER_VIEW_RIGHT: tk(
        'workspace:keyboard.commands.visualizerViewRight',
    ),
    VISUALIZER_VIEW_TOP: tk('workspace:keyboard.commands.visualizerViewTop'),
    VISUALIZER_ZOOM_FIT: tk('workspace:keyboard.commands.visualizerZoomFit'),
    VISUALIZER_ZOOM_IN: tk('workspace:keyboard.commands.visualizerZoomIn'),
    VISUALIZER_ZOOM_OUT: tk('workspace:keyboard.commands.visualizerZoomOut'),
    ZERO_ALL_AXIS: tk('workspace:keyboard.commands.zeroAllAxis'),
    ZERO_A_AXIS: tk('workspace:keyboard.commands.zeroAAxis'),
    ZERO_X_AXIS: tk('workspace:keyboard.commands.zeroXAxis'),
    ZERO_Y_AXIS: tk('workspace:keyboard.commands.zeroYAxis'),
    ZERO_Z_AXIS: tk('workspace:keyboard.commands.zeroZAxis'),
};

const CATEGORY_LABELS: Record<string, TranslationKey> = {
    [ALL_CATEGORY]: tk('workspace:keyboard.categories.all'),
    [CARVING_CATEGORY]: tk('workspace:keyboard.categories.carving'),
    [COOLANT_CATEGORY]: tk('workspace:keyboard.categories.coolant'),
    [GENERAL_CATEGORY]: tk('workspace:keyboard.categories.general'),
    [JOGGING_CATEGORY]: tk('workspace:keyboard.categories.jogging'),
    [LOCATION_CATEGORY]: tk('workspace:keyboard.categories.location'),
    [MACRO_CATEGORY]: tk('workspace:keyboard.categories.macros'),
    [OVERRIDES_CATEGORY]: tk('workspace:keyboard.categories.overrides'),
    [PROBING_CATEGORY]: tk('workspace:keyboard.categories.probing'),
    [SPINDLE_LASER_CATEGORY]: tk('workspace:keyboard.categories.spindleLaser'),
    [TOOLBAR_CATEGORY]: tk('workspace:keyboard.categories.toolbar'),
    [VISUALIZER_CATEGORY]: tk('workspace:keyboard.categories.visualizer'),
};

/**
 * Translated display name for a shortcut action. Falls back to the given
 * title (e.g. a macro name) for commands without a display key.
 */
export const getShortcutTitle = (cmd: string, fallback?: string): string => {
    const key = COMMAND_TITLES[cmd];
    return key ? translateKey(key) : (fallback ?? cmd);
};

/** Translated display name for a shortcut category value. */
export const getCategoryLabel = (category: string): string => {
    const key = CATEGORY_LABELS[category];
    return key ? translateKey(key) : category;
};

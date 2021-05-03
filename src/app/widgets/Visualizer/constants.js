import constants from 'namespace-constants';

export const {
    MODAL_WATCH_DIRECTORY,
    NOTIFICATION_PROGRAM_ERROR,
    NOTIFICATION_M0_PROGRAM_PAUSE,
    NOTIFICATION_M1_PROGRAM_PAUSE,
    NOTIFICATION_M2_PROGRAM_END,
    NOTIFICATION_M30_PROGRAM_END,
    NOTIFICATION_M6_TOOL_CHANGE,
    NOTIFICATION_M109_SET_EXTRUDER_TEMPERATURE,
    NOTIFICATION_M190_SET_HEATED_BED_TEMPERATURE
} = constants('widgets/Visualizer', [
    'MODAL_WATCH_DIRECTORY',
    'NOTIFICATION_PROGRAM_ERROR',
    'NOTIFICATION_M0_PROGRAM_PAUSE',
    'NOTIFICATION_M1_PROGRAM_PAUSE',
    'NOTIFICATION_M2_PROGRAM_END',
    'NOTIFICATION_M30_PROGRAM_END',
    'NOTIFICATION_M6_TOOL_CHANGE',
    'NOTIFICATION_M109_SET_EXTRUDER_TEMPERATURE',
    'NOTIFICATION_M190_SET_HEATED_BED_TEMPERATURE'
]);

export const CAMERA_MODE_PAN = 'pan';
export const CAMERA_MODE_ROTATE = 'rotate';

export const PRIMARY_COLOR = '#3E85C7'; // Light Blue
export const BORDER_COLOR = '#9CA3AF';
export const SECONDARY_COLOR = '#6F7376'; // Grey (for disabled look)


export const DARK_THEME_VALUES = {
    backgroundColor: '#111827', //Navy Blue
    gridColor: '#77a9d7', // Turqoise / Light Blue
    xAxisColor: '#df3b3b', //Indian Red
    yAxisColor: '#06b881', //Light Green
    zAxisColor: '#295d8d', //Light Green
    limitColor: '#5191cc', //Indian Red
    cuttingCoordinateLines: '#fff', //White
    joggingCoordinateLines: '#0ef6ae', // Light Green
    G0Color: '#0ef6ae', // Light Green
    G1Color: '#3e85c7', // Light Blue
    G2Color: '#3e85c7', // Light Blue
    G3Color: '#3e85c7', // Light Blue
};

export const LIGHT_THEME_VALUES = {
    backgroundColor: '#e5e7eb', //Navy Blue
    gridColor: '#000000', // Turqoise / Light Blue
    xAxisColor: '#df3b3b', //Indian Red
    yAxisColor: '#06b881', //Light Green
    zAxisColor: '#295d8d', //Light Green
    limitColor: '#5191cc', //Indian Red
    cuttingCoordinateLines: '#000000',
    joggingCoordinateLines: '#0ef6ae', // Light Green
    G0Color: '#0ef6ae', // Light Green
    G1Color: '#111827', // Light Blue
    G2Color: '#111827', // Light Blue
    G3Color: '#111827', // Light Blue
};

export const DARK_THEME = 'Dark';
export const LIGHT_THEME = 'Light';

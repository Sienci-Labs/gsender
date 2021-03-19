import constants from 'namespace-constants';

// Modal
export const {
    MODAL_NONE,
    MODAL_SETTINGS
} = constants('widgets/Axes', [
    'MODAL_NONE',
    'MODAL_SETTINGS'
]);

// Axes
export const DEFAULT_AXES = ['x', 'y', 'z'];

export const PRIMARY_COLOR = '#3e85c7'; // Light Blue
export const BORDER_COLOR = '#9CA3AF';
export const SECONDARY_COLOR = '#9ca3af'; // Grey (for disabled look)

export const XY_MAX = 300;
export const XY_MIN = 0.01;
export const Z_MAX = 30;
export const Z_MIN = 0.01;
export const FEEDRATE_MAX = 50000;
export const FEEDRATE_MIN = 50;

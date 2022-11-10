import constants from 'namespace-constants';
import { createAction } from 'redux-action';

export const {
    SET_SHORTCUTS_LIST,
    HOLD_SHORTCUTS,
    UNHOLD_SHORTCUTS
} = constants('connection', [
    'SET_CURRENT_VISUALIZER',
    'SET_LASER_MODE'
]);

export const updateShortcutsList = createAction(SET_SHORTCUTS_LIST);
export const holdShortcutsListener = createAction(HOLD_SHORTCUTS);
export const unholdShortcutsListener = createAction(UNHOLD_SHORTCUTS);

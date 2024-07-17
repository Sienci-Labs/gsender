import constants from 'namespace-constants';
import { createAction } from 'redux-action';

export const {
    SET_SHORTCUTS_LIST,
    HOLD_SHORTCUTS,
    UNHOLD_SHORTCUTS,
    SET_IP_LIST,
} = constants('connection', [
    'SET_SHORTCUTS_LIST',
    'HOLD_SHORTCUTS',
    'UNHOLD_SHORTCUTS',
    'SET_IP_LIST',
]);

export const updateShortcutsList = createAction(SET_SHORTCUTS_LIST);
export const holdShortcutsListener = createAction(HOLD_SHORTCUTS);
export const unholdShortcutsListener = createAction(UNHOLD_SHORTCUTS);
export const updateIpList = createAction(SET_IP_LIST);

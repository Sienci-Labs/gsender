import includes from 'lodash/includes';
import get from 'lodash/get';
import {
    WORKFLOW_STATE_RUNNING,
    GRBL,
    GRBLHAL,
    GRBL_ACTIVE_STATE_IDLE,
} from 'app/constants';

export const canClick = (
    isConnected: boolean,
    workflow: any,
    state: any,
    type: any,
) => {
    if (!isConnected) {
        return false;
    }

    if (workflow.state === WORKFLOW_STATE_RUNNING) {
        return false;
    }

    if (!includes([GRBL, GRBLHAL], type)) {
        return false;
    }

    const activeState = get(state, 'status.activeState');
    const states = [GRBL_ACTIVE_STATE_IDLE];

    return includes(states, activeState);
};

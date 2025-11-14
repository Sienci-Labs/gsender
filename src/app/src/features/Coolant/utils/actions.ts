import { GRBL, GRBL_ACTIVE_STATE_IDLE, GRBLHAL, WORKFLOW_STATE_RUNNING } from 'app/constants';
import controller from 'app/lib/controller';
import { get } from 'lodash';
import reduxStore from 'app/store/redux';

export function startMist() {
    controller.command('gcode', 'M7');
}

export function startFlood() {
    controller.command('gcode', 'M8');
}

export function stopCoolant() {
    controller.command('gcode', 'M9');
}

export const canRunShortcut = (): boolean => {
    const isConnected = get(
        reduxStore.getState(),
        'connection.isConnected',
    );
    const workflow = get(reduxStore.getState(), 'controller.workflow');
    const controllerType = get(reduxStore.getState(), 'controller.type');
    const controllerState = get(reduxStore.getState(), 'controller.state');

    if (!isConnected) return false;
    if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
    if (![GRBL, GRBLHAL].includes(controllerType)) return false;

    const activeState = controllerState?.status?.activeState;
    return activeState === GRBL_ACTIVE_STATE_IDLE;
};

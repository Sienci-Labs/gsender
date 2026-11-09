import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_DOOR,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_TOOL,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';

export type CarveMode =
    | 'disconnected'
    | 'toolchange'
    | 'alarm'
    | 'holdJob'
    | 'running'
    | 'holdIdle'
    | 'setup';

export interface CarveModeInputs {
    isConnected: boolean;
    workflowState: string;
    activeState: string;
    wizardVisible: boolean;
}

const isHoldState = (activeState: string) =>
    activeState === GRBL_ACTIVE_STATE_HOLD ||
    activeState === GRBL_ACTIVE_STATE_DOOR;

/** First match wins - see CARVE_REDESIGN_SPEC.md §3. */
export function resolveCarveMode({
    isConnected,
    workflowState,
    activeState,
    wizardVisible,
}: CarveModeInputs): CarveMode {
    if (!isConnected) return 'disconnected';
    if (wizardVisible || activeState === GRBL_ACTIVE_STATE_TOOL) {
        return 'toolchange';
    }
    if (activeState === GRBL_ACTIVE_STATE_ALARM) return 'alarm';
    if (
        workflowState === WORKFLOW_STATE_PAUSED ||
        (workflowState === WORKFLOW_STATE_RUNNING && isHoldState(activeState))
    ) {
        return 'holdJob';
    }
    if (workflowState === WORKFLOW_STATE_RUNNING) return 'running';
    if (isHoldState(activeState)) return 'holdIdle';
    return 'setup';
}

/** Alarm 11 (grblHAL) or 'Homing' (grbl) is the homing-required lockout. */
export const isHomingAlarm = (alarmCode: unknown) =>
    alarmCode === 11 || alarmCode === 'Homing';

/** Modes whose layout runs with a job in progress. */
export const isJobMode = (mode: CarveMode) =>
    mode === 'running' || mode === 'holdJob' || mode === 'toolchange';

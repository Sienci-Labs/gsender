import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import get from 'lodash/get';

/** Zero / Go To / Home gating, shared by DROCard and the carve screen. */
export function useDroGating() {
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const workflowState = useTypedSelector(
        (s: RootState) => s.controller.workflow.state,
    );
    const activeState = useTypedSelector(
        (s: RootState) => s.controller.state.status?.activeState ?? '',
    );
    const homingEnabled = useTypedSelector(
        (s: RootState) =>
            Number(get(s, 'controller.settings.settings.$22', 0)) > 0,
    );
    const alarmCode = useTypedSelector(
        (s: RootState) => s.controller.state.status?.alarmCode ?? 0,
    ) as string | number;
    const isHomingAlarm =
        activeState === GRBL_ACTIVE_STATE_ALARM &&
        (alarmCode === 11 || alarmCode === 'Homing');
    const canZero =
        isConnected &&
        workflowState !== WORKFLOW_STATE_RUNNING &&
        (activeState === GRBL_ACTIVE_STATE_IDLE ||
            activeState === GRBL_ACTIVE_STATE_JOG);
    const canGoTo = canZero;
    const canHome = (canGoTo && homingEnabled) || isHomingAlarm;

    return { isConnected, canZero, canGoTo, canHome, isHomingAlarm };
}

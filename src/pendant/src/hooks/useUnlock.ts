import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_HOLD,
    GRBLHAL,
} from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import type { RootState } from 'app/store/redux';

/**
 * The pendant's unlock path (Alarm → reset:limit / homing / unlock,
 * Hold → cyclestart) and soft reset, shared by PendantTopBar and the
 * carve screen's locked cards.
 */
export function useUnlock() {
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const controllerType = useTypedSelector(
        (s: RootState) => s.controller.type,
    );
    const rawState = useTypedSelector(
        (s: RootState) => s.controller.state,
    ) as any;
    const activeState: string = rawState?.status?.activeState ?? '';
    const alarmCode: string | number = rawState?.status?.alarmCode ?? 0;

    const unlockActionable =
        isConnected &&
        (activeState === GRBL_ACTIVE_STATE_HOLD ||
            activeState === GRBL_ACTIVE_STATE_ALARM);
    const isHomingAlarm = alarmCode === 11 || alarmCode === 'Homing';

    const handleUnlock = () => {
        if (!isConnected) return;

        if (activeState === GRBL_ACTIVE_STATE_ALARM) {
            if (
                alarmCode === 1 ||
                alarmCode === 2 ||
                alarmCode === 10 ||
                alarmCode === 14 ||
                alarmCode === 17
            ) {
                controller.command('reset:limit');
            } else if (alarmCode === 11 || alarmCode === 'Homing') {
                controller.command('homing');
            } else {
                controller.command('unlock');
            }
            return;
        }

        if (activeState === GRBL_ACTIVE_STATE_HOLD) {
            controller.command('cyclestart');
        }
    };

    /** Same branch cancelJog takes for a non-idle, non-jog state. */
    const handleReset = () => {
        if (!isConnected) return;
        if (controllerType === GRBLHAL) {
            controller.command('reset:soft');
            return;
        }
        controller.command('reset');
    };

    return {
        activeState,
        alarmCode,
        isHomingAlarm,
        unlockActionable,
        handleUnlock,
        handleReset,
    };
}

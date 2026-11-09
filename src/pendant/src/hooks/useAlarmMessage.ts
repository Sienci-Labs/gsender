import { normalizeHelperMessage } from 'app/features/Helper/messages/normalize';
import type { NormalizedHelperMessage } from 'app/features/Helper/messages/types';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { useMemo } from 'react';

/** The helper-registry message for the current alarm code, if any. */
export function useAlarmMessage(): NormalizedHelperMessage | null {
    const alarmCode = useTypedSelector(
        (s: RootState) => s.controller.state.status?.alarmCode ?? 0,
    ) as string | number;
    const controllerType = useTypedSelector(
        (s: RootState) => s.controller.type,
    );
    const controllerAlarms = useTypedSelector(
        (s: RootState) => (s.controller.settings as any)?.alarms,
    );

    return useMemo(() => {
        if (alarmCode === 0 || alarmCode === '0' || alarmCode === '') {
            return null;
        }
        return normalizeHelperMessage(
            { kind: 'alarm', code: alarmCode },
            { controllerType, controllerAlarms },
        );
    }, [alarmCode, controllerType, controllerAlarms]);
}

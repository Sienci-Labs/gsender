import { GRBL_ACTIVE_STATE_ALARM } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { useEffect, useRef } from 'react';
import { haptic } from '../lib/haptics';

/**
 * Double buzz each time the controller enters Alarm. The previous state starts
 * as the state at mount, so reloading the page mid-alarm doesn't buzz.
 */
export function useAlarmHaptics(): void {
    const activeState = useTypedSelector(
        (state: RootState) => state.controller.state.status?.activeState ?? '',
    );
    const previousRef = useRef(activeState);

    useEffect(() => {
        const previous = previousRef.current;
        previousRef.current = activeState;
        if (
            activeState === GRBL_ACTIVE_STATE_ALARM &&
            previous !== GRBL_ACTIVE_STATE_ALARM
        ) {
            haptic('alarm');
        }
    }, [activeState]);
}

import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { useAlarmMessage } from '../../../hooks/useAlarmMessage';
import { type CarveMode, isHomingAlarm } from '../carveMode';

/** Alarm text for the top bar: `label` for the status badge ("Alarm 10") and
 * `headline` for the centre slot ("Alarm 10 - E-stop Engaged"). Null outside
 * alarm mode. */
export function useAlarmHeadline(
    mode: CarveMode,
): { label: string; headline: string } | null {
    const alarmCode = useTypedSelector(
        (s: RootState) => s.controller.state.status?.alarmCode ?? 0,
    );
    const alarmMessage = useAlarmMessage();

    if (mode !== 'alarm') return null;

    const hasCode =
        alarmCode !== 0 && alarmCode !== '0' && alarmCode !== '';
    // Homing lock reports a non-numeric code; it has no number to show
    const numeric = hasCode && Number.isFinite(Number(alarmCode));
    const label = numeric ? `Alarm ${alarmCode}` : 'Alarm';
    const title =
        alarmMessage?.title ??
        (isHomingAlarm(alarmCode) ? 'Homing required' : null);

    return { label, headline: title ? `${label} - ${title}` : label };
}

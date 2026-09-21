import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import Tooltip from 'app/components/Tooltip';
import { GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_HOLD } from 'app/constants';
import type { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { homeMachine } from 'app/features/DRO/utils/DRO';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import type { RootState } from 'app/store/redux';
import cx from 'classnames';
import get from 'lodash/get';
import { IoLockClosedOutline, IoLockOpenOutline } from 'react-icons/io5';
import posthog from 'posthog-js';

// Grbl ALARM codes 6-9 mean the homing cycle itself failed, so the reported
// machine position cannot be trusted. Unlocking straight from this state lets
// the operator jog/run G-code against a position that is likely wrong.
const HOMING_FAILURE_ALARM_CODES = [6, 7, 8, 9];
// ALARM 8/9 specifically mean a limit switch was not found or would not
// release, so unlike 6/7 they won't be fixed by re-homing alone until the
// switch/wiring itself is repaired.
const LIMIT_SWITCH_FAULT_ALARM_CODES = [8, 9];

export function isHomingFailureAlarm(code: string | number): boolean {
    return (
        typeof code === 'number' && HOMING_FAILURE_ALARM_CODES.includes(code)
    );
}

export function isLimitSwitchFaultAlarm(code: string | number): boolean {
    return (
        typeof code === 'number' &&
        LIMIT_SWITCH_FAULT_ALARM_CODES.includes(code)
    );
}

export function confirmUnlockAfterHomingFailure(
    code: string | number,
    onConfirm: () => void,
): void {
    Confirm({
        title: 'Homing Not Complete',
        content: (
            <>
                <p>
                    {
                        'The last homing cycle failed, so the machine position is unknown. Re-home the machine before continuing. Unlocking without re-homing may let jogging or a job run past the limit switches.'
                    }
                </p>
                {isLimitSwitchFaultAlarm(code) && (
                    <p className="mt-2">
                        {
                            'ALARM:8 and ALARM:9 mean a limit switch was not found or would not release, so re-homing will keep failing until the switch or its wiring is fixed. To use the machine without homing until then: choose Unlock Anyway, open Config > Homing/Limits, turn off "Homing cycle enable" ($22) and click Apply Settings.'
                        }
                    </p>
                )}
            </>
        ),
        confirmLabel: 'Rehome',
        cancelLabel: 'Unlock Anyway',
        onConfirm: homeMachine,
        onClose: onConfirm,
    });
}

export function unlockFirmware(
    state: GRBL_ACTIVE_STATES_T,
    code: string | number,
) {
    if (state === GRBL_ACTIVE_STATE_ALARM) {
        if (code === 17 || code === 10) {
            posthog.capture('machine_unlocked', {
                alarm_code: code,
                active_state: state,
                method: 'reset_limit',
            });
            controller.command('reset:limit');
        } else if (isHomingFailureAlarm(code)) {
            confirmUnlockAfterHomingFailure(code, () => {
                controller.command('unlock');
            });
        } else {
            posthog.capture('machine_unlocked', {
                alarm_code: code,
                active_state: state,
                method: 'unlock',
            });
            controller.command('unlock');
        }

        if (code === 11 || code === 'Homing') {
            controller.command('populateConfig');
        }
        return;
    }
    posthog.capture('machine_unlocked', {
        alarm_code: code,
        active_state: state,
        method: 'cycle_start',
    });
    controller.command('cyclestart');
}

export function UnlockButton() {
    const status = useTypedSelector(
        (state: RootState) => state.controller.state.status,
    );
    const activeState = get(status, 'activeState', 'Idle');
    const alarmCode = get(status, 'alarmCode', 0);

    const isHold = activeState === GRBL_ACTIVE_STATE_HOLD;
    const isAlarm = activeState === GRBL_ACTIVE_STATE_ALARM;
    const activateUnlockButton = isHold || isAlarm;

    const ariaLabel = activateUnlockButton
        ? `Machine is ${isAlarm ? 'locked in alarm' : 'held'}. Click to unlock machine.`
        : 'Machine is unlocked.';

    return (
        <div className="text-4xl absolute top-3 max-xl:top-2 left-72 max-sm:left-56">
            <Tooltip content="Unlock Machine">
                <button
                    className={cx('group text-gray-400', {
                        'text-yellow-600 bg-orange-200 bg-opacity-10 rounded':
                            activateUnlockButton,
                    })}
                    onClick={() => unlockFirmware(activeState, alarmCode)}
                    aria-label={ariaLabel}
                    role="button"
                >
                    <IoLockOpenOutline
                        className={cx('hidden group-hover:block', {
                            'animate-pulse': activateUnlockButton,
                        })}
                    />
                    <IoLockClosedOutline
                        className={cx('group-hover:hidden', {
                            'animate-pulse': activateUnlockButton,
                        })}
                    />
                </button>
            </Tooltip>
        </div>
    );
}

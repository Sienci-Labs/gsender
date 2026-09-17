import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import Tooltip from 'app/components/Tooltip';
import { GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_HOLD } from 'app/constants';
import type { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import type { RootState } from 'app/store/redux';
import cx from 'classnames';
import get from 'lodash/get';
import { IoLockClosedOutline, IoLockOpenOutline } from 'react-icons/io5';

// Grbl ALARM codes 6-9 mean the homing cycle itself failed, so the reported
// machine position cannot be trusted. Unlocking straight from this state lets
// the operator jog/run G-code against a position that is likely wrong.
const HOMING_FAILURE_ALARM_CODES = [6, 7, 8, 9];

export function isHomingFailureAlarm(code: string | number): boolean {
    return (
        typeof code === 'number' && HOMING_FAILURE_ALARM_CODES.includes(code)
    );
}

export function confirmUnlockAfterHomingFailure(onConfirm: () => void): void {
    Confirm({
        title: 'Homing Failed',
        content:
            'Homing failed, so the machine position may be lost. Unlocking without re-homing can result in unexpected movement. Are you sure you want to unlock without re-homing?',
        onConfirm,
        confirmLabel: 'Unlock Anyway',
    });
}

export function unlockFirmware(
    state: GRBL_ACTIVE_STATES_T,
    code: string | number,
) {
    if (state === GRBL_ACTIVE_STATE_ALARM) {
        if (code === 17 || code === 10) {
            controller.command('reset:limit');
        } else if (isHomingFailureAlarm(code)) {
            confirmUnlockAfterHomingFailure(() => {
                controller.command('unlock');
            });
        } else {
            controller.command('unlock');
        }

        if (code === 11 || code === 'Homing') {
            controller.command('populateConfig');
        }
        return;
    }
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

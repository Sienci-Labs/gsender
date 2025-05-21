import { IoLockClosedOutline } from 'react-icons/io5';
import { IoLockOpenOutline } from 'react-icons/io5';
import { RootState } from 'app/store/redux';
import { GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_HOLD } from 'app/constants';
import cx from 'classnames';
import get from 'lodash/get';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import controller from 'app/lib/controller.ts';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';

export function unlockFirmware(
    state: GRBL_ACTIVE_STATES_T,
    code: string | number,
) {
    if (state === GRBL_ACTIVE_STATE_ALARM) {
        controller.command('unlock');
        if (code === 11 || code === 'Homing') {
            controller.command('populateConfig');
        }
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

    return (
        <div className="text-4xl absolute top-3 max-xl:top-2 left-72">
            <button
                className={cx('group text-gray-400', {
                    'text-yellow-600 bg-orange-200 bg-opacity-10 rounded':
                        activateUnlockButton,
                })}
                onClick={() => unlockFirmware(activeState, alarmCode)}
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
        </div>
    );
}

import { IoLockClosedOutline } from 'react-icons/io5';
import { IoLockOpenOutline } from 'react-icons/io5';
import { RootState } from 'app/store/redux';
import { GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_HOLD } from 'app/constants';
import cx from 'classnames';
import get from 'lodash/get';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import controller from 'app/lib/controller.ts';

export function unlockFirmware(state) {
    if (state === GRBL_ACTIVE_STATE_ALARM) {
        return controller.command('unlock');
    }
    controller.command('cyclestart');
}

export function UnlockButton() {
    const status = useTypedSelector(
        (state: RootState) => state.controller.state.status,
    );
    const activeState = get(status, 'activeState', 'Idle');

    const isHold = activeState === GRBL_ACTIVE_STATE_HOLD;
    const isAlarm = activeState === GRBL_ACTIVE_STATE_ALARM;
    const activateUnlockButton = isHold || isAlarm;

    return (
        <div className="text-4xl absolute top-3 left-72">
            <button
                className={cx('group text-gray-400', {
                    'animate-pulse text-yellow-600': activateUnlockButton,
                })}
                onClick={() => unlockFirmware(activeState)}
            >
                <IoLockOpenOutline
                    className={cx('hidden group-hover:block', {
                        '': activateUnlockButton,
                    })}
                />
                <IoLockClosedOutline
                    className={cx('group-hover:hidden', {
                        '': activateUnlockButton,
                    })}
                />
            </button>
        </div>
    );
}

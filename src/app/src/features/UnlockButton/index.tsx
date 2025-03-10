import { IoLockClosedOutline } from 'react-icons/io5';
import { IoLockOpenOutline } from 'react-icons/io5';
import { RootState } from 'app/store/redux';
import { GRBL_ACTIVE_STATE_HOLD } from 'app/constants';
import cx from 'classnames';
import get from 'lodash/get';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import controller from 'app/lib/controller.ts';

export function unlockFirmware() {
    controller.command('cyclestart');
}

export function UnlockButton() {
    const status = useTypedSelector(
        (state: RootState) => state.controller.state.status,
    );
    const activeState = get(status, 'activeState', 'Idle');

    const isHold = activeState === GRBL_ACTIVE_STATE_HOLD;
    console.log(isHold);
    return (
        <div className="text-4xl">
            <button
                className={cx('group text-gray-400', {
                    'animate-pulse text-yellow-600': isHold,
                })}
                onClick={unlockFirmware}
            >
                <IoLockOpenOutline
                    className={cx('hidden group-hover:block', {
                        '': isHold,
                    })}
                />
                <IoLockClosedOutline
                    className={cx('group-hover:hidden', {
                        '': isHold,
                    })}
                />
            </button>
        </div>
    );
}

import blVector from '../assets/bl.svg';
import brVector from '../assets/br.svg';
import frVector from '../assets/fr.svg';
import flVector from '../assets/fl.svg';
import controller from 'app/lib/controller.ts';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import {
    BACK_LEFT,
    BACK_RIGHT,
    FRONT_LEFT,
    FRONT_RIGHT,
    getMovementGCode,
} from 'app/features/DRO/utils/RapidPosition';
import get from 'lodash/get';
import cx from 'classnames';

export function RapidPositionButtons({ disabled = false }) {
    const homingFlag = useSelector(
        (state: RootState) => state.controller.homingFlag,
    );
    const homingDirection = useSelector((state: RootState) => {
        return get(state, 'controller.settings.settings.$23', '0');
    });
    const pullOff = useSelector((state: RootState) => {
        return get(state, 'controller.settings.settings.$27', 1);
    });

    function jogToCorner(corner: string) {
        const gcode = getMovementGCode(
            corner,
            homingDirection,
            homingFlag,
            Number(pullOff),
        );
        controller.command('gcode', gcode);
    }

    return (
        <div className="absolute justify-center items-center -top-1 left-1/2 text-blue-500 rapidButtonTransform portrait:rapidButtonTransformPortrait">
            <div className="grid grid-cols-2 text-3xl gap-2 font-bold">
                <button
                    className={cx('w-8 h-6 portrait:w-10 portrait:h-8', {
                        'bg-gray-300 text-gray-500 dark:bg-dark cursor-not-allowed':
                            disabled,
                    })}
                    onClick={() => jogToCorner(BACK_LEFT)}
                    disabled={disabled}
                >
                    <img
                        src={blVector}
                        className="border border-gray-300"
                        alt="Back Left Rapid Position Icon"
                    />
                </button>
                <button
                    className={cx('w-8 h-6 portrait:w-10 portrait:h-8', {
                        'bg-gray-300 text-gray-500 dark:bg-dark cursor-not-allowed':
                            disabled,
                    })}
                    onClick={() => jogToCorner(BACK_RIGHT)}
                    disabled={disabled}
                >
                    <img
                        src={brVector}
                        className="border border-gray-300"
                        alt="Back Right Rapid Position Icon"
                    />
                </button>
                <button
                    className={cx('w-8 h-6 portrait:w-10 portrait:h-8', {
                        'bg-gray-300 text-gray-500 dark:bg-dark cursor-not-allowed':
                            disabled,
                    })}
                    onClick={() => jogToCorner(FRONT_LEFT)}
                    disabled={disabled}
                >
                    <img
                        src={flVector}
                        className="border border-gray-300"
                        alt="Front Right Rapid Position Icon"
                    />
                </button>
                <button
                    className={cx('w-8 h-6 portrait:w-10 portrait:h-8', {
                        'bg-gray-300 text-gray-500 dark:bg-dark cursor-not-allowed':
                            disabled,
                    })}
                    onClick={() => jogToCorner(FRONT_RIGHT)}
                    disabled={disabled}
                >
                    <img
                        src={frVector}
                        className="border border-gray-300"
                        alt="Front Left Rapid Position Icon"
                    />
                </button>
            </div>
        </div>
    );
}

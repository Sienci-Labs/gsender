import get from 'lodash/get';
import cx from 'classnames';

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
import Tooltip from 'app/components/Tooltip';
import cn from 'classnames';

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

    const altColourClass = 'stroke-robin-500';
    const disabledColorClass = 'stroke-gray-400';

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
        <div className="justify-center items-center text-blue-500 rapidButtonTransform portrait:rapidButtonTransformPortrait portrait:ml-24 ml-16">
            <div className="grid grid-cols-2 w-16 h-14 portrait:w-20 portrait:h-[68px] font-bold">
                <Tooltip content="Go to Back Left Corner" side="top">
                    <svg
                        viewBox="0 0 37 34"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('h-full w-full', {
                            'cursor-pointer': !disabled,
                            'cursor-not-allowed': disabled,
                        })}
                        onClick={() => jogToCorner(BACK_LEFT)}
                    >
                        <path
                            d="M 32 0 H 0 V 32"
                            stroke-width="20"
                            className={cn(
                                disabled ? disabledColorClass : altColourClass,
                            )}
                        />
                    </svg>
                </Tooltip>

                <Tooltip content="Go to Back Right Corner" side="top">
                    <svg
                        viewBox="0 0 27 34"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('h-full w-full', {
                            'cursor-pointer': !disabled,
                            'cursor-not-allowed': disabled,
                        })}
                        onClick={() => jogToCorner(BACK_RIGHT)}
                    >
                        <path
                            // d="M 74 32 V 0 L 42 0"
                            d="M 32 32 V 0 L 0 0"
                            stroke-width="20"
                            className={cn(
                                disabled ? disabledColorClass : altColourClass,
                            )}
                        />
                    </svg>
                </Tooltip>

                <Tooltip content="Go to Front Left Corner" side="bottom">
                    <svg
                        viewBox="0 0 37 33"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('h-full w-full', {
                            'cursor-pointer': !disabled,
                            'cursor-not-allowed': disabled,
                        })}
                        onClick={() => jogToCorner(FRONT_LEFT)}
                    >
                        <path
                            // d="M 0 36 L 0 67 L 32 67"
                            d="M 0 0 L 0 32 L 32 32"
                            stroke-width="20"
                            className={cn(
                                disabled ? disabledColorClass : altColourClass,
                            )}
                        />
                    </svg>
                </Tooltip>

                <Tooltip content="Go to Front Right Corner" side="bottom">
                    <svg
                        viewBox="0 0 27 33"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('h-full w-full', {
                            'cursor-pointer': !disabled,
                            'cursor-not-allowed': disabled,
                        })}
                        onClick={() => jogToCorner(FRONT_RIGHT)}
                    >
                        <path
                            // d="M 42 67 H 74 V 36"
                            d="M 0 32 H 32 V 0"
                            stroke-width="20"
                            className={cn(
                                disabled ? disabledColorClass : altColourClass,
                            )}
                        />
                    </svg>
                </Tooltip>
            </div>
        </div>
    );
}

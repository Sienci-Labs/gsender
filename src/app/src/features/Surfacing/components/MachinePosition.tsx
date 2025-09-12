import React from 'react';

import { RadioGroup, RadioGroupItem } from 'app/components/shadcn/RadioGroup';
import { Switch } from 'app/components/shadcn/Switch';
import { Tooltip } from 'app/components/Tooltip';
import SpiralIcon from '../SVG/Spiral';
import ZigZagIcon from '../SVG/ZigZag';
import {
    SPIRAL_MOVEMENT,
    ZIG_ZAG_MOVEMENT,
    START_POSITION_BACK_LEFT,
    START_POSITION_BACK_RIGHT,
    START_POSITION_FRONT_LEFT,
    START_POSITION_FRONT_RIGHT,
    START_POSITION_CENTER,
} from 'app/constants';

import { Surfacing } from '../definitions';
import { cx } from 'class-variance-authority';
// import { Label } from 'app/components/shadcn/Label';

interface Props {
    surfacing: Surfacing;
    setSurfacing: React.Dispatch<Surfacing>;
}

const MachinePosition: React.FC<Props> = ({ surfacing, setSurfacing }) => {
    const positionRadioButtons = [
        {
            key: 0,
            className: 'm-0 absolute -left-5 -top-5',
            title: 'Start at the Back Left',
            value: START_POSITION_BACK_LEFT,
        },
        {
            key: 1,
            className: 'm-0 absolute -right-5 -top-5',
            title: 'Start at the Back Right',
            value: START_POSITION_BACK_RIGHT,
        },
        {
            key: 2,
            className: 'm-0 absolute -bottom-7 -left-5',
            title: 'Start at the Front Left',
            value: START_POSITION_FRONT_LEFT,
        },
        {
            key: 3,
            className: 'm-0 absolute -bottom-7 -right-5',
            title: 'Start at the Front Right',
            value: START_POSITION_FRONT_RIGHT,
        },
        {
            key: 4,
            className: 'absolute top-5 left-5',
            title: 'Start at the Center',
            value: START_POSITION_CENTER,
        },
    ];

    const { startPosition, type, cutDirectionFlipped } = surfacing;

    return (
        <div className="flex items-center gap-8 justify-between">
            <div className="w-20 h-20 border-4 border-black relative">
                <RadioGroup
                    name="positions"
                    value={startPosition}
                    className="border-black"
                    onValueChange={(value) =>
                        setSurfacing({ ...surfacing, startPosition: value })
                    }
                >
                    {positionRadioButtons.map((position) => (
                        <div key={position.key} className={position.className}>
                            <Tooltip content={position.title}>
                                <RadioGroupItem
                                    value={position.value}
                                    className="m-0"
                                    size="h-8 w-8"
                                />
                            </Tooltip>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div>
                <div className="flex items-center gap-4 justify-between">
                    <Tooltip content="Spiral surfacing pattern">
                        <SpiralIcon
                            checked={surfacing.type === SPIRAL_MOVEMENT}
                            className={cx(
                                'fill-black w-16 h-16 p-3 border-2 border-black rounded-lg hover:cursor-pointer hover:bg-gray-500 hover:fill-white transition-all duration-300',
                                {
                                    'bg-blue-50 fill-black border-blue-500':
                                        type === SPIRAL_MOVEMENT,
                                },
                            )}
                            onClick={() =>
                                setSurfacing({
                                    ...surfacing,
                                    type: SPIRAL_MOVEMENT,
                                })
                            }
                        />
                    </Tooltip>

                    <Tooltip content="Zig-Zag surfacing pattern">
                        <ZigZagIcon
                            checked={surfacing.type === ZIG_ZAG_MOVEMENT}
                            className={cx(
                                'fill-black w-16 h-16 p-3 border-2 border-black rounded-lg hover:cursor-pointer hover:bg-gray-500 hover:fill-white transition-all duration-300',
                                {
                                    'bg-blue-50 fill-black border-blue-500':
                                        type === ZIG_ZAG_MOVEMENT,
                                },
                            )}
                            onClick={() =>
                                setSurfacing({
                                    ...surfacing,
                                    type: ZIG_ZAG_MOVEMENT,
                                })
                            }
                        />
                    </Tooltip>
                </div>

                <div className="flex mt-4 justify-between items-center">
                    <span className="font-light text-sm max-w-20 dark:text-white">
                        Flip Cut Direction
                    </span>
                    <Switch
                        onChange={(value) =>
                            setSurfacing({
                                ...surfacing,
                                cutDirectionFlipped: value,
                            })
                        }
                        checked={cutDirectionFlipped ?? false}
                        className="h-20"
                    />
                </div>
            </div>
        </div>
    );
};

export default MachinePosition;

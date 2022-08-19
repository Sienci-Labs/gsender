import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'app/components/Checkbox';

import { RadioGroup, RadioButton } from 'app/components/Radio';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import SpiralIcon from 'app/components/SVG/Spiral';
import ZigZagIcon from 'app/components/SVG/ZigZag';
import {
    SPIRAL_MOVEMENT,
    ZIG_ZAG_MOVEMENT,
    START_POSITION_BACK_LEFT,
    START_POSITION_BACK_RIGHT,
    START_POSITION_FRONT_LEFT,
    START_POSITION_FRONT_RIGHT,
    SPINDLE_MODES
} from 'app/constants';

import styles from './machine-position.styl';
import { SurfacingContext } from '../Surfacing/Context';

const [M3, M4] = SPINDLE_MODES;

const MachinePosition = () => {
    const { surfacing, onSelect } = useContext(SurfacingContext);

    const positionRadioButtons = [
        { key: 0, className: styles['radio-top-left'], title: 'Start at the Back Left', value: START_POSITION_BACK_LEFT },
        { key: 1, className: styles['radio-top-right'], title: 'Start at the Back Right', value: START_POSITION_BACK_RIGHT },
        { key: 2, className: styles['radio-bottom-left'], title: 'Start at the Front Left', value: START_POSITION_FRONT_LEFT },
        { key: 3, className: styles['radio-bottom-right'], title: 'Start at the Front Right', value: START_POSITION_FRONT_RIGHT },
    ];

    const { startPosition, type, startFromCenter, spindle } = surfacing;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'space-between' }}>
            <div className={styles.box}>
                <RadioGroup
                    name="positions"
                    value={startPosition}
                    depth={3}
                    onChange={(value) => onSelect({ value, type: 'startPosition' })}
                    size="large"
                >
                    {
                        positionRadioButtons.map((position) => (
                            <div key={position.key} className={position.className}>
                                <Tooltip content={position.title} location="default">
                                    <RadioButton value={position.value} style={{ margin: 0 }} />
                                </Tooltip>
                            </div>
                        ))
                    }
                </RadioGroup>

                {type === SPIRAL_MOVEMENT && (
                    <div style={{ position: 'absolute', top: '34%', left: '39%' }}>
                        <Tooltip content="Start Spiral From the Center" location="default">
                            <Checkbox
                                onChange={(e) => onSelect({ value: e.target.checked, type: 'startFromCenter' })}
                                checked={startFromCenter ?? false}
                                size="sm"
                                style={{ margin: 0 }}
                            />
                        </Tooltip>
                    </div>
                )}
            </div>

            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                    <Tooltip
                        content="Select Spiral Surfacing Type"
                        style={{ wordWrap: 'break-word' }}
                        location="bottom"
                    >
                        <SpiralIcon
                            className={styles[type === SPIRAL_MOVEMENT ? 'surfacing-type-active' : 'surfacing-type']}
                            onClick={() => onSelect({ value: SPIRAL_MOVEMENT, type: 'type' })}
                        />
                    </Tooltip>

                    <Tooltip
                        content="Select Zig-Zag Surfacing Type"
                        style={{ wordWrap: 'break-word' }}
                        location="bottom"
                    >
                        <ZigZagIcon
                            className={styles[type === ZIG_ZAG_MOVEMENT ? 'surfacing-type-active' : 'surfacing-type']}
                            onClick={() => onSelect({ value: ZIG_ZAG_MOVEMENT, type: 'type' })}
                        />
                    </Tooltip>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <ToggleSwitch
                        label="Flip Cut Direction"
                        size="small"
                        onChange={(val) => onSelect({ value: val ? M3 : M4, type: 'spindle' })}
                        checked={spindle === M3}
                    />
                </div>
            </div>
        </div>
    );
};

MachinePosition.propTypes = {
    current: PropTypes.string,
};

export default MachinePosition;

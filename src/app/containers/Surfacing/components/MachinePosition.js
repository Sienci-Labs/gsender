import React from 'react';

import { RadioGroup, RadioButton } from 'app/components/Radio';
// import Tooltip from 'app/components/TooltipCustom/ToolTip';
import SpiralIcon from 'app/components/SVG/Spiral';
import ZigZagIcon from 'app/components/SVG/ZigZag';

import {
    SPIRAL_MOVEMENT,
    ZIG_ZAG_MOVEMENT,
    START_POSITION_BACK_LEFT,
    START_POSITION_BACK_RIGHT,
    START_POSITION_FRONT_LEFT,
    START_POSITION_FRONT_RIGHT,
} from 'app/constants';

import styles from './machine-position.styl';

const MachinePosition = ({ current, type, onChange }) => {
    const positionRadioButtons = [
        { key: 0, className: styles['radio-top-left'], value: START_POSITION_BACK_LEFT },
        { key: 1, className: styles['radio-top-right'], value: START_POSITION_BACK_RIGHT },
        { key: 2, className: styles['radio-bottom-left'], value: START_POSITION_FRONT_LEFT },
        { key: 3, className: styles['radio-bottom-right'], value: START_POSITION_FRONT_RIGHT },
    ];

    return (
        <div className={styles.box}>
            <div className={styles['surfacing-type-wrapper']}>
                {/* <Tooltip content="Click here to select spiral surfacing type" style={{ wordWrap: 'break-word' }}>
                </Tooltip> */}
                <SpiralIcon className={styles[type === SPIRAL_MOVEMENT ? 'surfacing-type-active' : 'surfacing-type']} onClick={() => onChange(SPIRAL_MOVEMENT, 'type')} />

                <ZigZagIcon className={styles[type === ZIG_ZAG_MOVEMENT ? 'surfacing-type-active' : 'surfacing-type']} onClick={() => onChange(ZIG_ZAG_MOVEMENT, 'type')} />
                {/* <Tooltip content="Click here to select zig zag surfacing type" style={{ wordWrap: 'break-word' }}>
                </Tooltip> */}
            </div>
            <RadioGroup
                name="positions"
                value={current}
                depth={1}
                onChange={(value) => onChange(value, 'startPosition')}
                size="large"
            >
                { positionRadioButtons.map((position) => <RadioButton {...position} />) }
            </RadioGroup>
        </div>
    );
};

export default MachinePosition;

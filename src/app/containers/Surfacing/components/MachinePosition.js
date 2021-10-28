import React from 'react';
import PropTypes from 'prop-types';

import { RadioGroup, RadioButton } from 'app/components/Radio';
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
} from 'app/constants';

import styles from './machine-position.styl';

const MachinePosition = ({ current, type, onChange }) => {
    const positionRadioButtons = [
        { key: 0, className: styles['radio-top-left'], title: 'Start at Back Left', value: START_POSITION_BACK_LEFT },
        { key: 1, className: styles['radio-top-right'], title: 'Start at Back Right', value: START_POSITION_BACK_RIGHT },
        { key: 2, className: styles['radio-bottom-left'], title: 'Start at Front Left', value: START_POSITION_FRONT_LEFT },
        { key: 3, className: styles['radio-bottom-right'], title: 'Start at Front Right', value: START_POSITION_FRONT_RIGHT },
    ];

    return (
        <div className={styles.box}>
            <div className={styles['surfacing-type-wrapper']}>
                <Tooltip
                    content="Click here to select spiral surfacing type"
                    style={{ wordWrap: 'break-word' }}
                    location="bottom"
                >
                    <SpiralIcon
                        className={styles[type === SPIRAL_MOVEMENT ? 'surfacing-type-active' : 'surfacing-type']}
                        onClick={() => onChange(SPIRAL_MOVEMENT, 'type')}
                    />
                </Tooltip>

                <Tooltip
                    content="Click here to select zig zag surfacing type"
                    style={{ wordWrap: 'break-word' }}
                    location="bottom"
                >
                    <ZigZagIcon
                        className={styles[type === ZIG_ZAG_MOVEMENT ? 'surfacing-type-active' : 'surfacing-type']}
                        onClick={() => onChange(ZIG_ZAG_MOVEMENT, 'type')}
                    />
                </Tooltip>
            </div>
            <RadioGroup
                name="positions"
                value={current}
                depth={3}
                onChange={(value) => onChange(value, 'startPosition')}
                size="large"
            >
                { positionRadioButtons.map((position) => <div key={position.key} className={position.className}><Tooltip content={position.title} location="default"><RadioButton value={position.value} style={{ margin: 0 }} /></Tooltip></div>)}
            </RadioGroup>
        </div>
    );
};

MachinePosition.propTypes = {
    current: PropTypes.string,
};

export default MachinePosition;

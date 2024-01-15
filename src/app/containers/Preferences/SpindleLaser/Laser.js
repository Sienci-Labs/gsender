import React, { useEffect, useState } from 'react';

import TooltipCustom from 'app/components/TooltipCustom/ToolTip';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';
import { METRIC_UNITS } from '../../../constants';
import { convertToImperial } from '../calculate';

const Laser = ({ state, actions }) => {
    const { units, laser } = state;
    const { xOffset, yOffset } = laser;
    const laserActions = actions.laser;
    const [minLaser, setMinLaser] = useState(laser.minPower);
    const [maxLaser, setMaxLaser] = useState(laser.maxPower);
    useEffect(() => {
        setMinLaser(laser.minPower);
        setMaxLaser(laser.maxPower);
    }, []);
    return (
        <>
            <Fieldset legend="Laser Axes Offset">
                <Input
                    label="X Axis Offset"
                    units={units}
                    value={units === METRIC_UNITS ? xOffset : convertToImperial(xOffset)}
                    onChange={(e) => laserActions.handleOffsetChange(e, 'X')}
                />
                <Input
                    label="Y Axis Offset"
                    units={units}
                    value={units === METRIC_UNITS ? yOffset : convertToImperial(yOffset)}
                    onChange={(e) => laserActions.handleOffsetChange(e, 'Y')}
                />
            </Fieldset>

            <Fieldset legend="Laser Power">
                <p style={{ fontSize: '0.9rem', color: '#737373' }}>Note that these values will not be applied to EEPROM until the next time laser mode is toggled.</p>
                <TooltipCustom content="Minimum laser amount" location="default">
                    <Input
                        label="Min Power"
                        units="PWM"
                        value={minLaser}
                        onChange={(e) => laserActions.setPower(e.target.value, 'minPower')}
                        additionalProps={{ type: 'number' }}
                    />
                </TooltipCustom>
                <TooltipCustom content="Maximum laser amount" location="default">
                    <Input
                        label="Max Power"
                        units="PWM"
                        value={maxLaser}
                        onChange={(e) => laserActions.setPower(e.target.value, 'maxPower')}
                        additionalProps={{ type: 'number' }}
                    />
                </TooltipCustom>
            </Fieldset>
        </>
    );
};

export default Laser;

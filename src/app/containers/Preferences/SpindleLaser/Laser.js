import React from 'react';

import TooltipCustom from 'app/components/TooltipCustom/ToolTip';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

const Laser = ({ state, actions }) => {
    const { units, spindle: { laser } } = state;
    const { xOffset, yOffset } = laser;
    const laserActions = actions.laser;

    return (
        <>
            <Fieldset legend="Laser Axes Offset">
                <Input
                    label="X Axis Offset"
                    units={units}
                    value={xOffset}
                    onChange={(e) => laserActions.handleOffsetChange(e, 'X')}
                />
                <Input
                    label="Y Axis Offset"
                    units={units}
                    value={yOffset}
                    onChange={(e) => laserActions.handleOffsetChange(e, 'Y')}
                />
            </Fieldset>

            <Fieldset legend="Laser Power">
                <TooltipCustom content="Minimum laser amount" location="default">
                    <Input
                        label="Min Power"
                        units="PWM"
                        value={laser.minPower}
                        onChange={(e) => laserActions.setPower(e.target.value, 'minPower')}
                        additionalProps={{ type: 'number' }}
                    />
                </TooltipCustom>
                <TooltipCustom content="Maximum laser amount" location="default">
                    <Input
                        label="Max Power"
                        units="PWM"
                        value={laser.maxPower}
                        onChange={(e) => laserActions.setPower(e.target.value, 'maxPower')}
                        additionalProps={{ type: 'number' }}
                    />
                </TooltipCustom>
            </Fieldset>
        </>
    );
};

export default Laser;

import React, { useEffect, useState } from 'react';

import TooltipCustom from 'app/components/TooltipCustom/ToolTip';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

const Spindle = ({ state, actions }) => {
    const { spindle } = state;
    const spindleActions = actions.spindle;
    const [spindleMin, setSpindleMin] = useState(spindle.spindleMin);
    const [spindleMax, setSpindleMax] = useState(spindle.spindleMax);
    useEffect(() => {
        setSpindleMin(spindle.spindleMin);
        setSpindleMax(spindle.spindleMax);
    }, []);
    return (
        <>
            <Fieldset legend="Spindle Speed">
                <TooltipCustom content="Minimum spindle amount" location="default">
                    <Input
                        label="Min Speed"
                        units="RPM"
                        value={spindleMin}
                        onChange={(e) => spindleActions.setSpeed(e.target.value, 'spindleMin')}
                        additionalProps={{ type: 'number' }}
                    />
                </TooltipCustom>
                <TooltipCustom content="Maximum spindle speed" location="default">
                    <Input
                        label="Max Speed"
                        units="RPM"
                        value={spindleMax}
                        onChange={(e) => spindleActions.setSpeed(e.target.value, 'spindleMax')}
                        additionalProps={{ type: 'number' }}
                    />
                </TooltipCustom>
            </Fieldset>
        </>
    );
};

export default Spindle;

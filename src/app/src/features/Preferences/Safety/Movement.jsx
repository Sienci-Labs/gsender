import React from 'react';

import Tooltip from 'app/components/Tooltip';

import Input from '../components/Input';
import Fieldset from '../components/Fieldset';

const Movement = ({ state, actions }) => {
    const { units, safeRetractHeight } = state;

    return (
        <Fieldset legend="Movement">
            <Tooltip
                content="Amount Z-Axis will move before making any X/Y-Axis movements"
                location="default"
            >
                <Input
                    label="Safe Height"
                    units={units}
                    value={safeRetractHeight}
                    onChange={(e) => actions.general.setSafeRetractHeight(e)}
                    additionalProps={{
                        name: 'safeRetractHeight',
                        type: 'number',
                    }}
                />
            </Tooltip>
        </Fieldset>
    );
};

export default Movement;

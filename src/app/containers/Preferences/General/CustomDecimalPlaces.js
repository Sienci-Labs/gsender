import React from 'react';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import Input from '../components/Input';
import Fieldset from '../components/Fieldset';

const CustomDecimalPlaces = ({ state, actions }) => {
    const { customDecimalPlaces } = state;

    return (
        <Fieldset legend="Custom Decimal Places">
            <Tooltip
                content="Select 0 for default value and 1-5 to set custom places."
                location="default"
            >
                <Input
                    label="10ˣ Places"
                    value={customDecimalPlaces}
                    onChange={(e) => actions.general.setCustomDecimalPlaces(e)}
                    additionalProps={{
                        name: 'customDecimalPlaces',
                        type: 'number',
                        min: '0',
                        max: '5',
                    }}
                />
            </Tooltip>
        </Fieldset>
    );
};

export default CustomDecimalPlaces;

import React from 'react';

import Tooltip from 'app/components/Tooltip';
import Input from '../components/Input';
import Fieldset from '../components/Fieldset';

const CustomDecimalPlaces = ({ state, actions }) => {
    const { customDecimalPlaces } = state;

    return (
        <Fieldset legend="Custom Decimal Places">
            <Tooltip
                content="Default Value = 0 (2 decimal places for mm and 3 for inches). Anything other than 0 sets both MM and Inches to the selected decimal places. Min = 1, Max = 5"
                location="default"
            >
                <Input
                    label="Precision"
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

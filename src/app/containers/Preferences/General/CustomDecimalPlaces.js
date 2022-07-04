import React from 'react';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import Input from '../components/Input';
import Fieldset from '../components/Fieldset';

const CustomDecimalPlaces = ({ state, actions }) => {
    const { customInPlaces, customMmPlaces } = state;

    return (
        <Fieldset legend="Custom Decimal Places">
            <Tooltip
                content="Select a custom decimal places for inputs in - Millimeter"
                location="default"
            >
                <Input
                    label="Millimeters"
                    value={customMmPlaces}
                    onChange={(e) => actions.general.setSafeRetractHeight(e)}
                    additionalProps={{
                        name: 'safeRetractHeight',
                        type: 'number',
                        min: '1',
                        max: '5',
                    }}
                />
            </Tooltip>
            <Tooltip
                content="Select a custom decimal places for inputs in - Inch"
                location="default"
            >
                <Input
                    label="Inches"
                    value={customInPlaces}
                    onChange={(e) => actions.general.setSafeRetractHeight(e)}
                    additionalProps={{
                        name: 'safeRetractHeight',
                        type: 'number',
                        min: '1',
                        max: '5',
                    }}
                />
            </Tooltip>
        </Fieldset>
    );
};

export default CustomDecimalPlaces;

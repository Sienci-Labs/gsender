import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import store from 'app/store';
import defaultState from 'app/store/defaultState';
import { METRIC_UNITS } from 'app/constants';
import Input from 'app/containers/Surfacing/components/InputArea/Input';
import inputStyles from 'app/containers/Surfacing/components/InputArea/input.styl';
import { Checkbox } from 'app/components/Checkbox';

// import { convertValuesToImperial } from '../../utils';
import { RotaryContext } from '../../Context';
import { convertValuesToImperial } from '../../../../containers/Surfacing/utils';


const defaultSurfacingState = get(defaultState, 'widgets.surfacing', {});

const InputArea = () => {
    const { state } = useContext(RotaryContext);

    const { bitDiameter, stepover, feedrate, stockLength, startHeight, finalHeight, stepdown } = state.stockTurning;

    const defaultValues = units === METRIC_UNITS
        ? defaultSurfacingState
        : convertValuesToImperial(defaultSurfacingState);

    const units = store.get('');

    const onChange = null;

    return (
        <div style={{ width: '50%' }}>
            <Input
                label="Bit Diameter"
                units={units}
                additionalProps={{ type: 'number', id: 'bitDiameter', step: 1, min: 0.01, max: 1000, style: { ...inputStyles } }}
                value={bitDiameter}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.bitDiameter}` }}
            />

            <Input
                label="Stepover"
                units="%"
                additionalProps={{ type: 'number', id: 'stepover', min: 1, max: 80, style: { ...inputStyles } }}
                value={stepover}
                onChange={(e) => onChange({ ...e, shouldConvert: false })}
                tooltip={{ content: `Default Value: ${defaultValues.stepover} | Max Value: 80` }}
            />

            <Input
                label="Feedrate"
                units={`${units}/min`}
                additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={feedrate}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.feedrate}` }}
            />

            <Input
                label="Stock Length"
                units={units}
                additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={stockLength}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.feedrate}` }}
            />

            <Input
                label="Start Height"
                units={units}
                additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={startHeight}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.feedrate}` }}
            />

            <Input
                label="Final Height"
                units={units}
                additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={finalHeight}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.feedrate}` }}
            />

            <Input
                label="Stepdown"
                units={units}
                additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={stepdown}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.feedrate}` }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <label style={{ margin: '0 1rem' }}>Re-Home</label>
                <Checkbox onChange={onChange} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <label style={{ margin: '0 1rem' }}>Big Material</label>
                <Checkbox onChange={onChange} />
            </div>
        </div>
    );
};

InputArea.propTypes = {
    values: PropTypes.object,
    onChange: PropTypes.func,
    units: PropTypes.string,
    onSelect: PropTypes.func,
};

export default InputArea;

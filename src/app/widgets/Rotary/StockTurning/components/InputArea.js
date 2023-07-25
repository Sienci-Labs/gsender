import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import store from 'app/store';
import defaultState from 'app/store/defaultState';
import { METRIC_UNITS } from 'app/constants';
import Input from 'app/containers/Surfacing/components/InputArea/Input';
import inputStyles from 'app/containers/Surfacing/components/InputArea/input.styl';
import { Checkbox } from 'app/components/Checkbox';
import MultiInputBlock from 'app/containers/Surfacing/components/InputArea/MultiInputBlock';

// import { convertValuesToImperial } from '../../utils';
import { RotaryContext } from '../../Context';
import { convertValuesToImperial } from '../../../../containers/Surfacing/utils';
import { UPDATE_STOCK_TURNING_OPTION } from '../../Context/actions';


const defaultStockTurningState = get(defaultState, 'widgets.rotary.stockTurning.options', {});

const InputArea = () => {
    const { state, dispatch } = useContext(RotaryContext);

    const { bitDiameter, stepover, feedrate, stockLength, startHeight, finalHeight, stepdown, spindleRPM } = state.stockTurning.options;

    const defaultValues = units === METRIC_UNITS
        ? defaultStockTurningState
        : convertValuesToImperial(defaultStockTurningState);

    const units = store.get('workspace.units');

    const handleChange = (e) => {
        const { id, value, checked } = e.target;

        const payload = {
            key: id,
            value: e.target.type === 'checkbox' ? checked : Number(value)
        };

        dispatch({ type: UPDATE_STOCK_TURNING_OPTION, payload });
    };

    return (
        <div style={{ width: '45%' }}>
            <p>
                Avoid running stock turning back to back without re-homing / re-connecting to the controller. Consider turning off hard and soft limits{' '}
                so you don&apos;t encounter alarms or errors.
            </p>

            <Input
                label="Stock Length"
                units={units}
                additionalProps={{ type: 'number', id: 'stockLength', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={stockLength}
                onChange={handleChange}
                tooltip={{ content: `Default Value: ${defaultValues.stockLength}` }}
            />

            <div style={{ marginBottom: '1rem' }}>
                <MultiInputBlock
                    label="Start & End Height"
                    firstComponent={(
                        <Input
                            units={units}
                            additionalProps={{ type: 'number', id: 'startHeight', min: 1, max: 1000000, style: { ...inputStyles } }}
                            value={startHeight}
                            onChange={handleChange}
                            tooltip={{ content: `Default Value: ${defaultValues.startHeight}` }}
                        />
                    )}
                    secondComponent={(
                        <div style={{ marginLeft: '1rem' }}>
                            <Input
                                units={units}
                                additionalProps={{ type: 'number', id: 'finalHeight', min: 1, max: 1000000, style: { ...inputStyles } }}
                                value={finalHeight}
                                onChange={handleChange}
                                tooltip={{ content: `Default Value: ${defaultValues.finalHeight}` }}
                            />
                        </div>
                    )}
                />
                <small>If you have limits enabled, please check that your start height does not exceed your z-axis limit</small>
            </div>

            <Input
                label="Stepdown"
                units={units}
                additionalProps={{ type: 'number', id: 'stepdown', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={stepdown}
                onChange={handleChange}
                tooltip={{ content: `Default Value: ${defaultValues.stepdown}` }}
            />

            <Input
                label="Stepover"
                units="%"
                additionalProps={{ type: 'number', id: 'stepover', min: 1, max: 80, style: { ...inputStyles } }}
                value={stepover}
                onChange={handleChange}
                tooltip={{ content: `Default Value: ${defaultValues.stepover}` }}
            />

            <Input
                label="Bit Diameter"
                units={units}
                additionalProps={{ type: 'number', id: 'bitDiameter', step: 1, min: 0.01, max: 1000, style: { ...inputStyles } }}
                value={bitDiameter}
                onChange={handleChange}
                tooltip={{ content: `Default Value: ${defaultValues.bitDiameter}` }}
            />

            <Input
                label="Spindle RPM"
                additionalProps={{ type: 'number', id: 'spindleRPM', step: 1, min: 0.01, max: 1000, style: { ...inputStyles } }}
                value={spindleRPM}
                onChange={handleChange}
                tooltip={{ content: `Default Value: ${defaultValues.spindleRPM}` }}
            />

            <Input
                label="Feedrate"
                units={`${units}/min`}
                additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 1000000, style: { ...inputStyles } }}
                value={feedrate}
                onChange={handleChange}
                tooltip={{ content: `Default Value: ${defaultValues.feedrate}` }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '1.1rem' }}>Enable Re-Homing</label>
                <Checkbox id="enableRehoming" onChange={handleChange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '1.1rem' }}>Using Big Material</label>
                <Checkbox id="usingBigMaterial" onChange={handleChange} />
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

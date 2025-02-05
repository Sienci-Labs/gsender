import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import store from 'app/store';
import defaultState from 'app/store/defaultState';
import { METRIC_UNITS } from 'app/constants';
import Input from 'app/components/InputWithLabel';
// import inputStyles from 'app/containers/Surfacing/components/InputArea/input.styl';
import { Checkbox } from 'app/components/Checkbox';
import MultiInputBlock from 'app/components/MultiInputBlock';

import { RotaryContext } from '../../Context';
import { convertValuesToImperial } from '../utils';
import { UPDATE_STOCK_TURNING_OPTION } from '../../Context/actions';

const defaultStockTurningState = get(
    defaultState,
    'widgets.rotary.stockTurning.options',
    {},
);

const InputArea = () => {
    const { state, dispatch } = useContext(RotaryContext);

    const {
        bitDiameter,
        stepover,
        feedrate,
        stockLength,
        startHeight,
        finalHeight,
        stepdown,
        spindleRPM,
        enableRehoming,
    } = state.stockTurning.options;

    const units = store.get('workspace.units');

    const defaultValues =
        units === METRIC_UNITS
            ? defaultStockTurningState
            : convertValuesToImperial(defaultStockTurningState);

    const handleChange = (e) => {
        const { id, value, checked } = e.target;

        const payload = {
            key: id,
            value: e.target.type === 'checkbox' ? checked : Number(value),
        };

        dispatch({ type: UPDATE_STOCK_TURNING_OPTION, payload });
    };

    return (
        <div style={{ width: '45%' }}>
            <p>
                Before surfacing: probe your rotary unit to zero the Z-axis to
                its centerline and check that your cutting bit can raise high
                enough to not run into the material you've mounted.
            </p>
            <Input
                label="Length"
                units={units}
                additionalProps={{
                    type: 'number',
                    id: 'stockLength',
                    min: 1,
                    max: 1000000,
                    // style: { ...inputStyles },
                }}
                value={stockLength}
                onChange={handleChange}
                tooltip={{
                    content: `Default Value: ${defaultValues.stockLength}`,
                }}
            />

            <MultiInputBlock
                label="Start & Final Diameter"
                firstComponent={
                    <Input
                        units={units}
                        additionalProps={{
                            type: 'number',
                            id: 'startHeight',
                            min: 1,
                            max: 1000000,
                            // style: { ...inputStyles },
                        }}
                        value={startHeight}
                        onChange={handleChange}
                        tooltip={{
                            content: `Default Value: ${defaultValues.startHeight}`,
                        }}
                    />
                }
                secondComponent={
                    <div style={{ marginLeft: '1rem' }}>
                        <Input
                            units={units}
                            additionalProps={{
                                type: 'number',
                                id: 'finalHeight',
                                min: 1,
                                max: 1000000,
                                // style: { ...inputStyles },
                            }}
                            value={finalHeight}
                            onChange={handleChange}
                            tooltip={{
                                content: `Default Value: ${defaultValues.finalHeight}`,
                            }}
                        />
                    </div>
                }
            />

            <div style={{ marginBottom: '1rem' }}>
                <Input
                    label="Stepdown"
                    units={units}
                    additionalProps={{
                        type: 'number',
                        id: 'stepdown',
                        min: 0.1,
                        max: 1000000,
                        // style: { ...inputStyles },
                    }}
                    value={stepdown}
                    onChange={handleChange}
                    tooltip={{
                        content: `Default Value: ${defaultValues.stepdown}`,
                    }}
                />
                <small>
                    Stepdown applies to both sides of your material so its
                    diameter will be reduced by twice this amount for every
                    pass.
                </small>
            </div>

            <Input
                label="Bit Diameter"
                units={units}
                additionalProps={{
                    type: 'number',
                    id: 'bitDiameter',
                    step: 1,
                    min: 0.01,
                    max: 1000,
                    // style: { ...inputStyles },
                }}
                value={bitDiameter}
                onChange={handleChange}
                tooltip={{
                    content: `Default Value: ${defaultValues.bitDiameter}`,
                }}
            />

            <Input
                label="Stepover"
                units="%"
                additionalProps={{
                    type: 'number',
                    id: 'stepover',
                    min: 1,
                    max: 80,
                    // style: { ...inputStyles },
                }}
                value={stepover}
                onChange={handleChange}
                tooltip={{
                    content: `Default Value: ${defaultValues.stepover}`,
                }}
            />

            <Input
                label="Spindle RPM"
                additionalProps={{
                    type: 'number',
                    id: 'spindleRPM',
                    step: 1,
                    min: 0.01,
                    max: 30000,
                    // style: { ...inputStyles },
                }}
                value={spindleRPM}
                onChange={handleChange}
                tooltip={{
                    content: `Default Value: ${defaultValues.spindleRPM}`,
                }}
            />

            <Input
                label="Feed Rate"
                units={`${units}/min`}
                additionalProps={{
                    type: 'number',
                    id: 'feedrate',
                    min: 1,
                    max: 1000000,
                    // style: { ...inputStyles },
                }}
                value={feedrate}
                onChange={handleChange}
                tooltip={{
                    content: `Default Value: ${defaultValues.feedrate}`,
                }}
            />

            <div style={{ marginBottom: '1rem' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr',
                        gap: '1rem',
                    }}
                >
                    <label style={{ fontSize: '1.1rem' }}>
                        Enable Re-Homing
                    </label>
                    <Checkbox
                        id="enableRehoming"
                        onChange={handleChange}
                        checked={enableRehoming}
                    />
                </div>

                <small>
                    This option gives a better finish by surfacing the material
                    in only one direction, but you’ll need to rehome after
                    surfacing to reset your A-axis position.
                </small>
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

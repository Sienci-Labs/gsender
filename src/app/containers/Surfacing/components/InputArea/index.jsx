import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import defaultState from 'app/store/defaultState';
import { METRIC_UNITS } from 'app/constants';
import { Checkbox } from 'app/components/Checkbox';

import Input from './Input';
import MachinePosition from '../MachinePosition';
import inputStyles from './input.styl';
import MultiInputBlock from './MultiInputBlock';
import { InputLabelStyled, InputWrapperStyled } from './styled';
import { SurfacingContext } from '../Surfacing/Context';
import { convertValuesToImperial } from '../../utils';
import ToggleSwitch from 'app/components/ToggleSwitch';

const defaultSurfacingState = get(defaultState, 'widgets.surfacing', {});

const InputArea = () => {
    const { surfacing, units, onChange, onSelect } = useContext(SurfacingContext);

    const {
        bitDiameter,
        stepover,
        feedrate,
        length,
        width,
        skimDepth,
        spindleRPM,
        maxDepth,
        shouldDwell,
        flood,
        mist
    } = surfacing;

    const defaultValues = units === METRIC_UNITS
        ? defaultSurfacingState
        : convertValuesToImperial(defaultSurfacingState);

    return (
        <div>
            <MultiInputBlock
                label="X & Y"
                divider="&"
                firstComponent={(
                    <Input
                        additionalProps={{
                            type: 'number',
                            id: 'width',
                            min: 1,
                            max: 50000,
                            style: { borderRadius: 4 }
                        }}
                        value={width}
                        onChange={onChange}
                    />
                )}
                secondComponent={(
                    <Input
                        additionalProps={{
                            type: 'number',
                            id: 'length',
                            min: 1,
                            max: 50000,
                        }}
                        value={length}
                        onChange={onChange}
                        units={units}
                    />
                )}
            />

            <MultiInputBlock
                label="Cut Depth & Max"
                divider="&"
                firstComponent={(
                    <Input
                        additionalProps={{ type: 'number', id: 'skimDepth', min: 0.00001, max: 10000, style: { borderRadius: 4, ...inputStyles } }}
                        value={skimDepth}
                        onChange={onChange}
                        tooltip={{ content: `Default Value: ${defaultValues.skimDepth}` }}
                    />
                )}
                secondComponent={(
                    <Input
                        units={units}
                        additionalProps={{ type: 'number', id: 'maxDepth', min: 0.00001, max: 10000, style: { ...inputStyles } }}
                        value={maxDepth}
                        onChange={onChange}
                        tooltip={{ content: `Default Value: ${defaultValues.maxDepth}` }}
                    />
                )}
            />

            <Input
                label="Bit Diameter"
                units={units}
                additionalProps={{ type: 'number', id: 'bitDiameter', step: 1, min: 0.01, max: 1000, style: { ...inputStyles } }}
                value={bitDiameter}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.bitDiameter}` }}
            />

            <MultiInputBlock
                label="Spindle RPM"
                firstComponent={(
                    <Input
                        additionalProps={{ type: 'number', id: 'spindleRPM', min: 1, max: 200000, style: { borderRadius: 4, ...inputStyles } }}
                        value={spindleRPM}
                        onChange={onChange}
                        tooltip={{ content: `Default Value: ${defaultValues.spindleRPM}` }}
                    />
                )}
                secondComponent={(
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <label style={{ margin: '0 1rem' }}>Delay</label>
                        <Checkbox
                            checked={shouldDwell}
                            onChange={(e) => onSelect({ type: 'shouldDwell', value: e.target.checked })}
                        />
                    </div>
                )}
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
                label="Stepover"
                units="%"
                additionalProps={{ type: 'number', id: 'stepover', min: 1, max: 80, style: { ...inputStyles } }}
                value={stepover}
                onChange={(e) => onChange({ ...e, shouldConvert: false })}
                tooltip={{ content: `Default Value: ${defaultValues.stepover} | Max Value: 80` }}
            />

            <InputWrapperStyled hasTwoColumns style={{ marginTop: '1.5rem' }}>
                <InputLabelStyled>Start Position</InputLabelStyled>

                <MachinePosition />
            </InputWrapperStyled>

            <MultiInputBlock
                label="I/O Control"
                firstComponent={(
                    <div style={{ display: 'flex' }}>
                        <ToggleSwitch
                            label="Mist (M7)"
                            checked={mist ?? false}
                            size="small"
                            onChange={(value) => onSelect({ type: 'mist', value })}
                        />
                    </div>
                )}
                secondComponent={(
                    <div style={{ display: 'flex' }}>
                        <ToggleSwitch
                            label="Flood (M8)"
                            checked={flood ?? false}
                            size="small"
                            onChange={(value) => onSelect({ type: 'flood', value })}
                        />
                    </div>
                )}
            />
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

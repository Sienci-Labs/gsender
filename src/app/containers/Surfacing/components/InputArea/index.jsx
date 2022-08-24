import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import defaultState from 'app/store/defaultState';
import { METRIC_UNITS } from 'app/constants';

import Input from './Input';
import MachinePosition from '../MachinePosition';

import inputStyles from './input.styl';
import MultiInputBlock from './MultiInputBlock';
import { InputLabelStyled, InputWrapperStyled } from './styled';
import { SurfacingContext } from '../Surfacing/Context';

const InputArea = () => {
    const { widgets } = defaultState;

    const { surfacing, units, onChange } = useContext(SurfacingContext);

    const {
        bitDiameter,
        stepover,
        feedrate,
        length,
        width,
        skimDepth,
        spindleRPM,
        maxDepth,
        // spindle
    } = surfacing;

    const defaultValues = units === METRIC_UNITS ? widgets.surfacing.defaultMetricState : widgets.surfacing.defaultImperialState;

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
                            style: { paddingLeft: 5, paddingRight: 5 }
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
                            style: { borderRadius: 4 }
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
                        additionalProps={{ type: 'number', id: 'skimDepth', min: 0.001, max: 500, style: { borderRadius: 4, ...inputStyles } }}
                        value={skimDepth}
                        onChange={onChange}
                        tooltip={{ content: `Default Value: ${defaultValues.skimDepth}` }}
                    />
                )}
                secondComponent={(
                    <Input
                        units={units}
                        additionalProps={{ type: 'number', id: 'maxDepth', min: 0.001, max: 500, style: { ...inputStyles } }}
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

            <Input
                label="Spindle RPM"
                units={units}
                additionalProps={{ type: 'number', id: 'spindleRPM', min: 1, max: 200000, style: { ...inputStyles } }}
                value={spindleRPM}
                onChange={onChange}
                tooltip={{ content: `Default Value: ${defaultValues.spindleRPM}` }}
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
                additionalProps={{ type: 'number', id: 'stepover', min: 1, max: 100, style: { ...inputStyles } }}
                value={stepover}
                onChange={(e) => onChange({ ...e, shouldConvert: false })}
                tooltip={{ content: `Default Value: ${defaultValues.stepover}` }}
            />

            {/* <Tooltip content={`Default Value: ${defaultValues.spindle}`}>
                <InputWrapperStyled hasTwoColumns>
                    <InputLabelStyled>Spindle</InputLabelStyled>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <RadioGroup
                            name="spindle"
                            value={spindle}
                            depth={2}
                            onChange={(value) => onSelect({ value, type: 'spindle' })}
                            size="small"
                        >
                            <div>
                                <RadioButton className={styles.prefferedradio} label="M3" value={M3} />
                                <RadioButton className={styles.prefferedradio} label="M4" value={M4} />
                            </div>
                        </RadioGroup>
                    </div>
                </InputWrapperStyled>
            </Tooltip> */}

            <InputWrapperStyled hasTwoColumns style={{ marginTop: '1.5rem' }}>
                <InputLabelStyled>Start Position</InputLabelStyled>

                <MachinePosition />
            </InputWrapperStyled>
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

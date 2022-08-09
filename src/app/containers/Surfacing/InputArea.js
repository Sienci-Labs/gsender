import React from 'react';
import PropTypes from 'prop-types';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import defaultState from 'app/store/defaultState';
import { METRIC_UNITS, SPINDLE_MODES } from 'app/constants';
import { RadioGroup, RadioButton } from 'app/components/Radio';

import Input from './components/Input';
import MachinePosition from './components/MachinePosition';
import styles from './index.styl';
import inputStyles from './components/input.styl';

const [M3, M4] = SPINDLE_MODES;

const InputArea = ({ values, onChange, onSelect, units }) => {
    const { widgets } = defaultState;

    const {
        bitDiameter,
        stepover,
        feedrate,
        length,
        width,
        skimDepth,
        spindleRPM,
        maxDepth,
        type,
        startPosition,
        spindle
    } = values;

    const defaultValues = units === METRIC_UNITS ? widgets.surfacing.defaultMetricState : widgets.surfacing.defaultImperialState;

    return (
        <div>
            <div>
                <div className={inputStyles.input}>
                    <span style={{ alignSelf: 'center', fontSize: '1.1rem', margin: '1rem 0.5rem 0 0' }}>Dimensions</span>

                    <div className={styles.dimensions}>
                        <Input
                            label="X"
                            additionalProps={{
                                type: 'number',
                                id: 'width',
                                min: 1,
                                max: 50000,
                                style: { paddingLeft: 5, paddingRight: 5, borderRadius: 4, ...inputStyles }
                            }}
                            value={width}
                            onChange={onChange}
                            className={styles['dimension-input']}
                        />
                        <span className={styles.x}>
                            x
                        </span>
                        <Input
                            label="Y"
                            additionalProps={{
                                type: 'number',
                                id: 'length',
                                min: 1,
                                max: 50000,
                                style: { paddingLeft: 5, paddingRight: 5, ...inputStyles }
                            }}
                            value={length}
                            onChange={onChange}
                            units={units}
                            className={styles['dimension-input']}
                        />
                    </div>
                </div>
                <Tooltip content={`Default Value: ${defaultValues.bitDiameter}`}>
                    <Input
                        label="Router Bit Diameter"
                        units={units}
                        additionalProps={{ type: 'number', id: 'bitDiameter', step: 1, min: 0.01, max: 1000, style: { ...inputStyles } }}
                        value={bitDiameter}
                        onChange={onChange}
                    />
                </Tooltip>

                <Tooltip content={`Default Value: ${defaultValues.spindleRPM}`}>
                    <Input
                        label="Spindle RPM"
                        units={units}
                        additionalProps={{ type: 'number', id: 'spindleRPM', min: 1, max: 200000, style: { ...inputStyles } }}
                        value={spindleRPM}
                        onChange={onChange}
                    />
                </Tooltip>
            </div>

            <div>
                <Tooltip content={`Default Value: ${defaultValues.stepover}`}>
                    <Input
                        label="Stepover"
                        units="%"
                        additionalProps={{ type: 'number', id: 'stepover', min: 1, max: 100, style: { ...inputStyles } }}
                        value={stepover}
                        onChange={(e) => onChange({ ...e, shouldConvert: false })}
                    />
                </Tooltip>

                <Tooltip content={`Default Value: ${defaultValues.feedrate}`}>
                    <Input
                        label="Feedrate"
                        units={`${units}/min`}
                        additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 1000000, style: { ...inputStyles } }}
                        value={feedrate}
                        onChange={onChange}
                    />
                </Tooltip>

                <Tooltip content={`Default Value: ${defaultValues.skimDepth}`}>
                    <Input
                        label="Layer Depth"
                        units={units}
                        additionalProps={{ type: 'number', id: 'skimDepth', min: 0.001, max: 500, style: { ...inputStyles } }}
                        value={skimDepth}
                        onChange={onChange}
                    />
                </Tooltip>

                <Tooltip content={`Default Value: ${defaultValues.maxDepth}`}>
                    <Input
                        label="Max Depth"
                        units={units}
                        additionalProps={{ type: 'number', id: 'maxDepth', min: 0.001, max: 500, style: { ...inputStyles } }}
                        value={maxDepth}
                        onChange={onChange}
                    />
                </Tooltip>

                <Tooltip content={`Default Value: ${defaultValues.spindle}`}>
                    <div className={inputStyles.input}>
                        <label htmlFor="">Spindle</label>

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
                    </div>
                </Tooltip>

                <div style={{ marginTop: '2rem' }}>
                    <div className={inputStyles.input}>
                        <label htmlFor="">Start Position</label>

                        <MachinePosition
                            current={startPosition}
                            type={type}
                            onChange={(value, type) => onSelect({ value, type })}
                        />
                    </div>
                </div>
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

import React from 'react';
import PropTypes from 'prop-types';

import Input from './components/Input';

import styles from './index.styl';

const InputArea = ({ values, onChange, units }) => {
    const {
        bitDiameter,
        stepover,
        feedrate,
        length,
        width,
        skimDepth,
        spindleRPM,
        maxDepth
    } = values;

    return (
        <div className={styles.grid}>
            <div>
                <div className={styles.dimensions}>
                    <span style={{ alignSelf: 'center', fontSize: '1.1rem', margin: '0 10px' }}>Surfacing Dimensions</span>
                    <Input
                        label="Length"
                        additionalProps={{
                            type: 'number',
                            id: 'length',
                            min: 1,
                            max: 5000,
                            style: { paddingLeft: 5, paddingRight: 5, borderRadius: 4 }
                        }}
                        value={length}
                        onChange={onChange}
                        className={styles['dimension-input']}
                    />
                    <span className={styles.x}>
                        x
                    </span>
                    <Input
                        label="Width"
                        additionalProps={{
                            type: 'number',
                            id: 'width',
                            min: 1,
                            max: 5000,
                            style: { paddingLeft: 5, paddingRight: 5 }
                        }}
                        value={width}
                        onChange={onChange}
                        units={units}
                        className={styles['dimension-input']}
                    />
                </div>
                <Input
                    label="Router Bit Diameter"
                    units={units}
                    additionalProps={{ type: 'number', id: 'bitDiameter', min: 1, max: 100 }}
                    value={bitDiameter}
                    onChange={onChange}
                />
                <Input
                    label="Spindle RPM"
                    units={units}
                    additionalProps={{ type: 'number', id: 'spindleRPM', min: 1, max: 20000 }}
                    value={spindleRPM}
                    onChange={onChange}
                />
            </div>

            <div style={{ marginTop: '25px' }}>
                <Input
                    label="Stepover"
                    units="%"
                    additionalProps={{ type: 'number', id: 'stepover', min: 1, max: 100 }}
                    value={stepover}
                    onChange={onChange}
                />
                <Input
                    label="Feedrate"
                    units={`${units}/min`}
                    additionalProps={{ type: 'number', id: 'feedrate', min: 1, max: 500000 }}
                    value={feedrate}
                    onChange={onChange}
                />
                <Input
                    label="Layer Depth"
                    units={units}
                    additionalProps={{ type: 'number', id: 'skimDepth', min: 0, max: 100 }}
                    value={skimDepth}
                    onChange={onChange}
                />
                <Input
                    label="Max Depth"
                    units={units}
                    additionalProps={{ type: 'number', id: 'maxDepth', min: 1, max: 100 }}
                    value={maxDepth}
                    onChange={onChange}
                    className={styles.maxDepth}
                />
            </div>
        </div>
    );
};

InputArea.propTypes = {
    values: PropTypes.object,
    onChange: PropTypes.func,
    units: PropTypes.string,
};

export default InputArea;

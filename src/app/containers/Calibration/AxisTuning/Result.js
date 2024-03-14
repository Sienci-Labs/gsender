/* eslint-disable no-restricted-globals */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import controller from 'app/lib/controller';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import styles from './index.styl';
import { RESULT_OFFSET_THRESHOLD } from '../Alignment/utils/result';

const setEepromSetting = (setting, value) => {
    controller.command('gcode', `${setting}=${value}`);
    controller.command('gcode', '$$');
    Toaster.pop({
        msg: 'Successfully updated EEPROM values',
        type: TOASTER_SUCCESS
    });
};

const getEEPROMSetting = (axis) => {
    if (axis === 'x') {
        return '$100';
    }
    if (axis === 'y') {
        return '$101';
    } else {
        return '$102';
    }
};


const calculateNewStepsPerMM = (originalSteps, requestedDistance, actualDistance) => {
    originalSteps = Number(originalSteps);
    requestedDistance = Number(requestedDistance);
    actualDistance = Number(actualDistance);

    return originalSteps * (requestedDistance / actualDistance);
};

const Result = ({ options, onClose, xSteps, ySteps, zSteps }) => {
    const [result, setResult] = useState(0);
    useEffect(() => {
        const { currentAxis, requestedDistance, actualDistance } = options;

        if (currentAxis === 'x') {
            setResult(calculateNewStepsPerMM(xSteps, requestedDistance, actualDistance));
        } else if (currentAxis === 'y') {
            setResult(calculateNewStepsPerMM(ySteps, requestedDistance, actualDistance));
        } else {
            setResult(calculateNewStepsPerMM(zSteps, requestedDistance, actualDistance));
        }
    }, []);

    const getEEPROMValue = (axis) => {
        if (axis === 'x') {
            return xSteps;
        }
        if (axis === 'y') {
            return ySteps;
        } else {
            return zSteps;
        }
    };

    const renderResult = () => {
        const { currentAxis, requestedDistance, actualDistance } = options;
        const eepromSetting = getEEPROMSetting(currentAxis);
        const eepromValue = getEEPROMValue(currentAxis);
        const roundedResult = result.toFixed(3);

        console.log(`Rounded math result: ${roundedResult}`);
        console.log(`Threshold difference: ${RESULT_OFFSET_THRESHOLD}`);

        if (requestedDistance === actualDistance) {
            return <p>Your {currentAxis} is tuned, no need to update steps/mm.</p>;
        }

        return (
            <>
                <p>Optimal steps/mm for the { currentAxis } axis: <b>{ roundedResult } step/mm</b></p>

                <div>How we got this:</div>

                <div>
                    You requested to move <b>{ requestedDistance }mm</b> but actually moved <b>{ actualDistance }mm</b>.
                    Your current <b>{ eepromSetting }</b> value is currently set to <b>{ eepromValue }</b>
                </div>

                {
                    Math.abs((result - eepromValue)) > RESULT_OFFSET_THRESHOLD && (
                        <p style={{ padding: '1rem', backgroundColor: 'gold', border: '3px solid black', borderRadius: '10px' }}>
                            Warning. Your machine is off by a large amount, updating the EEPROM values for improved accuracy may cause issues.
                        </p>
                    )
                }
                <div><b><i>{ eepromValue } × ({ requestedDistance } ÷ { actualDistance }) = { roundedResult }</i></b></div>
            </>
        );
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            width: '80%',
            margin: 'auto'
        }}
        >
            <div className={styles.resultWrapper}>
                <div className={styles.result}>
                    {renderResult()}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <FunctionButton
                    primary
                    onClick={() => {
                        Confirm({
                            content: 'Are you sure you want to update your EEPROM value to the new steps/mm?',
                            title: 'Update EEPROM settings',
                            onConfirm: () => setEepromSetting(getEEPROMSetting(options.currentAxis), result.toFixed(3))
                        });
                    }
                    }
                >
                    Set EEPROM setting {getEEPROMSetting(options.currentAxis)} to {result.toFixed(3)}
                </FunctionButton>

                <FunctionButton onClick={onClose}>Restart Tool</FunctionButton>
            </div>
        </div>
    );
}; Result.propTypes = { options: PropTypes.object, onBack: PropTypes.func, onClose: PropTypes.func, };

export default connect((store) => {
    const settings = get(store, 'controller.settings.settings');
    const xSteps = get(settings, '$100');
    const ySteps = get(settings, '$101');
    const zSteps = get(settings, '$102');
    return {
        xSteps,
        ySteps,
        zSteps
    };
})(Result);

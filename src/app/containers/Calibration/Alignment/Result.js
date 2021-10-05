/* eslint-disable no-restricted-globals */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import mainController from 'app/lib/controller';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import styles from './index.styl';

const OFFSET_THRESHOLD = 2; //in mm. If the FM is less than or equal to this number, only a small warning message would be enough

const Icon = ({ type }) => {
    switch (type) {
    case 'error': {
        return <i className="fas fa-exclamation-circle" style={{ color: 'red' }} />;
    }

    case 'success': {
        return <i className="fas fa-check-circle" style={{ color: 'green' }} />;
    }

    case 'warning': {
        return <i className="fas fa-exclamation-triangle" style={{ color: 'orange' }} />;
    }

    default: {
        return <i className="fas fa-exclamation-circle" />;
    }
    }
};

const Result = ({ triangle, jogValues, onBack, onClose }) => {
    const controller = useSelector(state => state.controller);

    const [machineIsSquared, setMachineIsSquared] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [fm, setFm] = useState(false);

    const [stepsUpdate, setStepsUpdate] = useState(null);

    useEffect(() => {
        try {
            const { a, b, c } = triangle;
            const HYPOTENUSE = performPythagoreanEquation({ a, b });

            if (HYPOTENUSE !== c) {
                const ALPHA = calculateAlpha({ a, b, c });
                const BETA = calculateBeta({ trueHypotenuse: HYPOTENUSE, userHypotenuse: c, alpha: ALPHA });

                const FM = calculateFM({ b, beta: BETA });

                if (isNaN(ALPHA) || isNaN(BETA) || isNaN(FM)) {
                    throw new Error();
                }

                setFm(FM);
                setHasError(false);
            } else {
                setMachineIsSquared(true);
                setHasError(false);
            }
            checkStepsPerMM();
        } catch (error) {
            setHasError(true);
        }
    }, []);

    const calculateAlpha = ({ a, b, c }) => (Math.acos((((a ** 2) + (b ** 2) - (c ** 2)) / (2 * a * b))) * (180 / Math.PI));

    const calculateBeta = ({ trueHypotenuse, userHypotenuse, alpha }) => (userHypotenuse <= trueHypotenuse ? 90 - alpha : alpha - 90);

    const calculateFM = ({ b, beta }) => Number((b * Math.sin(beta * (Math.PI / 180))).toFixed(2));

    const movementCalculation = ({ currentStep, movedDistance, actualDistance }) => (currentStep * (movedDistance / actualDistance));

    const performPythagoreanEquation = ({ a, b }) => {
        if (!a || !b) {
            return null;
        }

        return Math.sqrt((triangle.a ** 2) + (triangle.b ** 2));
    };

    const checkStepsPerMM = () => {
        const { settings } = controller.settings;
        const {
            $100: currentXStep,
            $101: currentYStep,
        } = settings;

        const { a, b } = triangle;
        const { x, y } = jogValues;


        const stepsToChange = {
            x: { should: false, amount: 0 },
            y: { should: false, amount: 0 },
        };

        const calculatedXStep = Math.round(movementCalculation({ currentStep: Number(currentYStep), movedDistance: y, actualDistance: a }));
        const calculatedYStep = Math.round(movementCalculation({ currentStep: Number(currentXStep), movedDistance: x, actualDistance: b }));

        if (calculatedXStep !== Number(currentXStep)) {
            stepsToChange.x.should = true;
            stepsToChange.x.amount = calculatedXStep;
        }

        if (calculatedYStep !== Number(currentYStep)) {
            stepsToChange.y.should = true;
            stepsToChange.y.amount = calculatedYStep;
        }

        if (stepsToChange.y.should || stepsToChange.x.should) {
            setStepsUpdate(stepsToChange);
        }
    };

    const updateEepromSettings = () => {
        const { x, y } = stepsUpdate;

        if (x?.should) {
            mainController.command('gcode', `$100 = ${x.amount}`);
        }

        if (y?.should) {
            mainController.command('gcode', `$101 = ${y.amount}`);
        }

        if (x?.should || y?.should) {
            mainController.command('gcode', '$$');
            Toaster.pop({
                msg: 'Machine Settings Updated Succesfully',
                type: TOASTER_SUCCESS
            });
        }
    };

    const handleUpdateClick = () => {
        const { x, y } = stepsUpdate;
        Confirm({
            title: 'Update Machine Settings',
            content: (
                <>
                    <p>Your machines EEPROM settings will be updated to the following:</p>
                    {x?.should && <p><strong>$100</strong> - X steps/mm will be updated to <strong>{x?.amount}</strong></p>}
                    {y?.should && <p><strong>$101</strong> - Y steps/mm will be updated to <strong>{y?.amount}</strong></p>}
                </>
            ),
            confirmLabel: 'Update',
            onConfirm: updateEepromSettings
        });
    };

    const renderResult = () => {
        if (hasError) {
            return (
                <>
                    <div className={styles.result}>
                        <Icon type="error" />
                        <p className={styles.resultText}>There was an error in the calculation, please check the values you provided.</p>
                    </div>

                    <FunctionButton primary onClick={onBack}>Go Back</FunctionButton>
                </>
            );
        }

        if (machineIsSquared || fm === 0) {
            return (
                <>
                    <div className={styles.result}>
                        <Icon type="success" />
                        <p className={styles.resultText}>Your machine is squared properly, no adjustments are needed!</p>
                    </div>

                    <FunctionButton primary onClick={onClose}>Exit Calibration Tool</FunctionButton>
                </>
            );
        }

        if (fm <= OFFSET_THRESHOLD) {
            return (
                <>
                    <div className={styles.result}>
                        <Icon type="warning" />
                        <p>Your machine is pretty squared, but if you still want to have it full squared, move either the right y-axis rail backwards <strong>{fm}mm</strong> or the left y-axis rail forward by <strong>{fm}mm</strong></p>
                    </div>

                    {
                        stepsUpdate
                            ? (
                                <>
                                    <p className={styles.resultText}>We also noticed your steps-per-mm can be updated for improved accuracy on your machine, you can click the button below to do so.</p>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <FunctionButton primary onClick={handleUpdateClick}>Update Machine Settings</FunctionButton>
                                        <FunctionButton primary onClick={onClose}>Exit Calibration Tool</FunctionButton>
                                    </div>
                                </>
                            )
                            : <FunctionButton primary onClick={onClose}>Exit Calibration Tool</FunctionButton>
                    }
                </>
            );
        }

        return (
            <>
                <div className={styles.result}>
                    <Icon type="error" />
                    <p>Your machine is off by <strong>{fm}mm</strong>, to properly square it, move either the right y-axis rail backwards <strong>{fm}mm</strong> or the left y-axis rail forward by <strong>{fm}mm</strong></p>
                </div>

                {
                    stepsUpdate
                        ? (
                            <>
                                <p className={styles.resultText}>We also noticed your steps-per-mm can be updated for improved accuray on your machine, you can click the button below to do so.</p>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <FunctionButton primary onClick={handleUpdateClick}>Update Machine Settings</FunctionButton>
                                    <FunctionButton primary onClick={onClose}>Exit Calibration Tool</FunctionButton>
                                </div>
                            </>
                        )
                        : <FunctionButton primary onClick={onClose}>Exit Calibration Tool</FunctionButton>
                }
            </>
        );
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '100%', width: '100%' }}>
            <h4 style={{ marginTop: '2rem' }}>Calibration Results</h4>

            {renderResult()}
        </div>
    );
}; Result.propTypes = { triangle: PropTypes.object, onBack: PropTypes.func, onClose: PropTypes.func, };

export default Result;

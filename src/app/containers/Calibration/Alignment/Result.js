import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import mainController from 'app/lib/controller';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import { calculateHypotenuse, calculateAlpha, calculateBeta, calculateFM, calculateMovement, FM_OFFSET_THRESHOLD } from './utils/result';
import styles from './index.styl';

const Icon = ({ type = 'default' }) => {
    const icon = {
        error: <i className="fas fa-exclamation-circle" />,
        success: <i className="fas fa-check-circle" />,
        warning: <i className="fas fa-exclamation-triangle" />,
        default: <i className="fas fa-exclamation-circle" />,
    }[type];

    return icon;
};

const Result = ({ triangle, jogValues, onBack, onClose }) => {
    const controller = useSelector(state => state.controller);

    const [machineIsSquared, setMachineIsSquared] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [fm, setFm] = useState(false);
    const [directions, setDirections] = useState(['backwards', 'forward']);
    const [stepsUpdate, setStepsUpdate] = useState(null);

    useEffect(() => {
        try {
            const { a, b, c } = triangle;
            const hypotenuse = calculateHypotenuse({ a, b });

            if (hypotenuse !== c) {
                const alpha = calculateAlpha({ a, b, c });
                const beta = calculateBeta({ trueHypotenuse: hypotenuse, userHypotenuse: c, alpha: alpha });
                const fm = calculateFM({ b, beta: beta });

                if (c < hypotenuse) {
                    setDirections(['forward', 'backwards']);
                }

                if (Number.isNaN(alpha) || Number.isNaN(beta) || Number.isNaN(fm)) {
                    throw new Error();
                }

                setFm(fm);
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

        const calculatedXStep = Math.round(calculateMovement({ currentStep: Number(currentYStep), movedDistance: y, actualDistance: a }));
        const calculatedYStep = Math.round(calculateMovement({ currentStep: Number(currentXStep), movedDistance: x, actualDistance: b }));

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
            onClose();
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
                    <div className={classnames(styles.result, styles.resultError)}>
                        <Icon type="error" />
                        <p className={styles.resultText}>There was an error in the calculation, please check the values you provided.</p>
                    </div>

                    <FunctionButton onClick={onBack}>Go Back</FunctionButton>
                </>
            );
        }

        if (machineIsSquared || fm === 0) {
            return (
                <>
                    <div className={classnames(styles.result, styles.resultSuccess)}>
                        <Icon type="success" />
                        <p className={styles.resultText}>Your machine is properly squared, no adjustments are needed!</p>
                    </div>

                    <FunctionButton onClick={onClose}>Exit Calibration Tool</FunctionButton>
                </>
            );
        }

        if (fm <= FM_OFFSET_THRESHOLD) {
            return (
                <>
                    <div className={classnames(styles.result, styles.resultWarning)}>
                        <Icon type="warning" />
                        <p>
                            Your machine is pretty squared, but if you still want to have it full squared, move either the right y-axis rail backwards
                            {' '}<strong>{fm}mm</strong> or the left y-axis rail forward by <strong>{fm}mm</strong>
                        </p>

                        {stepsUpdate && (
                            <p className={styles.resultText}>
                                We also noticed your steps-per-mm can be updated for improved accuracy on your machine,
                                you can click &quot;Update Machine Settings&quot; to update your EEPROM values.
                            </p>
                        )}
                    </div>

                    {
                        stepsUpdate
                            ? (
                                <div className={styles.buttonWrapper}>
                                    <FunctionButton primary onClick={handleUpdateClick}>Update Machine Settings</FunctionButton>
                                    <FunctionButton onClick={onClose}>Exit Calibration Tool</FunctionButton>
                                </div>
                            )
                            : <FunctionButton onClick={onClose}>Exit Calibration Tool</FunctionButton>
                    }
                </>
            );
        }

        let [rightDirection, leftDirection] = directions;

        return (
            <>
                <div className={classnames(styles.result, styles.resultError)}>
                    <Icon type="error" />
                    <p>
                        Your machine is off by <strong>{fm}mm</strong>, to properly square it, move either the right y-axis rail { rightDirection }
                        {' '}<strong>{fm}mm</strong> or the left y-axis rail { leftDirection } by <strong>{fm}mm</strong>
                    </p>

                    {stepsUpdate && (
                        <p>
                            We also noticed your steps-per-mm can be updated for improved accuracy on your machine,
                            you can click &quot;Update Machine Settings&quot; to update your EEPROM values.
                        </p>
                    )}
                </div>

                {
                    stepsUpdate
                        ? (
                            <div className={styles.buttonWrapper}>
                                <FunctionButton primary onClick={handleUpdateClick}>Update Machine Settings</FunctionButton>
                                <FunctionButton onClick={onClose}>Exit Calibration Tool</FunctionButton>
                            </div>
                        )
                        : <FunctionButton onClick={onClose}>Exit Calibration Tool</FunctionButton>
                }
            </>
        );
    };

    return (
        <div className={styles.resultPageWrapper}>
            {renderResult()}
        </div>
    );
};

Result.propTypes = {
    triangle: PropTypes.object,
    onBack: PropTypes.func,
    onClose: PropTypes.func,
};

export default Result;

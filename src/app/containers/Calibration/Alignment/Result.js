/* eslint-disable no-restricted-globals */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

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

const Result = ({ triangle, onBack, onClose }) => {
    const [machineIsSquared, setMachineIsSquared] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [fm, setFm] = useState(false);

    useEffect(() => {
        const { a, b, c } = triangle;
        const HYPOTENUSE = performPythagoreanEquation({ a, b });

        if (HYPOTENUSE !== c) {
            try {
                const ALPHA = calculateAlpha({ a, b, c });
                const BETA = calculateBeta({ trueHypotenuse: HYPOTENUSE, userHypotenuse: c, alpha: ALPHA });

                const FM = calculateFM({ b, beta: BETA });

                if (isNaN(ALPHA) || isNaN(BETA) || isNaN(FM)) {
                    throw new Error();
                }

                setFm(FM);
                setHasError(false);
            } catch (error) {
                setHasError(true);
            }
        } else {
            setMachineIsSquared(true);
            setHasError(false);
        }
    }, []);

    const calculateAlpha = ({ a, b, c }) => (Math.acos((((a ** 2) + (b ** 2) - (c ** 2)) / (2 * a * b))) * (180 / Math.PI));

    const calculateBeta = ({ trueHypotenuse, userHypotenuse, alpha }) => (userHypotenuse <= trueHypotenuse ? 90 - alpha : alpha - 90);

    const calculateFM = ({ b, beta }) => Number((b * Math.sin(beta * (Math.PI / 180))).toFixed(2));

    const performPythagoreanEquation = ({ a, b }) => {
        if (!a || !b) {
            return null;
        }

        return Math.sqrt((triangle.a ** 2) + (triangle.b ** 2));
    };

    const renderResult = () => {
        if (hasError) {
            return (
                <>
                    <Icon type="error" />
                    <p>There was an error in the calculation, please check the values you provided.</p>
                </>
            );
        }

        if (machineIsSquared || fm === 0) {
            return (
                <>
                    <Icon type="success" />
                    <p>Your machine is squared properly, no adjustments are needed!</p>
                </>
            );
        }

        if (fm <= OFFSET_THRESHOLD) {
            return (
                <>
                    <Icon type="warning" />
                    <p>Your machine is pretty squared, but if you still want to have it full squared, move either the right y-axis rail backwards <strong>{fm}mm</strong> or the left y-axis rail forward by <strong>{fm}mm</strong></p>
                    <p>We also noticed your steps-per-mm can be updated for improved accuray on your machine, you can click the button below to do so.</p>
                </>
            );
        }

        return (
            <>
                <Icon type="error" />
                <p>Your machine is off by <strong>{fm}mm</strong>, to properly square it, move either the right y-axis rail backwards <strong>{fm}mm</strong> or the left y-axis rail forward by <strong>{fm}mm</strong></p>
                <p>We also noticed your steps-per-mm can be updated for improved accuray on your machine, you can click the button below to do so.</p>
            </>
        );
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '100%', width: '100%' }}>
            <h4 style={{ marginTop: '2rem' }}>Calibration Results</h4>

            <div className={styles.result}>
                {renderResult()}
            </div>

            { hasError && <FunctionButton primary onClick={onBack}>Go Back</FunctionButton> }

            {
                machineIsSquared
                    ? <FunctionButton primary onClick={onClose}>Exit Calibration Tool</FunctionButton>
                    : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <FunctionButton primary>Update Machine Settings</FunctionButton>
                            <FunctionButton primary onClick={onClose}>Exit Calibration Tool</FunctionButton>
                        </div>
                    )
            }
        </div>
    );
}; Result.propTypes = { triangle: PropTypes.object, onBack: PropTypes.func, onClose: PropTypes.func, };

export default Result;

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ToolIntroduction from 'app/containers/Calibration/AxisTuning/ToolIntroduction';
import ImageDiagram from 'app/containers/Calibration/AxisTuning/ImageDiagram';

import Step from './Step';
import NavigationButtons from './NavigationButtons';
import Result from './Result';

import styles from './index.styl';
import { axisSteps } from './data';
import { collectUserUsageData } from '../../../lib/heatmap';
import { USAGE_TOOL_NAME } from '../../../constants';

const AxisTuning = ({ onClose }) => {
    const steps = [axisSteps.x];

    const [currentStep, setCurrentStep] = useState(0);
    const [actions, setActions] = useState(steps[currentStep]);
    const [currentAction, setCurrentAction] = useState(0);
    const [stepFinished, setStepFinished] = useState(false);
    const [isFullyComplete, setIsFullyComplete] = useState(false);
    const [introComplete, setIntroComplete] = useState(false);
    const [currentAxis, setCurrentAxis] = useState('x');
    const [requestedDistance, setRequestedDistance] = useState(0);
    const [actualDistance, setActualDistance] = useState(0);

    const getOptions = () => {
        return {
            currentAxis,
            requestedDistance,
            actualDistance,
        };
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.MOVEMENT_TUNING);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        const isFinished = actions.every((action) => action.checked);

        if (isFinished) {
            setStepFinished(true);
        }
    }, [actions]);

    useEffect(() => {
        const retrievedStep = axisSteps[currentAxis];

        if (retrievedStep) {
            setActions(retrievedStep);
        }
    }, [currentAxis]);

    const onChange = ({ id, checked }) => {
        const foundAction = actions.find(action => action.id === Number(id));

        if (foundAction && foundAction.hasBeenChanged) {
            return;
        }

        const updatedActions = actions.map(action => (
            action.id === id
                ? ({ ...action, checked, hasBeenChanged: true })
                : action
        ));
        setCurrentAction(id + 1);

        setActions(updatedActions);
    };

    const next = () => {
        const nextStep = currentStep + 1;
        if (steps[nextStep]) {
            setActions(steps[nextStep]);
            setCurrentAction(0);
            setCurrentStep(nextStep);
            setStepFinished(false);
        } else {
            setIsFullyComplete(true);
        }
    };

    const prev = () => {
        const prevStep = currentStep - 1;
        if (steps[prevStep]) {
            setActions(steps[prevStep]);
            setCurrentAction(0);
            setCurrentStep(prevStep);
            setStepFinished(false);
        }
    };


    const reset = () => {
        setIntroComplete(false);
        setCurrentStep(0);
        setIsFullyComplete(false);
        setCurrentAction(0);
        const retrievedStep = axisSteps[currentAxis];

        if (retrievedStep) {
            setActions(retrievedStep);
        }
    };

    const onBack = () => {
        setIsFullyComplete(false);
    };

    const startTool = () => {
        setIntroComplete(true);
    };

    const actionData = actions.find(action => action.id === currentAction);

    const prevDisabled = !!steps[currentStep - 1];
    const nextDisabled = stepFinished;
    const options = getOptions();

    if (isFullyComplete) {
        return <Result options={options} onBack={onBack} onClose={reset} />;
    }

    return (
        <div className={styles.alignmentContainer}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {
                    !introComplete &&
                    <ToolIntroduction readyHandler={startTool} onSelectAxis={(axis) => setCurrentAxis(axis)} currentAxis={currentAxis} />
                }
                {
                    introComplete && (
                        <Step
                            actions={actions}
                            onChange={onChange}
                            currentAction={currentAction}
                            options={options}
                            setRequestedDistance={setRequestedDistance}
                            setActualDistance={setActualDistance}
                        />
                    )
                }

                {
                    introComplete && (
                        <NavigationButtons
                            onNext={next}
                            onPrevious={prev}
                            prevDisabled={prevDisabled}
                            nextDisabled={nextDisabled}
                        />
                    )
                }
            </div>

            <div style={{ justifyContent: 'space-between', padding: '3rem', display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', backgroundColor: 'white' }}>
                {
                    <ImageDiagram actions={actions} currentAction={currentAction} />
                }
                {
                    !introComplete && <p style={{ width: '100%', fontWeight: 'bold' }}>Whichever axis you’ll be tuning, please place it in an initial location so that it’ll have space to move to the right (for X), backwards (for Y), and downwards (for Z).</p>
                }
                {
                    introComplete && <p style={{ width: '100%', fontWeight: 'bold' }}>{stepFinished ? 'Proceed to the Next Step' : actionData?.description}</p>
                }
            </div>
        </div>
    );
};

AxisTuning.propTypes = { step: PropTypes.object };

export default AxisTuning;

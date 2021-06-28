import React from 'react';
import PropTypes from 'prop-types';

import ActionItem from '../ActionItem';

import styles from './index.styl';

const Step = ({ actions, currentAction, onChange, setRequestedDistance, setActualDistance }) => {
    return (
        <div className={styles.actionItemContainer}>
            {
                actions.map(step => (
                    <ActionItem
                        key={step.id}
                        id={step.id}
                        checked={step.checked}
                        isCurrentAction={step.id === currentAction}
                        hasBeenChanged={step.hasBeenChanged}
                        hideCompleteButton={step.hideCompleteButton}
                        label={step.label}
                        onChange={onChange}
                        setRequestedDistance={setRequestedDistance}
                        setActualDistance={setActualDistance}
                    />
                ))
            }
        </div>
    );
};

Step.propTypes = {
    handleFinish: PropTypes.func,
    actions: PropTypes.array,
    currentAction: PropTypes.number,
    onChange: PropTypes.func,
};

export default Step;

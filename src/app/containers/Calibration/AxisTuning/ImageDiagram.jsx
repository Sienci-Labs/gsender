import React from 'react';
import PropTypes from 'prop-types';
import styles from './index.styl';

const ImageDiagram = ({ actions, currentAction }) => {
    console.log(currentAction);
    const imgIndex = (currentAction === actions.length) ? currentAction - 1 : currentAction;
    return (
        <div className={styles.diagramWrapper}>
            <img src={actions[imgIndex].image} alt="Axis tuning diagram" />
        </div>
    );
};

ImageDiagram.propTypes = {
    actions: PropTypes.array,
    currentStep: PropTypes.number
};

export default ImageDiagram;

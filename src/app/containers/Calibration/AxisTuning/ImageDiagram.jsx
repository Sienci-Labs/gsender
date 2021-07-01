import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import styles from './index.styl';

const ImageDiagram = ({ actions, currentAction }) => {
    return (
        <div className={styles.diagramWrapper}>
            {
                actions.map(action => {
                    return <img
                        src={action.image}
                        alt="Axis tuning diagram"
                        className={cx({ [styles.hidden]: action.id !== currentAction })}
                    />;
                })
            }

        </div>
    );
};

ImageDiagram.propTypes = {
    actions: PropTypes.array,
    currentStep: PropTypes.number
};

export default ImageDiagram;

import React from 'react';
import styles from '../index.styl';

const Tool = ({ metricDiameter, imperialDiameter, type, onDelete }) => {
    return (
        <div className={styles.tool}>
            <div className={styles.toolDimensions}>
                <div><b>{metricDiameter}</b>mm</div>
                <div><b>{imperialDiameter}</b>in</div>
            </div>
            <div>{type}</div>
            <button
                type="button"
                className={styles.delete}
                alt="Delete Tool"
                onClick={onDelete}
            >
                <i className="far fa-trash-alt" />
            </button>

        </div>
    );
};

export default Tool;

import React from 'react';
import PropTypes from 'prop-types';

import styles from './GcodeViewer.styl';

const GcodeViewer = ({ gcode }) => {
    return (
        <div className={styles.wrapper}>
            {
                gcode
                    .split('\n')
                    .map((line, i) => (
                        <div key={line + i} className={styles.line}>
                            <span className={styles.lineNumber}>{ i + 1 }</span> <code className={styles.lineCode}>{line}</code>
                        </div>
                    ))}
        </div>
    );
};

GcodeViewer.propTypes = {
    gcode: PropTypes.string,
};

export default GcodeViewer;

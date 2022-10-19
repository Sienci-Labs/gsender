import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getAllErrors } from './helper';
import styles from '../index.styl';

const ErrorLog = () => {
    const [error, setError] = useState(getAllErrors());
    useEffect(() => {
        setError(getAllErrors() || ['Nothing to display']);
    }, []);
    return (
        <div className={styles.errorWrapper}>
            <div className={styles.errorHeading}>
                Errors and alarms summary
            </div>
            <div className={styles.errorBody}>
                <ul>
                    {error.map((item, index) => {
                        return <li key={index}>{item}</li>;
                    })}
                </ul>
            </div>
        </div>
    );
};

ErrorLog.protoTypes = {
    errors: PropTypes.object,
};

export default ErrorLog;

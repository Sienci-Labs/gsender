import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from '../index.styl';

const ErrorLog = ({ getErrors }) => {
    const [error, setError] = useState([]);
    useEffect(() => {
        setError(getErrors());
    }, []);
    return (
        <div className={styles.errorWrapper}>
            <div className={styles.errorHeading}>
                Errors and alarms summary
            </div>
            <div className={styles.errorBody}>
                <ul>
                    {error.map((item) => {
                        return <li key={item}>{item}</li>;
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

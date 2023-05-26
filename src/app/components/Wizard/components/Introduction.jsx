import React from 'react';
import styles from '../index.styl';

const Introduction = ({ description, title }) => {
    return (
        <div className={styles.introduction}>
            <h2>{title}</h2>
            <p>{description}</p>
        </div>
    );
};

export default Introduction;

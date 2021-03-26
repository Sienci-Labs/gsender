import React from 'react';
import styles from '../index.styl';

const Slider = ({ step = 1, min = 0, max = 100, value = 50, onChange = null, label = 'Range', unitString = 'RPM' }) => {
    return (
        <div className={styles.sliderWrapper}>
            <span>{label}:</span>
            <input type="range" min={min} max={max} value={value} onChange={onChange} className={styles.slider} step={step} />
            <span>{ value } { unitString }</span>
        </div>
    );
};

export default Slider;

/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import styles from './index.styl';

/*
 Custom Tooltip Component
 Content Prop: String to be displayed when hovered
 Disabled Prop: Varibale to set css display: none;
 Location Prop: Where tooltip should be displayed(See css file)
*/

const Tooltip = (props) => {
    let disabled = props.disabled;
    let timeout;
    const [active, setActive] = useState(false);

    const showTip = () => {
        timeout = setTimeout(() => {
            setActive(true);
        }, props.delay || 1000);
    };

    const hideTip = () => {
        clearInterval(timeout);
        setActive(false);
    };

    return (
        <div
            className={styles.TooltipWrapper}
            // When to show the tooltip
            onMouseEnter={showTip}
            onMouseLeave={hideTip}
        >
            {props.children}
            {active && (
                <div className={disabled ? styles.disabled : styles[`${props.location}`]}>
                    {props.content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;

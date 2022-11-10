import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip as MainToolTip } from 'app/components/Tooltip';

const Tooltip = ({ location, content, disabled, children, style, wrapperStyle, wrapperClassName }) => {
    return (
        <MainToolTip
            content={content}
            placement={location === 'default' ? 'bottom' : location}
            enterDelay={1000}
            disabled={disabled}
            tooltipStyle={style}
        >
            <div style={wrapperStyle} className={wrapperClassName}>
                {children}
            </div>
        </MainToolTip>
    );
};

Tooltip.propTypes = {
    location: PropTypes.string,
    content: PropTypes.string || PropTypes.node,
    disabled: PropTypes.bool,
    wrapperStyle: PropTypes.object,
    wrapperClassName: PropTypes.string
};

export default Tooltip;

import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip as MainToolTip } from 'app/components/Tooltip';

const Tooltip = ({ location, content, disabled, children }) => {
    return (
        <MainToolTip
            content={content}
            placement={location === 'default' ? 'bottom' : location}
            enterDelay={1000}
            disabled={disabled}
        >
            <div>
                {children}
            </div>
        </MainToolTip>
    );
};

Tooltip.propTypes = {
    location: PropTypes.string,
    content: PropTypes.string || PropTypes.node,
    disabled: PropTypes.bool,
};

export default Tooltip;

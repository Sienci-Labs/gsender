import React from 'react';
import PropTypes from 'prop-types';

import Tooltip from 'app/components/TooltipCustom/ToolTip';

const ShowTooltip = ({ tooltip, children }) => {
    if (tooltip?.content) {
        return <Tooltip {...tooltip}>{children}</Tooltip>;
    }

    return children;
}; ShowTooltip.propTypes = { tooltip: PropTypes.object };

export default ShowTooltip;

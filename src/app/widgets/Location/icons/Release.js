import React from 'react';

import PropTypes from 'prop-types';

const Release = ({ fill, isMovement }) => {
    fill = (isMovement ? '#FFFFFF' : fill);
    return (
        <i className="fas fa-arrow-alt-circle-up" />
    );
};

Release.propTypes = {
    fill: PropTypes.string,
    isMovement: PropTypes.bool
};

export default Release;

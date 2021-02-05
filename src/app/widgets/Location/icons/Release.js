import React from 'react';

import PropTypes from 'prop-types';

const Release = ({ fill }) => {
    return (
        <i className="fas fa-arrow-alt-circle-up" />
    );
};

Release.propTypes = {
    fill: PropTypes.string,
};

export default Release;

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const NavSidebarLink = ({ label, url, icon }) => {
    return (
        <Link
            to={url}
            title={label}
        >
            <i className={`fa fas ${icon}`} /> {label}
        </Link>
    );
};

NavSidebarLink.propTypes = {
    label: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
};

export default NavSidebarLink;

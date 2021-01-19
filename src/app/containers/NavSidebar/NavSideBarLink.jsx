import React from 'react';
import PropTypes from 'prop-types';


const NavSidebarLink = ({ label, url = '#', icon, onClick }) => {
    return (
        <button
            onClick={onClick}
        >
            <i className={`fa fas ${icon}`} /> {label}
        </button>
    );
};

NavSidebarLink.propTypes = {
    label: PropTypes.string.isRequired,
    url: PropTypes.string,
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func
};

export default NavSidebarLink;

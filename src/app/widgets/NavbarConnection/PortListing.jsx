import React from 'react';
import PropTypes from 'prop-types';
import styles from './Index.styl';

const PortListing = ({ port, inuse, manufacturer = '', baudrate, controllerType, onClick }) => {
    return (
        <button className={styles.NavbarDropdown} onClick={onClick}>
            <i className={`fa ${inuse ? 'fa-lock' : 'fa-usb'}`} />
            <div className={styles.NavbarPortListingInfo}>
                <div className={styles.NavbarPortListingPortLabel}>{ port }</div>
                <div className={styles.NavbarPortListingPortManufacturer}>{controllerType} at { manufacturer === '' ? baudrate : manufacturer } baud</div>
            </div>
        </button>
    );
};

PortListing.propTypes = {
    port: PropTypes.number,
    inuse: PropTypes.bool,
    manufacturer: PropTypes.string,
    baudrate: PropTypes.number,
    controllerType: PropTypes.string,
    onClick: PropTypes.func
};

export default PortListing;

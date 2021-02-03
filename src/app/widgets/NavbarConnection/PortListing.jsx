import React from 'react';
import PropTypes from 'prop-types';
import styles from './Index.styl';

const PortListing = ({ port, inuse, baudrate, controllerType, onClick }) => {
    return (
        <button className={styles.PortListing} onClick={onClick}>
            <i className={`fa fab ${inuse ? 'fa-lock' : 'fa-lock-open'}`} />
            <div className={styles.NavbarPortListingInfo}>
                <div className={styles.NavbarPortListingPortLabel}>{ port }</div>
                <div className={styles.NavbarPortListingPortManufacturer}>use {controllerType} at { baudrate } baud</div>
            </div>
        </button>
    );
};

PortListing.propTypes = {
    port: PropTypes.string,
    inuse: PropTypes.bool,
    baudrate: PropTypes.number,
    controllerType: PropTypes.string,
    onClick: PropTypes.func
};

export default PortListing;

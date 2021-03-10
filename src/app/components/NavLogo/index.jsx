import React from 'react';
import styles from './index.styl';

const NavLogo = ({ updateAvailable = false, onClick }) => {
    return (
        <div className={styles.NavLogo}>
            <img alt="Sienci Logo" src="images/logo_sienci_100x100.png" />
            {
                updateAvailable &&
                    <button title="New Version Available!" className={styles.updateNotification} onClick={onClick}>
                        <i className="fas fa-download" />
                    </button>
            }
        </div>
    );
};

export default NavLogo;

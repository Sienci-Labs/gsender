import React from 'react';
import { Link } from 'react-router-dom';
import styles from './index.styl';

const NavLogo = () => {
    return (
        <div className={styles.NavLogo}>
            <Link to="/Workspace">
                <img alt="Sienci Logo" src="images/logo_sienci_100x100.png" />
            </Link>
        </div>
    );
};

export default NavLogo;

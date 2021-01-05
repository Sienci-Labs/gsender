import React, { PureComponent } from 'react';
import styles from './Index.styl';

class NavbarConnection extends PureComponent {
    render() {
        return (
            <div className={styles.NavbarConnection}>
                <div className={styles.NavbarConnectionIcon}>I</div>
                Disconnected
            </div>
        );
    }
}

export default NavbarConnection;

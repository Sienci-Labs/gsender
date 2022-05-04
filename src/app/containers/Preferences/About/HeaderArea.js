import React from 'react';

import logo from 'app/images/icon-round.png';
import canadaFlagIcon from 'app/images/canada-flag-icon.png';

import { version } from '../../../../package.json';
import styles from './index.styl';

const HeaderArea = () => {
    return (
        <div className={styles.headerArea}>
            <div className={styles.headerLeft}>
                <img src={logo} alt="" className={styles.logo} />
                <div style={{ alignSelf: 'center' }}>
                    <h2 style={{ margin: 0 }}>gSender</h2>
                    <small>by Sienci Labs</small>
                    <p>Version {version || '0.6.5'}</p>
                </div>
            </div>

            <div className={styles.headerRight}>
                <p>Copyright &copy; 2022 Sienci Labs Inc.</p>
                <div className={styles.country}><span>Made in Canada</span> <img src={canadaFlagIcon} alt="Canada Flag" /></div>
                <p>
                    <a
                        href="https://github.com/Sienci-Labs/sender/blob/master/LICENSE"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GNU GPLv3 License
                    </a>
                </p>
            </div>
        </div>
    );
};

export default HeaderArea;

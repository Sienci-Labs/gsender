/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import PropTypes from 'prop-types';
import React from 'react';
import Anchor from 'app/components/Anchor';
import settings from 'app/config/settings';
import i18n from 'app/lib/i18n';
import styles from './index.styl';

const AboutContainer = ({ version }) => {
    const wiki = 'https://github.com/cncjs/cncjs/wiki';

    return (
        <div className={styles.aboutContainer}>
            <img src="images/icon-square.png" alt="" className={styles.productLogo} />
            <div className={styles.productDetails}>
                <div className={styles.aboutProductName}>
                    {`${settings.productName} ${version.current}`}
                </div>
                <div className={styles.aboutProductDescription}>
                    {i18n._('A web-based interface for CNC milling controller running Grbl, Smoothieware, or TinyG')}
                </div>
                <Anchor
                    className={styles.learnmore}
                    href={wiki}
                    target="_blank"
                >
                    {i18n._('Learn more')}
                    <i className="fa fa-arrow-circle-right" style={{ marginLeft: 5 }} />
                </Anchor>
            </div>
        </div>
    );
};

AboutContainer.propTypes = {
    version: PropTypes.object
};

export default AboutContainer;

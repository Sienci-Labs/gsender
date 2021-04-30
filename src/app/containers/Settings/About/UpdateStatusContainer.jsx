/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

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

import moment from 'moment';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import semver from 'semver';
import Anchor from 'app/components/Anchor';
import Space from 'app/components/Space';
import settings from 'app/config/settings';
import i18n from 'app/lib/i18n';
import styles from './index.styl';

const UpdateStatusContainer = (props) => {
    const { checking, current, latest, lastUpdate } = props;
    const newUpdateAvailable = (checking === false) && semver.lt(current, latest);

    if (checking) {
        return (
            <div className={styles.updateStatusContainer}>
                <div className={styles.updateStatusIcon}>
                    <i className="fa fa-fw fa-spin fa-circle-o-notch" />
                </div>
                <div className={styles.updateStatusMessageContainer}>
                    <div className={styles.updateStatusMessage}>
                        {i18n._('Checking for updates...')}
                    </div>
                </div>
            </div>
        );
    }

    if (newUpdateAvailable) {
        return (
            <div className={styles.updateStatusContainer}>
                <div className={classNames(styles.updateStatusIcon, styles.warning)}>
                    <i className="fa fa-exclamation-circle fa-fw" />
                </div>
                <div className={styles.updateStatusMessageContainer}>
                    <div className={styles.updateStatusMessage}>
                        {i18n._('A new version of {{name}} is available', { name: settings.productName })}
                    </div>
                    <div className={styles.releaseLatest}>
                        {i18n._('Version {{version}}', { version: latest })}
                        <br />
                        {moment(lastUpdate).format('LLL')}
                    </div>
                </div>
                <div className={styles.updateStatusActionContainer}>
                    <Anchor
                        href="https://github.com/cncjs/cncjs/releases"
                        target="_blank"
                    >
                        <span className={styles.label}>
                            {i18n._('Latest version')}
                            <Space width="8" />
                            <i className="fa fa-external-link fa-fw" />
                        </span>
                    </Anchor>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.updateStatusContainer}>
            <div className={classNames(styles.updateStatusIcon, styles.info)}>
                <i className="fa fa-check-circle fa-fw" />
            </div>
            <div className={styles.updateStatusMessageContainer}>
                <div className={styles.updateStatusMessage}>
                    {i18n._('You already have the newest version of {{name}}', { name: settings.productName })}
                </div>
            </div>
        </div>
    );
};

UpdateStatusContainer.propTypes = {
    checking: PropTypes.bool,
    current: PropTypes.string,
    latest: PropTypes.string,
    lastUpdate: PropTypes.string
};

export default UpdateStatusContainer;

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

import React from 'react';
import styles from './index.styl';

const HelpCard = ({ title, text, link, icon, linkText }) => {
    return (
        <div className={styles.cardBase}>
            <a href={link} target="_blank" className={styles.overLink}> </a>
            <div className={styles.externalIcon}>
                <i className="fas fa-external-link-alt" />
            </div>
            <h2>{ title }</h2>
            <div className={styles.cardIcon}>
                <i className={`fa ${icon}`} />
            </div>
            <div className={styles.cardText}>
                { text }
            </div>
            <a className={styles.cardLink} target="_blank" href={link}>{ linkText }</a>
        </div>
    );
};

export default HelpCard;

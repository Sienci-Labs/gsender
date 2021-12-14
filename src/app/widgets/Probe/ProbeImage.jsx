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
import cx from 'classnames';
import Image from 'app/components/Image';
import styles from './index.styl';
import XProbe from './assets/Block-X.gif';
import YProbe from './assets/Block-Y.gif';
import XYProbe from './assets/Block-XY.gif';
import XYZProbe from './assets/Block-XYZ.gif';
import ZProbe from './assets/Block-Z.gif';

const ProbeImage = ({ probeCommand, visible = true }) => {
    const getProbeImage = () => {
        const { id } = probeCommand;
        if (id === 'X Touch') {
            return XProbe;
        } else if (id === 'Y Touch') {
            return YProbe;
        } else if (id === 'XY Touch') {
            return XYProbe;
        } else if (id === 'Z Touch') {
            return ZProbe;
        }
        return XYZProbe;
    };
    const imgSrc = getProbeImage();

    return (
        <div className={styles.imgWrap}>
            <Image src={imgSrc} className={cx({ [styles.imgHidden]: !visible })} />
        </div>
    );
};

export default ProbeImage;

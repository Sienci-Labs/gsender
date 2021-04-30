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

import React from 'react';
import cx from 'classnames';
import Image from 'app/components/Image';
import styles from './index.styl';
import XProbe from './assets/x_probe.svg';
import YProbe from './assets/y_probe.svg';
import XYZProbe from './assets/xyz_probe.svg';

const ProbeImage = ({ probeCommand, visible = true }) => {
    const getProbeImage = () => {
        const { id } = probeCommand;
        if (id === 'X Touch') {
            return XProbe;
        } else if (id === 'Y Touch') {
            return YProbe;
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

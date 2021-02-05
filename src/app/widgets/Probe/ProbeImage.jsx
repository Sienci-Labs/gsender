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

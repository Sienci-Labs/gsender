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
import {
    TOUCHPLATE_TYPE_STANDARD,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_ZERO,
    TOUCHPLATE_TYPE_3D_TOUCH,
} from 'app/lib/constants';
import XProbe from './assets/Block-X.gif';
import YProbe from './assets/Block-Y.gif';
import XYProbe from './assets/Block-XY.gif';
import XYZProbe from './assets/Block-XYZ.gif';
import ZProbe from './assets/Block-Z.gif';
import ZOnlyProbe from './assets/Probe-Z.gif';
import AutoZProbe from './assets/AutoZero-Z.gif';
import AutoXYZProbe from './assets/AutoZero-Rem.gif';
import TouchProbeImage from './assets/3D-Touch-Probe.svg';
// 3D Touch Probe specific images
import TouchProbeX from './assets/3D-Touch-X.png';
import TouchProbeY from './assets/3D-Touch-Y.png';
import TouchProbeZ from './assets/3D-Touch-Z.png';
import TouchProbeXY from './assets/3D-Touch-XY.png';
import TouchProbeXYZ from './assets/3D-Touch-XYZ.png';
import TouchProbeCenterIn from './assets/3D-Touch-Center-In.png';
import TouchProbeCenterOut from './assets/3D-Touch-Center-Out.png';
import { ProbeCommand, TOUCHPLATE_TYPES_T, CenterProbeParameters } from './definitions';

interface Props {
    probeCommand: ProbeCommand;
    touchplateType: TOUCHPLATE_TYPES_T;
    centerProbeParams?: CenterProbeParameters;
}

const ProbeImage: React.FC<Props> = ({
    probeCommand,
    touchplateType = TOUCHPLATE_TYPE_STANDARD,
    centerProbeParams,
}) => {
    const getProbeImage = () => {
        const { id } = probeCommand;
        if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
            if (id === 'Z Touch') {
                return AutoZProbe;
            }
            return AutoXYZProbe;
        }
        if (touchplateType === TOUCHPLATE_TYPE_ZERO) {
            return ZOnlyProbe;
        }
        if (touchplateType === TOUCHPLATE_TYPE_3D_TOUCH) {
            // Use specific 3D Touch probe images based on the probe command
            if (id === 'X Touch') {
                return TouchProbeX;
            } else if (id === 'Y Touch') {
                return TouchProbeY;
            } else if (id === 'Z Touch') {
                return TouchProbeZ;
            } else if (id === 'XY Touch') {
                return TouchProbeXY;
            } else if (id === 'XYZ Touch') {
                return TouchProbeXYZ;
            } else if (id === 'Center') {
                return centerProbeParams?.probeLocation === 'outer' 
                    ? TouchProbeZ 
                    : TouchProbeCenterIn;
            }
            // Fallback to XYZ image for any other 3D Touch probe commands
            return TouchProbeXYZ;
        }
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
        <div className="flex items-center justify-center">
            <img
                alt="Probe Block orientation guide image"
                src={imgSrc}
                className={
                    touchplateType === TOUCHPLATE_TYPE_3D_TOUCH
                        ? "w-[20vh] my-0 mx-auto portrait:w-[15vh]"
                        : "w-[15vh] my-0 mx-auto dark:invert portrait:w-[10vh]"
                }
            />
        </div>
    );
};

export default ProbeImage;

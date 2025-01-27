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

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import i18n from 'app/lib/i18n';

import styles from './index.module.styl';

/**
 * CameraDisplay component used to allow changing of camera angles
 * @param {Function} props.camera => Function to change camera angle
 */

class CameraDisplay extends PureComponent {
    static propTypes = {
        camera: PropTypes.object,
        cameraPosition: PropTypes.string,
    };

    render = () => {
        let { camera, cameraPosition } = this.props;
        return (
            <div className={styles.container}>
                <h3 className={styles.viewTitle}>{cameraPosition}</h3>
                <div className={styles.buttonContainer}>
                    <button
                        title={i18n._('Top')}
                        type="button"
                        tabIndex={0}
                        className={
                            cameraPosition === 'Top'
                                ? `${styles.faceTopActive}`
                                : `${styles.faceTop}`
                        }
                        onClick={(event) => {
                            camera.toTopView();
                        }}
                    />
                    <button
                        title={i18n._('Left')}
                        type="button"
                        tabIndex={0}
                        className={
                            cameraPosition === 'Left'
                                ? `${styles.faceLeftActive}`
                                : `${styles.faceLeft}`
                        }
                        onClick={(event) => {
                            camera.toLeftSideView();
                        }}
                    />
                    <button
                        title={i18n._('Front')}
                        type="button"
                        tabIndex={0}
                        className={
                            cameraPosition === 'Front'
                                ? `${styles.faceFrontActive}`
                                : `${styles.faceFront}`
                        }
                        onClick={(event) => {
                            camera.toFrontView();
                        }}
                    />
                    <button
                        title={i18n._('3D')}
                        type="button"
                        tabIndex={0}
                        className={
                            cameraPosition === '3D'
                                ? `${styles.faceIsoActive}`
                                : `${styles.faceIso}`
                        }
                        onClick={(event) => {
                            camera.to3DView();
                        }}
                    />
                    <button
                        type="button"
                        tabIndex={0}
                        className={styles.cornerC1}
                    />
                    <button
                        type="button"
                        tabIndex={0}
                        className={styles.cornerC2}
                    />
                    <button
                        title={i18n._('Right')}
                        type="button"
                        tabIndex={0}
                        className={
                            cameraPosition === 'Right'
                                ? `${styles.cornerC2Active}`
                                : `${styles.cornerC2}`
                        }
                        onClick={(event) => {
                            camera.toRightSideView();
                        }}
                    />

                    <button
                        type="button"
                        tabIndex={0}
                        className={styles.cornerC3}
                    />
                </div>
            </div>
        );
    };
}
export default CameraDisplay;

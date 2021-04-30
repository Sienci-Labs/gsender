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

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import i18n from 'app/lib/i18n';

import styles from './index.styl';

/**
 * CameraDisplay component used to allow changing of camera angles
 * @param {Function} props.camera => Function to change camera angle
 */


class CameraDisplay extends PureComponent {
    static propTypes = {
        camera: PropTypes.object,
        cameraPosition: PropTypes.string
    };

    state = this.getInitialState();

    getInitialState() {
        return {
            activeButton: '3D'
        };
    }

    handleClick = (event) => {
        let title = event.target.title;
        this.setState({
            activeButton: title
        });
    }

    render = () => {
        let { camera } = this.props;
        let activeButton = this.state.activeButton;
        return (
            <div className={styles.container}>
                <h3 className={styles.viewTitle}>{activeButton}</h3>
                <div className={styles.buttonContainer}>
                    <button
                        title={i18n._('Top')}
                        type="button"
                        tabIndex={0}
                        className={activeButton === 'Top' ? `${styles.faceTopActive}` : `${styles.faceTop}`}
                        onClick={(event) => {
                            camera.toTopView();
                            this.handleClick(event);
                        }
                        }
                    />
                    <button
                        title={i18n._('Right')}
                        type="button"
                        tabIndex={0}
                        className={activeButton === 'Right' ? `${styles.faceRightActive}` : `${styles.faceRight}`}
                        onClick={(event) => {
                            camera.toRightSideView();
                            this.handleClick(event);
                        }
                        }
                    />
                    <button
                        title={i18n._('Front')}
                        type="button"
                        tabIndex={0}
                        className={activeButton === 'Front' ? `${styles.faceFrontActive}` : `${styles.faceFront}`}
                        onClick={(event) => {
                            camera.toFrontView();
                            this.handleClick(event);
                        }
                        }
                    />
                    <button
                        title={i18n._('3D')}
                        type="button"
                        tabIndex={0}
                        className={activeButton === '3D' ? `${styles.faceIsoActive}` : `${styles.faceIso}`}
                        onClick={(event) => {
                            camera.to3DView();
                            this.handleClick(event);
                        }
                        }
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
                        title={i18n._('Left')}
                        type="button"
                        tabIndex={0}
                        className={activeButton === 'Left' ? `${styles.cornerC2Active}` : `${styles.cornerC2}`}
                        onClick={(event) => {
                            camera.toLeftSideView();
                            this.handleClick(event);
                        }
                        }
                    />

                    <button
                        type="button"
                        tabIndex={0}
                        className={styles.cornerC3}
                    />
                </div>
            </div>
        );
    }
}
export default CameraDisplay;

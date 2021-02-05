import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import controller from 'app/lib/controller';
// import { Tooltip } from 'app/components/Tooltip';

import leftSideIcon from './images/camera-left-side-view-light.png';
import rightSideIcon from './images/camera-right-side-view-light.png';
import topSideIcon from './images/camera-top-view-light.png';
import frontSideIcon from './images/camera-front-view-light.png';
import threeDIcon from './images/camera-3d-view-light.png';

import styles from './camera-control-area.styl';
import CameraItem from './CameraItem';

/**
 * Control Area component displaying camera toggles and uploaded file details
 * @param {Object} state Default state given from parent component
 * @param {Object} actions Actions object given from parent component
 */
export default class ControlArea extends Component {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
    }

    state = {
        currentAlarmIcon: 'fa-lock'
    }

    unlock = () => {
        controller.command('unlock');
    }

    render() {
        const { cameraPosition, controller, port, total } = this.props.state;
        const { name } = this.props.state.gcode;
        const { camera } = this.props.actions;
        const { currentAlarmIcon } = this.state;

        const { state = {} } = controller;

        //Object to customize the message of the active machine state
        const message = {
            Idle: 'Idle',
            Run: 'Running',
            Hold: 'Hold',
            Jog: 'Jogging',
            Check: 'Check',
            Home: 'Homing',
            Sleep: 'Sleep',
            Alarm: 'Alarm',
            Disconnected: 'Disconnected',
        };

        /**
         * Function to output the machine state based on multiple conditions
         */
        const machineStateRender = () => {
            if (port) {
                if (state.status?.activeState === 'Alarm') {
                    return (
                        <div className={styles['machine-status-wrapper']}>
                            <div className={styles['machine-Alarm']}>
                                {state.status.activeState} ({state.status.alarmCode}){' '}
                            </div>

                            <i
                                onMouseEnter={() => this.setState({ currentAlarmIcon: 'fa-unlock' })}
                                onMouseLeave={() => this.setState({ currentAlarmIcon: 'fa-lock' })}
                                className={classnames('fas', currentAlarmIcon, styles['machine-status-unlock'])}
                                role="button"
                                tabIndex={-1}
                                onClick={this.unlock}
                                onKeyDown={this.unlock}
                            />

                            <div style={{ color: 'white', textAlign: 'center', fontSize: 'clamp(1rem, 1vw, 1.5rem)' }}>
                                <i className="fas fa-long-arrow-alt-up" style={{ fontSize: 'clamp(1.5rem, 2vw, 2.5rem)' }} />
                                <div>Click to Unlock Machine</div>
                            </div>
                        </div>
                    );
                } else {
                    return state.status?.activeState //Show disconnected until machine connection process is finished, otherwise an empty div is shown
                        ? (
                            <div className={styles[`machine-${state.status.activeState}`]}>
                                { message[state.status.activeState] }
                            </div>
                        )
                        : <div className={styles['machine-Disconnected']}>Disconnected</div>;
                }
            } else {
                return <div className={styles['machine-Disconnected']}>Disconnected</div>;
            }
        };

        //Array of objects containing the images, functions and tooltip settings for the CameraItem components being rendered from to be outputted
        const cameraItems = [
            { id: 0, img: rightSideIcon, cameraSide: camera.toRightSideView, tooltip: { text: 'Right Side View', placement: 'top' }, active: cameraPosition === 'right' },
            { id: 1, img: leftSideIcon, cameraSide: camera.toLeftSideView, tooltip: { text: 'Left Side View', placement: 'top' }, active: cameraPosition === 'left' },
            { id: 2, img: frontSideIcon, cameraSide: camera.toFrontView, tooltip: { text: 'Front View', placement: 'right' }, active: cameraPosition === 'front' },
            { id: 3, img: topSideIcon, cameraSide: camera.toTopView, tooltip: { text: 'Top View', placement: 'bottom' }, active: cameraPosition === 'top' },
            { id: 4, img: threeDIcon, cameraSide: camera.to3DView, tooltip: { text: '3D View', placement: 'bottom' }, active: cameraPosition === '3d' },
        ];


        return (
            <div className={styles['control-area']}>
                <div className={styles['camera-control']}>
                    {
                        cameraItems.map(item => (
                            <CameraItem
                                key={item.id}
                                image={item.img}
                                changeCamera={item.cameraSide}
                                tooltip={item.tooltip}
                                active={item.active}
                            />
                        ))
                    }
                </div>

                {machineStateRender()}

                <div className={styles['machine-info']}>
                    { name && <p><strong>{name}</strong></p> }
                    { total !== 0 && <p>{`${total} lines`}</p> }
                </div>
            </div>
        );
    }
}

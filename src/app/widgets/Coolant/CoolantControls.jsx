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

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import reduxStore from 'app/store/redux';
import get from 'lodash/get';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import controller from 'app/lib/controller';
import combokeys from 'app/lib/combokeys';
import gamepad, { runAction } from 'app/lib/gamepad';
import { GRBL_ACTIVE_STATE_IDLE, COOLANT_CATEGORY } from 'app/constants';
import styles from './index.styl';
import useKeybinding from '../../lib/useKeybinding';


const sendM7 = () => {
    controller.command('gcode', 'M7');
};
const sendM8 = () => {
    controller.command('gcode', 'M8');
};
const sendM9 = () => {
    controller.command('gcode', 'M9');
};

const shuttleControlFunctions = {
    MIST_COOLANT: () => {
        const isConnected = get(reduxStore.getState(), 'connection.isConnected');
        const activeState = get(reduxStore.getState(), 'controller.state.status.activeState');
        const canClick = isConnected && activeState === GRBL_ACTIVE_STATE_IDLE;
        if (canClick) {
            sendM7();
        }
    },
    FLOOD_COOLANT: () => {
        const isConnected = get(reduxStore.getState(), 'connection.isConnected');
        const activeState = get(reduxStore.getState(), 'controller.state.status.activeState');
        const canClick = isConnected && activeState === GRBL_ACTIVE_STATE_IDLE;
        if (canClick) {
            sendM8();
        }
    },
    STOP_COOLANT: () => {
        const isConnected = get(reduxStore.getState(), 'connection.isConnected');
        const activeState = get(reduxStore.getState(), 'controller.state.status.activeState');
        const canClick = isConnected && activeState === GRBL_ACTIVE_STATE_IDLE;
        if (canClick) {
            sendM9();
        }
    }
};
const shuttleControlEvents = {
    MIST_COOLANT: {
        id: 71,
        title: 'Mist Coolant',
        keys: '',
        cmd: 'MIST_COOLANT',
        preventDefault: false,
        isActive: true,
        category: COOLANT_CATEGORY,
        callback: shuttleControlFunctions.MIST_COOLANT
    },
    FLOOD_COOLANT: {
        id: 72,
        title: 'Flood Coolant',
        keys: '',
        cmd: 'FLOOD_COOLANT',
        preventDefault: false,
        isActive: true,
        category: COOLANT_CATEGORY,
        callback: shuttleControlFunctions.FLOOD_COOLANT
    },
    STOP_COOLANT: {
        id: 73,
        title: 'Stop Coolant',
        keys: '',
        cmd: 'STOP_COOLANT',
        preventDefault: false,
        isActive: true,
        category: COOLANT_CATEGORY,
        callback: shuttleControlFunctions.STOP_COOLANT
    }
};

const subscribeShuttleControl = () => {
    combokeys.reload();

    Object.keys(shuttleControlEvents).forEach(eventName => {
        const callback = shuttleControlEvents[eventName].callback;
        combokeys.on(eventName, callback);
    });

    gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: shuttleControlEvents }));
};

const unsubscribeShuttleControl = () => {
    Object.keys(shuttleControlEvents).forEach(eventName => {
        const callback = shuttleControlEvents[eventName].callback;
        combokeys.removeListener(eventName, callback);
    });
};

const CoolantControls = ({ canClick }) => {
    useEffect(() => {
        subscribeShuttleControl();
        useKeybinding(shuttleControlEvents);
        return function cleanup() {
            unsubscribeShuttleControl();
        };
    }, []);
    return (
        <div className={styles.flexRow}>
            <FunctionButton onClick={sendM7} disabled={!canClick}>
                <i className="fa fa-shower" />
                Mist (M7)
            </FunctionButton>
            <FunctionButton onClick={sendM8} disabled={!canClick}>
                <i className="fa fa-water" />
                Flood (M8)
            </FunctionButton>
            <FunctionButton onClick={sendM9} disabled={!canClick}>
                <i className="fa fa-ban" />
                Off (M9)
            </FunctionButton>
        </div>
    );
};

export default connect((store) => {
    const isConnected = get(store, 'connection.isConnected');
    const activeState = get(store, 'controller.state.status.activeState');
    const canClick = isConnected && activeState === GRBL_ACTIVE_STATE_IDLE;
    return {
        canClick
    };
})(CoolantControls);

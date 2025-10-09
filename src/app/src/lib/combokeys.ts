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

import events from 'events';
import Mousetrap from 'mousetrap';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import reduxStore from '../store/redux';
import api from '../api';
import { MACRO_CATEGORY } from '../constants';
import log from './log';
import { preventDefault } from './dom-events';
import { modifierKeys } from './constants';
import store from '../store';
import shuttleEvents from '../lib/shuttleEvents';
import {
    CommandKey,
    CommandKeys,
    Macro,
    Shortcut,
    ShuttleEvent,
} from './definitions/shortcuts';

const STOP_CMD = 'STOP_CONT_JOG';
const MACRO = 'MACRO';

const BUGGED_KEYS = [
    {
        id: 0,
        code: 'NumpadAdd',
        key: '+',
    },
    {
        id: 1,
        code: 'NumpadMultiply',
        key: '*',
    },
];

/**
 * Function to handle bugged keys not firing on keyups in mousetrap,
 * if these keys are attached to a Jog command, it is important that they have
 * keyups to prevent the machine from jogging non-stop
 */
const buggedKeysHandler = (e: KeyboardEvent) => {
    for (const item of BUGGED_KEYS) {
        if (item.code === e.code) {
            combokeys.emit(STOP_CMD, e, null);
        }
    }
};

class Combokeys extends events.EventEmitter {
    state = {
        didBindEvents: false,
    };

    list: Shortcut[] = [];

    async bind(): Promise<void> {
        if (this.state.didBindEvents) {
            return;
        }
        const commandKeys: CommandKeys = await this.getCommandKeys();

        const shouldHold = get(
            reduxStore.getState(),
            'preferences.shortcuts.shouldHold',
            false,
        );

        Object.entries(commandKeys).forEach(([key, o]) => {
            const { keys, isActive } = o as CommandKey;
            const {
                cmd,
                payload = null,
                category,
                preventDefault: preventDefaultBool,
            } = (shuttleEvents.allShuttleControlEvents[key] as ShuttleEvent) ??
            (o as CommandKey); // if macro, won't have shuttleEvents to pull defaults from

            //Do not add any keybindings if the shortcut is disabled or there is no shortcut at all
            if (!isActive || !keys || shouldHold) {
                return;
            }

            const callback = (event: Event) => {
                log.debug(
                    `combokeys: keys=${keys} cmd=${cmd} payload=${JSON.stringify(payload)}`,
                );
                if (!!preventDefaultBool) {
                    preventDefault(event);
                }
                if (category === MACRO_CATEGORY) {
                    this.emit(MACRO, event, payload);
                } else {
                    this.emit(cmd, event, payload);
                }
            };

            const jogCmds = [
                'JOG_X_P',
                'JOG_X_M',
                'JOG_Y_P',
                'JOG_Y_M',
                'JOG_Z_P',
                'JOG_Z_M',
                'JOG_X_P_Y_M',
                'JOG_X_M_Y_P',
                'JOG_X_Y_P',
                'JOG_X_Y_M',
                'JOG_A_PLUS',
                'JOG_A_MINUS',
            ];
            //Add keyup listeners for jogging events
            if (jogCmds.includes(cmd)) {
                const callback = (event: Event) => {
                    log.debug(
                        `combokeys: keys=${keys} cmd=${STOP_CMD} payload=${JSON.stringify(payload)}`,
                    );
                    if (!!preventDefaultBool) {
                        preventDefault(event);
                    }
                    this.emit(STOP_CMD, event, payload);
                };

                const modiferKeyCB = (e: Event) => {
                    if (!!preventDefaultBool) {
                        preventDefault(e);
                    }

                    this.emit(STOP_CMD, e, null);
                };

                //Listen for keyups on individual keys, for example,
                //if jogging is shift+arrowup and the user lets go of one key and not the other,
                //this should trigger STOP_JOG
                if (keys.includes('+')) {
                    const keysArr = keys.split('+');
                    for (const key of keysArr) {
                        if (modifierKeys.includes(key?.toLowerCase())) {
                            Mousetrap.bind(key, modiferKeyCB, 'keyup');
                        } else {
                            Mousetrap.bind(key, callback, 'keyup');
                        }
                    }
                }

                for (const item of BUGGED_KEYS) {
                    if (keys.includes(item.key)) {
                        document.addEventListener('keyup', buggedKeysHandler);
                    }
                }

                Mousetrap.bind(keys, callback, 'keyup');
            }

            Mousetrap.bind(keys, callback);
            this.list.push({ keys: keys, callback: callback });
        });

        this.state.didBindEvents = true;
    }

    async getCommandKeys(): Promise<CommandKeys> {
        const setCommandKeys: CommandKeys = store.get('commandKeys', {});
        const setMacrosBinds = Object.entries(setCommandKeys).filter(
            ([_key, command]) =>
                (command as CommandKey).category === MACRO_CATEGORY,
        );

        const res = await api.macros.fetch();
        const macros = res.data.records;

        const newCommandKeysList: CommandKeys = cloneDeep(setCommandKeys);

        // get callback for macros
        const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;
        const macroCallback = allShuttleControlEvents[MACRO]! as Function;

        macros.forEach((macro: Macro) => {
            const existingBind = setMacrosBinds.find(
                ([key, _bind]) => key === macro.id,
            );
            if (!existingBind) {
                newCommandKeysList[macro.id] = {
                    keys: '',
                    title: macro.name,
                    cmd: macro.id,
                    payload: { macroID: macro.id },
                    preventDefault: false,
                    isActive: false,
                    category: MACRO_CATEGORY,
                    callback: macroCallback,
                };
            }
        });
        store.replace('commandKeys', newCommandKeysList);

        return newCommandKeysList;
    }

    unbind(): void {
        if (!this.state.didBindEvents) {
            return;
        }
        this.list.forEach((o) => {
            const { keys } = o;
            Mousetrap.unbind(keys);
        });
        this.state.didBindEvents = false;
    }

    reload(): void {
        this.reset();
        this.list = [];

        document.removeEventListener('keyup', buggedKeysHandler);

        this.bind();
    }

    reset(): void {
        Mousetrap.reset();
        this.state.didBindEvents = false;
    }
}

const combokeys = new Combokeys({
    /*autoBind: true*/
});

export default combokeys;

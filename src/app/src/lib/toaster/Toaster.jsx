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
import pubsub from 'pubsub-js';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import uuid from 'uuid';
import styles from './toaster.styl';
import Toast from './Toast';
import { TOASTER_DEFAULT, TOASTER_UNTIL_CLOSE } from './ToasterLib';

class Toaster extends PureComponent {
    pubsubTokens = [];

    constructor(props) {
        super(props);
        this.state = {
            activeToasts: [],
        };
    }

    createNewToast({ duration = TOASTER_DEFAULT, ...options }) {
        const state = { ...this.state };
        const activeToasts = [...state.activeToasts];
        const toastId = uuid();
        const closeHandler = () => {
            pubsub.publish('toast:remove', toastId);
        };
        activeToasts.push({
            id: toastId,
            createdAt: Date.now(),
            duration: duration,
            closeHandler: closeHandler,
            ...options,
        });
        // Handle self-expiring
        if (duration !== TOASTER_UNTIL_CLOSE) {
            setTimeout(() => {
                this.removeToast(toastId);
            }, duration);
        }
        this.setState({
            activeToasts: activeToasts,
        });
    }

    removeToast(id) {
        const state = { ...this.state };
        const activeToasts = [...state.activeToasts];
        let filteredToasts = activeToasts.filter((toast) => toast.id !== id);
        this.setState({
            activeToasts: filteredToasts,
        });
    }

    removeAll() {
        this.setState({ activeToasts: [] });
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('toast:new', (msg, options) => {
                this.createNewToast(options);
            }),
            pubsub.subscribe('toast:remove', (msg, id) => {
                this.removeToast(id);
            }),
            pubsub.subscribe('toast:clear', (msg) => {
                this.removeAll();
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    componentDidMount() {
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const { activeToasts } = this.state;
        return (
            <div className={styles.toasterContainer}>
                <TransitionGroup>
                    {activeToasts.map((toast) => (
                        <CSSTransition
                            key={toast.id}
                            timeout={150}
                            classNames={{
                                enterActive: styles.toastAppearEnterActive,
                                enterDone: styles.toastAppearEnterDone,
                                exitActive: styles.toastAppearExitActive,
                                exitDone: styles.toastAppearExitDone,
                            }}
                        >
                            <Toast {...toast} />
                        </CSSTransition>
                    ))}
                </TransitionGroup>
            </div>
        );
    }
}

export default Toaster;

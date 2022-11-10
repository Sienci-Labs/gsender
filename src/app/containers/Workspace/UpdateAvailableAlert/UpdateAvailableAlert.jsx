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
import cx from 'classnames';
import pubsub from 'pubsub-js';
import styles from './index.styl';
import { getOperatingSystem } from '../util';

class UpdateAvailableAlert extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            shown: false,
            buttonActive: true,
        };
    }

    actions = {
        hideModal: () => {
            this.setState({
                shown: false
            });
        },
    }

    pubsubTokens = [];

    subscribe () {
        const tokens = [
            pubsub.subscribe('showUpdateToast', (msg, info) => {
                this.setState({
                    shown: true
                });
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe () {
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
        const { shown, buttonActive } = this.state;
        const { restartHandler } = this.props;
        const actions = { ...this.actions };
        const currentOS = getOperatingSystem(window);

        let updateLink = 'https://github.com/Sienci-Labs/gsender/releases/latest';

        return (
            <div className={cx(styles.updateWrapper, { [styles.hideModal]: !shown })}>
                <div className={styles.updateIcon}>
                    <i className="fas fa-download" />
                </div>
                <div className={styles.updateContent}>
                    <div>
                        { currentOS === 'Windows OS' ? 'Update available to download. Download and restart now?' : 'A new version of gSender is available.'}
                    </div>
                    { currentOS === 'Windows OS' ? (
                        <button
                            onClick={() => {
                                this.setState({
                                    buttonActive: false
                                });
                                restartHandler();
                            }}
                            className={styles.restartButton}
                        >
                            {
                                buttonActive ? 'Download and install' : 'Downloading...'
                            }
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                this.setState({
                                    buttonActive: false
                                });
                                window.open(updateLink, '_blank');
                            }}
                            className={styles.restartButton}
                        > {
                                buttonActive ? 'Checkout the latest release' : 'Redirecting...'
                            }
                        </button>
                    )}
                </div>
                <div className={styles.closeModal}>
                    <button onClick={actions.hideModal}>
                        <i className="fas fa-times" />
                    </button>
                </div>

            </div>
        );
    }
}

export default UpdateAvailableAlert;

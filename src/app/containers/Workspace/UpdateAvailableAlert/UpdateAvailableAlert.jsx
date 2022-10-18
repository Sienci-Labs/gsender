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
import OS from '../util';
import api from '../../../api';


class UpdateAvailableAlert extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            shown: false,
            buttonActive: true,
            updateLink: '',
            allOSUpdates: [],
        };
    }

    actions = {
        hideModal: () => {
            this.setState({
                shown: false
            });
        },
        getAllUpdates: async () => {
            await api.getLatestVersionAllOS();
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
        this.setState({
            allOSUpdates: this.actions.getAllUpdates()
        });
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const { shown, buttonActive, allOSUpdates } = this.state;
        const { restartHandler } = this.props;
        const actions = { ...this.actions };

        const handleUpdateClick = () => {
            if (OS === 'Windows OS') {
                this.setState({
                    buttonActive: false
                });
                restartHandler();
            } else if (OS === 'MacOS') {
                this.setState({
                    updateLink: () => {
                        return allOSUpdates.map((update) => {
                            if (update.name.includes('.dmg')) {
                                return update.browser_download_url;
                            }
                            return '';
                        });
                    }
                });
            } else if (OS === 'Linux OS') { //TODO - verify correct OS value for Raspberry Pi
                this.setState({
                    updateLink: () => {
                        return allOSUpdates.map((update) => {
                            if (update.name.includes('armv7l.AppImage')) {
                                return update.browser_download_url;
                            }
                            return '';
                        });
                    }
                });
            }
        };

        return (
            <div className={cx(styles.updateWrapper, { [styles.hideModal]: !shown })}>
                <div className={styles.updateIcon}>
                    <i className="fas fa-download" />
                </div>
                <div className={styles.updateContent}>
                    <div>
                        Update available to download.  Download and restart now?
                    </div>
                    {OS === 'Windows OS' ? (
                        <button
                            onClick={handleUpdateClick}
                            className={styles.restartButton}
                        >
                            {
                                buttonActive ? 'Download and install' : 'Downloading...'
                            }
                        </button>
                    )
                        : (<a href={this.state.updateLink}> Download and install </a>)
                    }
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

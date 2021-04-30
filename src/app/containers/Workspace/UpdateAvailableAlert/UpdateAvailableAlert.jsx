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
import cx from 'classnames';
import pubsub from 'pubsub-js';
import styles from './index.styl';


class UpdateAvailableAlert extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            shown: false
        };
    }

    actions = {
        hideModal: () => {
            this.setState({
                shown: false
            });
        }
    }

    pubsubTokens = [];


    subscribe () {
        const tokens = [
            pubsub.subscribe('showUpdateToast', (msg) => {
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
        const { shown } = this.state;
        const { restartHandler } = this.props;
        const actions = { ...this.actions };
        return (
            <div className={cx(styles.updateWrapper, { [styles.hideModal]: !shown })}>
                <div className={styles.updateIcon}>
                    <i className="fas fa-download" />
                </div>
                <div className={styles.updateContent}>
                    <div>
                        Update downloaded and available to install.  Restart now?
                    </div>
                    <button onClick={() => restartHandler()} className={styles.restartButton}>
                        Restart and Install
                    </button>
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

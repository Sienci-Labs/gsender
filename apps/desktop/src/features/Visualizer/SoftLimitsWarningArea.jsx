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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import get from 'lodash/get';
import pubsub from 'pubsub-js';

/**
 * Control Area component displaying Soft Limits Warning
 * @param {Object} state Default state given from parent component
 * @param {Object} actions Actions object given from parent component
 */
class ControlArea extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showWarning: false,
            $20: 0,
        };
    }

    pubsubTokens = [];

    componentDidMount() {
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('softlimits:warning', (msg) => {
                this.setState(() => {
                    return { showWarning: true };
                });
            }),
            pubsub.subscribe('softlimits:ok', () => {
                this.setState(() => {
                    return { showWarning: false };
                });
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

    render() {
        const { softLimitsEnabled } = this.props;
        return (
            <div>
                {this.state.showWarning && softLimitsEnabled ? (
                    <div>Warning: Cut will leave soft limits!</div>
                ) : (
                    <div />
                )}
            </div>
        );
    }
}

export default connect((store) => {
    const softLimitsEnabled =
        get(store, 'controller.settings.settings.$20') === '1';
    return {
        softLimitsEnabled,
    };
})(ControlArea);

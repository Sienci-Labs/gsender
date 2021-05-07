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

class Blink extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,

        // Half-period in milliseconds used for blinking. The default blink rate is 530ms. By setting this to zero, blinking can be disabled.
        rate: PropTypes.number
    };

    static defaultProps = {
        rate: 530
    };

    state = {
        visible: true
    };

    blinkTimer = null;

    blink = () => {
        if (this.blinkTimer) {
            clearInterval(this.blinkTimer);
            this.blinkTimer = null;
        }

        if (this.props.rate > 0) {
            this.blinkTimer = setInterval(() => {
                this.setState(state => ({
                    visible: !state.visible
                }));
            }, this.props.rate);
        } else {
            this.setState(state => ({
                visible: true
            }));
        }
    };

    componentDidMount() {
        this.blink();
    }

    componentDidUpdate() {
        this.blink();
    }

    componentWillUnmount() {
        if (this.blinkTimer) {
            clearInterval(this.blinkTimer);
            this.blinkTimer = null;
        }
    }

    render() {
        const {
            rate, // eslint-disable-line no-unused-vars
            ...props
        } = this.props;

        props.style = {
            ...props.style,
            visibility: this.state.visible ? 'visible' : 'hidden'
        };

        return (
            <span {...props} />
        );
    }
}

export default Blink;

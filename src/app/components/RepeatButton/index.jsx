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

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

class RepeatButton extends PureComponent {
    static propTypes = {
        delay: PropTypes.number,
        throttle: PropTypes.number,
        onClick: PropTypes.func,
        children: PropTypes.node
    };

    actions = {
        handleHoldDown: () => {
            const delay = Number(this.props.delay) || 500;
            const throttle = Number(this.props.throttle) || 50;

            this.timeout = setTimeout(() => {
                this.actions.handleRelease();

                this.interval = setInterval(() => {
                    if (this.interval) {
                        this.props.onClick();
                    }
                }, throttle);
            }, delay);
        },
        handleRelease: () => {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }
    };

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        this.timeout = null;
        this.interval = null;
    }

    componentWillUnmount() {
        this.actions.handleRelease();
    }

    render() {
        const props = { ...this.props };

        delete props.delay;
        delete props.throttle;

        return (
            <button
                type="button"
                {...props}
                onMouseDown={this.actions.handleHoldDown}
                onMouseUp={this.actions.handleRelease}
                onMouseLeave={this.actions.handleRelease}
            />
        );
    }
}

export default RepeatButton;

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

import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class Input extends Component {
    static propTypes = {
        componentClass: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.string
        ]),
        innerRef: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.object,
            PropTypes.string
        ]),
        type: PropTypes.string
    };

    static defaultProps = {
        componentClass: 'input',
        type: 'text'
    };

    get value() {
        if (!this.ref) {
            return null;
        }

        const node = ReactDOM.findDOMNode(this.ref);

        return node ? node.value : null;
    }

    getRef = (ref) => {
        if (typeof this.props.innerRef === 'function') {
            this.props.innerRef(ref);
        }
        this.ref = ref;
    };

    focus = () => {
        if (this.ref) {
            this.ref.focus();
        }
    };

    render() {
        const {
            componentClass: Component,
            innerRef,
            className,
            ...props
        } = this.props;

        return (
            <Component {...props} ref={innerRef} className={cx(className, 'form-control')} />
        );
    }
}

export default Input;

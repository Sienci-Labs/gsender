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
import React, { Component } from 'react';

class Form extends Component {
    static propTypes = {
        componentClass: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.string
        ]),
        innerRef: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.object,
            PropTypes.string
        ])
    };

    static defaultProps = {
        componentClass: 'form',
    };

    getRef = (ref) => {
        if (typeof this.props.innerRef === 'function') {
            this.props.innerRef(ref);
        }
        this.ref = ref;
    };

    submit = () => {
        if (this.ref) {
            this.ref.submit();
        }
    };

    render() {
        const {
            componentClass: Component,
            innerRef,
            ...props
        } = this.props;

        return (
            <Component {...props} ref={innerRef} />
        );
    }
}

export default Form;

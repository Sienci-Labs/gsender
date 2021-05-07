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

import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

class OverflowTooltip extends React.Component {
    static propTypes = {
        title: PropTypes.string
    };

    state = {
        overflow: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        return {
            overflow: false
        };
    }

    detectOverflow = () => {
        const el = ReactDOM.findDOMNode(this);
        const overflow = (el.clientWidth < el.scrollWidth);
        if (overflow !== this.state.overflow) {
            this.setState({ overflow: overflow });
        }
    };

    componentDidMount() {
        this.detectOverflow();
    }

    componentDidUpdate() {
        this.detectOverflow();
    }

    render() {
        const { title, ...props } = this.props;

        if (this.state.overflow) {
            props.title = title;
        }

        return (
            <div {...props} />
        );
    }
}

export default OverflowTooltip;

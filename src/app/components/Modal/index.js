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

import '@trendmicro/react-modal/dist/react-modal.css';
import Modal from '@trendmicro/react-modal';
import chainedFunction from 'chained-function';
import React, { PureComponent } from 'react';

class ModalWrapper extends PureComponent {
    static propTypes = {
        ...Modal.propTypes
    };

    static defaultProps = {
        ...Modal.defaultProps
    };

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.show !== this.props.show) {
            if (nextProps.show) {
                this.blockScrolling();
            } else {
                this.unblockScrolling();
            }
        }
    }

    componentDidMount() {
        this.blockScrolling();
    }

    componentWillUnmount() {
        this.unblockScrolling();
    }

    blockScrolling() {
        const body = document.querySelector('body');
        body.style.overflowY = 'hidden';
    }

    unblockScrolling() {
        const body = document.querySelector('body');
        body.style.overflowY = 'auto';
    }

    render() {
        const { onClose, ...props } = this.props;

        return (
            <Modal
                {...props}
                style={{ borderRadius: '10px', overflow: 'hidden' }}
                onClose={chainedFunction(onClose, this.unblockScrolling)}
            />
        );
    }
}

ModalWrapper.Overlay = Modal.Overlay;
ModalWrapper.Content = Modal.Content;
ModalWrapper.Header = Modal.Header;
ModalWrapper.Title = Modal.Title;
ModalWrapper.Body = Modal.Body;
ModalWrapper.Footer = Modal.Footer;

export default ModalWrapper;

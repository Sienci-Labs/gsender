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

import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'app/components/Modal';
import { Button } from 'app/components/Buttons';

import { modalStyle, modalHeaderStyle, modalTitleStyle, modalBodyStyle, modalFooterStyle } from './modalStyle';

const ValidationModal = ({ onProceed, onCancel, invalidGcode }) => {
    const { list } = invalidGcode;

    return (
        <Modal
            size="xs"
            onClose={onProceed}
            style={modalStyle}
            disableOverlayClick
        >
            <Modal.Header style={modalHeaderStyle}>
                <Modal.Title style={modalTitleStyle}>
                    Invalid G-Code Warning
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={modalBodyStyle}>

                {
                    list?.size === 1
                        ? <p>There is <span style={{ fontWeight: 'bold' }}>1</span> invalid G-Code line in the file, your job may not run properly.</p>
                        : <p>There are <span style={{ fontWeight: 'bold' }}>{list?.size}</span> invalid G-Code lines in the file, your job may not run properly.</p>
                }

            </Modal.Body>
            <Modal.Footer style={modalFooterStyle}>
                <Button
                    onClick={onCancel}
                >
                    Cancel (Unload File)
                </Button>
                <Button
                    style={{ backgroundColor: '#3e85c7', color: 'white', backgroundImage: 'none' }}
                    onClick={onProceed}
                >
                    Proceed
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

ValidationModal.propTypes = {
    onProceed: PropTypes.func,
    onCancel: PropTypes.func,
    invalidGcode: PropTypes.object,
};

export default ValidationModal;

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

/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React from 'react';
import { CSSTransition } from 'react-transition-group';

import './modal.css';

const ToolsNotificationModal = (props) => {
    return (
        <CSSTransition
            in={props.show}
            unmountOnExit
            timeout={{ enter: 0, exit: 300 }}
        >
            <div className={`modalFirmware ${props.show ? 'show' : ''}`} onClick={props.onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="fas fa-exclamation-triangle" style={{ fontSize: '1.3rem', color: 'red', textAlign: 'center', marginLeft: '0.6rem' }} />
                        <h4 className="modal-title">{props.title}</h4>
                    </div>
                    <div className="modal-body">{props.children}</div>
                    <div className="modal-footer">
                        <h1 className="footer-text">{props.footer}</h1>
                        <h1 className="footer-textTwo">{props.footerTwo}</h1>
                        <div className="buttonContainer">
                            <button onClick={props.onClose} className="button-no">No</button>
                            <button className="button" onClick={props.yesFunction}>Yes</button>
                        </div>
                    </div>
                </div>
            </div>
        </CSSTransition>
    );
};

export default ToolsNotificationModal;

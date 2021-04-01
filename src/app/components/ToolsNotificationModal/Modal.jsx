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
                        <div className="fas fa-exclamation-triangle" style={{ fontSize: 55, color: 'red', textAlign: 'center', margin: 2 }} />
                        <h4 className="modal-title">{props.title}</h4>
                    </div>
                    <div className="modal-body">{props.children}</div>
                    <div className="modal-footer">
                        <h1 className="footer-text">{props.footer}</h1>
                        <h1 className="footer-textTwo">{props.footerTwo}</h1>
                        <div className="buttonContainer">
                            <button onClick={props.onClose} className="redButton">No</button>
                            <button className="button" onClick={props.yesFunction}>Yes</button>
                        </div>
                    </div>
                </div>
            </div>
        </CSSTransition>
    );
};

export default ToolsNotificationModal;

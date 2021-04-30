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

import chainedFunction from 'chained-function';
import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { Dropdown } from 'react-bootstrap';
import { Button } from 'app/components/Buttons';
import Modal from 'app/components/Modal';
import Space from 'app/components/Space';
import { Form, Input, Textarea } from 'app/components/Validation';
import i18n from 'app/lib/i18n';
import portal from 'app/lib/portal';
import * as validations from 'app/lib/validations';
import insertAtCaret from './insertAtCaret';
import variables from './variables';
import styles from './index.styl';

import { modalStyle, modalHeaderStyle, modalTitleStyle, modalBodyStyle, modalFooterStyle } from './modalStyle';

const MAX_CHARACTERS = '128';

class EditMacro extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    fields = {
        name: null,
        content: null
    };

    get value() {
        const {
            name,
            content
        } = this.form.getValues();

        return {
            name: name,
            content: content
        };
    }

    render() {
        const { state, actions } = this.props;
        const { id, name, content } = { ...state.modal.params };

        return (
            <Modal size="md" onClose={actions.closeModal} style={modalStyle}>
                <Modal.Header style={modalHeaderStyle}>
                    <Modal.Title style={modalTitleStyle}>
                        {i18n._('Edit Macro')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={modalBodyStyle}>
                    <Form
                        ref={c => {
                            this.form = c;
                        }}
                        onSubmit={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <div className="form-group">
                            <label>{i18n._('Macro Name')}</label>
                            <Input
                                ref={c => {
                                    this.fields.name = c;
                                }}
                                type="text"
                                maxLength={MAX_CHARACTERS}
                                className="form-control"
                                name="name"
                                value={name}
                                validations={[validations.required]}
                            />
                        </div>
                        <div className="form-group">
                            <div className={styles['macro-commands']}>
                                <label>{i18n._('Macro Commands')}</label>

                                <Dropdown
                                    id="add-macro-dropdown"
                                    className="pull-right"
                                    onSelect={(eventKey) => {
                                        const textarea = ReactDOM.findDOMNode(this.fields.content).querySelector('textarea');
                                        if (textarea) {
                                            insertAtCaret(textarea, eventKey);
                                        }

                                        actions.updateModalParams({
                                            content: textarea.value
                                        });
                                    }}
                                >
                                    <Dropdown.Toggle
                                        className={styles.btnLink}
                                        style={{ boxShadow: 'none' }}
                                    >
                                        <i className="fa fa-plus" />
                                        <Space width="8" />
                                        {i18n._('Macro Variables')}
                                        <Space width="4" />
                                        <i className="fa fa-caret-down" />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className={styles.macroVariablesDropdown}>
                                        {variables.map(v => {
                                            if (typeof v === 'object') {
                                                return v.type === 'header' ? (
                                                    <Dropdown.Header
                                                        key={uniqueId()}
                                                    >
                                                        {v.text}
                                                    </Dropdown.Header>
                                                ) : (
                                                    <Dropdown.Item
                                                        key={uniqueId()}
                                                        eventKey={v}
                                                        className={styles['dropdown-item']}
                                                    >
                                                        {v.text}
                                                    </Dropdown.Item>
                                                );
                                            }

                                            return (
                                                <Dropdown.Item
                                                    eventKey={v}
                                                    key={uniqueId()}
                                                    className={styles['dropdown-item']}
                                                >
                                                    {v}
                                                </Dropdown.Item>
                                            );
                                        })}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            <Textarea
                                ref={c => {
                                    this.fields.content = c;
                                }}
                                rows="10"
                                className="form-control"
                                name="content"
                                value={content}
                                validations={[validations.required]}
                            />
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer style={modalFooterStyle}>
                    <Button
                        btnStyle="danger"
                        className="pull-left"
                        onClick={() => {
                            const name = get(this.fields.name, 'value');

                            portal(({ onClose }) => (
                                <Modal disableOverlay={false} size="xs" onClose={onClose}>
                                    <Modal.Header>
                                        <Modal.Title>
                                            {i18n._('Delete Macro')}
                                        </Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        {i18n._('Are you sure you want to delete this macro?')}
                                        <p><strong>{name}</strong></p>
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button onClick={onClose}>
                                            {i18n._('No')}
                                        </Button>
                                        <Button
                                            btnStyle="danger"
                                            onClick={chainedFunction(
                                                () => {
                                                    actions.deleteMacro(id);
                                                    actions.closeModal();
                                                },
                                                onClose
                                            )}
                                        >
                                            {i18n._('Yes')}
                                        </Button>
                                    </Modal.Footer>
                                </Modal>
                            ));
                        }}
                    >
                        {i18n._('Delete')}
                    </Button>
                    <Button
                        onClick={() => {
                            actions.closeModal();
                        }}
                    >
                        {i18n._('Cancel')}
                    </Button>
                    <Button
                        style={{ backgroundColor: '#3e85c7', color: 'white', backgroundImage: 'none' }}
                        onClick={() => {
                            this.form.validate(err => {
                                if (err) {
                                    return;
                                }

                                const { name, content } = this.value;

                                actions.updateMacro(id, { name, content });
                                actions.closeModal();
                            });
                        }}
                    >
                        {i18n._('Save Changes')}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default EditMacro;

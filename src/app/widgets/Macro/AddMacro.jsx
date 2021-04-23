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
import * as validations from 'app/lib/validations';
import insertAtCaret from './insertAtCaret';
import variables from './variables';
import styles from './index.styl';

import { modalStyle, modalHeaderStyle, modalTitleStyle, modalBodyStyle, modalFooterStyle } from './modalStyle';

const MAX_CHARACTERS = '128';

class AddMacro extends PureComponent {
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
        const { content = '' } = { ...state.modal.params };

        return (
            <Modal
                size="md"
                onClose={actions.closeModal}
                style={modalStyle}
                disableOverlay
            >
                <Modal.Header style={modalHeaderStyle}>
                    <Modal.Title style={modalTitleStyle}>
                        {i18n._('New Macro')}
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
                                maxLength={MAX_CHARACTERS}
                                type="text"
                                className="form-control"
                                name="name"
                                value=""
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
                        onClick={actions.closeModal}
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

                                actions.addMacro({ name, content });
                                actions.closeModal();
                            });
                        }}
                    >
                        {i18n._('Add New Macro')}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default AddMacro;

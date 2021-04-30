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

import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Modal from 'app/components/Modal';
import { ToastNotification } from 'app/components/Notifications';
import ToggleSwitch from 'app/components/ToggleSwitch';
import { Form, Input, Textarea } from 'app/components/Validation';
import i18n from 'app/lib/i18n';
import * as validations from 'app/lib/validations';
import styles from '../form.styl';

class CreateRecord extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    fields = {
        enabled: null,
        title: null,
        commands: null
    };

    get value() {
        const {
            title,
            commands
        } = this.form.getValues();

        return {
            enabled: !!_.get(this.fields.enabled, 'state.checked'),
            title: title,
            commands: commands
        };
    }

    render() {
        const { state, actions } = this.props;
        const { modal } = state;
        const { alertMessage } = modal.params;

        return (
            <Modal disableOverlay size="sm" onClose={actions.closeModal}>
                <Modal.Header>
                    <Modal.Title>
                        {i18n._('Command')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {alertMessage && (
                        <ToastNotification
                            style={{ margin: '-16px -24px 10px -24px' }}
                            type="error"
                            onDismiss={() => {
                                actions.updateModalParams({ alertMessage: '' });
                            }}
                        >
                            {alertMessage}
                        </ToastNotification>
                    )}
                    <Form
                        ref={node => {
                            this.form = node;
                        }}
                        onSubmit={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <div className={styles.formFields}>
                            <div className={styles.formGroup}>
                                <label>{i18n._('Enabled')}</label>
                                <div>
                                    <ToggleSwitch
                                        ref={node => {
                                            this.fields.enabled = node;
                                        }}
                                        size="sm"
                                        checked={true}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>{i18n._('Title')}</label>
                                <Input
                                    type="text"
                                    name="title"
                                    value=""
                                    className={classNames(
                                        'form-control',
                                        styles.formControl,
                                        styles.short
                                    )}
                                    validations={[validations.required]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{i18n._('Commands')}</label>
                                <Textarea
                                    name="commands"
                                    value=""
                                    rows="5"
                                    className={classNames(
                                        'form-control',
                                        styles.formControl,
                                        styles.long
                                    )}
                                    validations={[validations.required]}
                                />
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        type="button"
                        className="btn btn-default"
                        onClick={actions.closeModal}
                    >
                        {i18n._('Cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            this.form.validate(err => {
                                if (err) {
                                    return;
                                }

                                const { enabled, title, commands } = this.value;
                                actions.createRecord({ enabled, title, commands });
                            });
                        }}
                    >
                        {i18n._('OK')}
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default CreateRecord;

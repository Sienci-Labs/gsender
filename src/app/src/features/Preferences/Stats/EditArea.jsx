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

import React, { useState } from 'react';
import Icon from '@mdi/react';
import { mdiDeleteOutline } from '@mdi/js';
import { Button } from 'app/components/Buttons';
import Modal from 'app/components/Modal';
import { Form } from 'app/components/Forms';
import ControlledNumberInput from 'app/components/ControlledNumberInput';
import i18n from 'app/lib/i18n';
import styles from './index.styl';

const MAX_CHARACTERS = '1000';

const EditArea = ({ task, update, closeModal, deleteTask }) => {
    const [name, setName] = useState(task.name);
    const [description, setDescription] = useState(task.description);
    const [rangeStart, setRangeStart] = useState(task.rangeStart);
    const [rangeEnd, setRangeEnd] = useState(task.rangeEnd);
    return (
        <Modal
            size="medium"
            onClose={closeModal}
            disableOverlayClick
            className={styles.modalContainerStyle}
        >
            <Modal.Header>
                <Modal.Title>
                    {i18n._('Edit Task')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className={styles.modalBodyStyle}>
                    <Form
                        onSubmit={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <div className="form-group">
                            <label>{i18n._('Task Name')}</label>
                            <textarea
                                rows="1"
                                maxLength={MAX_CHARACTERS}
                                className="form-control"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Time Due Range</label>
                            <div className={styles.inputContainer}>
                                <ControlledNumberInput
                                    className="form-control"
                                    value={rangeStart}
                                    externalOnChange={(e) => setRangeStart(Number(e.target.value))}
                                    name="rangeStart"
                                    type="number"
                                    min={1}
                                    max={10000}
                                />
                                <span>-</span>
                                <ControlledNumberInput
                                    className="form-control"
                                    value={rangeEnd}
                                    externalOnChange={(e) => setRangeEnd(Number(e.target.value))}
                                    name="rangeStart"
                                    type="number"
                                    min={1}
                                    max={10000}
                                />
                                Hours
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Task Description</label>
                            <textarea
                                rows="10"
                                maxLength={MAX_CHARACTERS}
                                className="form-control"
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </Form>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    onClick={deleteTask}
                    className={styles.deleteButton}
                >
                    {i18n._('Delete Task')} <Icon path={mdiDeleteOutline} size={1} />
                </Button>
                <Button
                    onClick={closeModal}
                >
                    {i18n._('Cancel')}
                </Button>
                <Button
                    style={{ backgroundColor: '#3e85c7', color: 'white', backgroundImage: 'none' }}
                    onClick={() => {
                        let newTask = task;
                        newTask.name = name;
                        newTask.description = description;
                        newTask.rangeStart = rangeStart;
                        newTask.rangeEnd = rangeEnd;
                        update(newTask);
                        closeModal();
                    }}
                >
                    {i18n._('Save Changes')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditArea;

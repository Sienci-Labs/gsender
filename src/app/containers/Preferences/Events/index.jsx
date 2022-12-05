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

import React, { useEffect, useState } from 'react';

import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import { Toaster, TOASTER_DANGER, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import api from 'app/api';
import ToggleSwitch from 'app/components/ToggleSwitch';

import Fieldset from '../components/Fieldset';
import SettingWrapper from '../components/SettingWrapper';
import GeneralArea from '../components/GeneralArea';

import styles from '../index.styl';

const Events = ({ active }) => {
    const [programStartEvent, setProgramStartEvent] = useState(null);
    const [programEndEvent, setProgramEndEvent] = useState(null);
    const [programPauseEvent, setProgramPauseEvent] = useState(null);
    const [programResumeEvent, setProgramResumeEvent] = useState(null);
    const [programStartCode, setProgramStartCode] = useState('');
    const [programEndCode, setProgramEndCode] = useState('');
    const [programPauseCode, setProgramPauseCode] = useState('');
    const [programResumeCode, setProgramResumeCode] = useState('');
    const [startEnabled, setStartEnabled] = useState(true);
    const [endEnabled, setEndEnabled] = useState(true);
    const [pauseEnabled, setPauseEnabled] = useState(true);
    const [resumeEnabled, setResumeEnabled] = useState(true);

    const changeStartCodeValue = (e) => setProgramStartCode(e.target.value);
    const changeEndCodeValue = (e) => setProgramEndCode(e.target.value);
    const changePauseCodeValue = (e) => setProgramPauseCode(e.target.value);
    const changeResumeCodeValue = (e) => setProgramResumeCode(e.target.value);

    const toggleStartEvent = async () => {
        try {
            if (programStartEvent) {
                programStartEvent.enabled = !programStartEvent.enabled;
                await api.events.update(programStartEvent.id, {
                    enabled: programStartEvent.enabled
                });
                setStartEnabled(programStartEvent.enabled);
            }
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program Start event',
                type: TOASTER_DANGER
            });
        }
    };

    const toggleEndEvent = async () => {
        try {
            if (programEndEvent) {
                programEndEvent.enabled = !programEndEvent.enabled;
                await api.events.update(programEndEvent.id, {
                    enabled: programEndEvent.enabled
                });
                setEndEnabled(programEndEvent.enabled);
            }
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program End event',
                type: TOASTER_DANGER
            });
        }
    };

    const togglePauseEvent = async () => {
        try {
            if (programPauseEvent) {
                programPauseEvent.enabled = !programPauseEvent.enabled;
                await api.events.update(programPauseEvent.id, {
                    enabled: programPauseEvent.enabled
                });
                setPauseEnabled(programPauseEvent.enabled);
            }
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program Pause event',
                type: TOASTER_DANGER
            });
        }
    };
    const toggleResumeEvent = async () => {
        try {
            if (programResumeEvent) {
                programResumeEvent.enabled = !programResumeEvent.enabled;
                await api.events.update(programResumeEvent.id, {
                    enabled: programResumeEvent.enabled
                });
                setResumeEnabled(programResumeEvent.enabled);
            }
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program Resume event',
                type: TOASTER_DANGER
            });
        }
    };

    const updateProgramStartEvent = async () => {
        try {
            if (programStartEvent) {
                await api.events.update(programStartEvent.id, {
                    commands: programStartCode
                });
            } else {
                const res = await api.events.create({
                    event: 'gcode:start',
                    trigger: 'gcode',
                    commands: programStartCode
                });
                const { id } = res.body;
                setProgramStartEvent({
                    id
                });
            }
            Toaster.pop({
                msg: 'Updated Program Start event',
                type: TOASTER_SUCCESS
            });
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program Start event',
                type: TOASTER_DANGER
            });
        }
    };

    const updateProgramEndEvent = async () => {
        try {
            if (programEndEvent) {
                await api.events.update(programEndEvent.id, {
                    commands: programEndCode
                });
            } else {
                const res = await api.events.create({
                    event: 'gcode:stop',
                    trigger: 'gcode',
                    commands: programEndCode
                });
                const { id } = res.body;
                setProgramEndEvent({
                    id
                });
            }
            Toaster.pop({
                msg: 'Updated Program Stop event',
                type: TOASTER_SUCCESS
            });
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program Stop event',
                type: TOASTER_DANGER
            });
        }
    };

    const updateProgramPauseEvent = async () => {
        try {
            if (programPauseEvent) {
                await api.events.update(programPauseEvent.id, {
                    commands: programPauseCode
                });
            } else {
                const res = await api.events.create({
                    event: 'gcode:pause',
                    trigger: 'gcode',
                    commands: programPauseCode
                });
                const { id } = res.body;
                setProgramPauseEvent({
                    id
                });
            }
            Toaster.pop({
                msg: 'Updated Program Pause event',
                type: TOASTER_SUCCESS
            });
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program Pause event',
                type: TOASTER_DANGER
            });
        }
    };

    const updateProgramResumeEvent = async () => {
        try {
            if (programResumeEvent) {
                await api.events.update(programResumeEvent.id, {
                    commands: programResumeCode
                });
            } else {
                const res = await api.events.create({
                    event: 'gcode:resume',
                    trigger: 'gcode',
                    commands: programResumeCode
                });
                const { id } = res.body;
                setProgramResumeEvent({
                    id
                });
            }
            Toaster.pop({
                msg: 'Updated Program Resume event',
                type: TOASTER_SUCCESS
            });
        } catch (e) {
            Toaster.pop({
                msg: 'Unable to update Program Resume event',
                type: TOASTER_DANGER
            });
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const response = await api.events.fetch();
                const { records } = response.body;
                const startEvent = records.filter((record) => record.event === 'gcode:start')[0];
                const endEvent = records.filter((record) => record.event === 'gcode:stop')[0];
                const pauseEvent = records.filter((record) => record.event === 'gcode:pause')[0];
                const resumeEvent = records.filter((record) => record.event === 'gcode:resume')[0];
                startEvent && setProgramStartEvent(startEvent);
                startEvent && setProgramStartCode(startEvent.commands);
                startEvent && setStartEnabled(startEvent.enabled);
                endEvent && setProgramEndEvent(endEvent);
                endEvent && setProgramEndCode(endEvent.commands);
                endEvent && setEndEnabled(endEvent.enabled);
                pauseEvent && setProgramPauseEvent(pauseEvent);
                pauseEvent && setProgramPauseCode(pauseEvent.commands);
                pauseEvent && setPauseEnabled(pauseEvent.enabled);
                resumeEvent && setProgramResumeEvent(resumeEvent);
                resumeEvent && setProgramResumeCode(resumeEvent.commands);
                resumeEvent && setResumeEnabled(resumeEvent.enabled);
            } catch (e) {
                Toaster.pop({
                    msg: 'Unable to fetch Start/Stop event records',
                    type: TOASTER_DANGER
                });
            }
        };
        init();
    }, []);

    return (
        <SettingWrapper title="Program Events" show={active}>
            <GeneralArea>
                <div className={styles.flexColumn} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <div className={styles.flexRowEvent} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-around' }}>
                        <Fieldset legend="Program Start" className={styles.paddingBottom}>
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch checked={startEnabled} onChange={toggleStartEvent} label="Enabled" />
                            </div>
                            <textarea
                                rows="10"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onStart"
                                value={programStartCode}
                                onChange={changeStartCodeValue}
                            />
                            <FunctionButton primary onClick={updateProgramStartEvent} style={{ marginBottom: '0.5rem' }}>
                                Update Start Event
                            </FunctionButton>
                        </Fieldset>
                        <Fieldset legend="Program Stop" className={styles.paddingBottom}>
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch checked={endEnabled} onChange={toggleEndEvent} label="Enabled" />
                            </div>
                            <textarea
                                rows="10"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onStop"
                                value={programEndCode}
                                onChange={changeEndCodeValue}
                            />
                            <FunctionButton primary onClick={updateProgramEndEvent} style={{ marginBottom: '0.5rem' }}>
                                Update Stop Event
                            </FunctionButton>
                        </Fieldset>
                    </div>
                    <div className={styles.flexRowEvent} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-around' }}>
                        <Fieldset legend="Program Pause" className={styles.paddingBottom}>
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch checked={pauseEnabled} onChange={togglePauseEvent} label="Enabled" />
                            </div>
                            <textarea
                                rows="9"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onPause"
                                value={programPauseCode}
                                onChange={changePauseCodeValue}
                            />
                            <FunctionButton primary onClick={updateProgramPauseEvent} style={{ marginBottom: '0.5rem' }}>
                                Update Pause Event
                            </FunctionButton>
                        </Fieldset>
                        <Fieldset legend="Program Resume" className={styles.paddingBottom}>
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch checked={resumeEnabled} onChange={toggleResumeEvent} label="Enabled" />
                            </div>
                            <textarea
                                rows="9"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onResume"
                                value={programResumeCode}
                                onChange={changeResumeCodeValue}
                            />
                            <FunctionButton primary onClick={updateProgramResumeEvent} style={{ marginBottom: '0.5rem' }}>
                                Update Resume Event
                            </FunctionButton>
                        </Fieldset>
                    </div>
                </div>
            </GeneralArea>
        </SettingWrapper>
    );
};

export default Events;

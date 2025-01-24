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

import { Button as FunctionButton } from 'app/components/Button';
import {
    Toaster,
    TOASTER_DANGER,
    TOASTER_SUCCESS,
} from 'app/lib/toaster/ToasterLib';
import api from 'app/api';
import ToggleSwitch from 'app/components/Switch';
import {
    PROGRAM_START,
    PROGRAM_END,
    PROGRAM_PAUSE,
    PROGRAM_RESUME,
    USAGE_TOOL_NAME,
} from '../../../constants';

import Fieldset from '../components/Fieldset';
import SettingWrapper from '../components/SettingWrapper';
import GeneralArea from '../components/GeneralArea';

import styles from '../index.module.styl';
import { collectUserUsageData } from '../../../lib/heatmap';
import { toast } from 'app/lib/toaster';

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
                await api.events.update(PROGRAM_START, {
                    enabled: programStartEvent.enabled,
                });
                setStartEnabled(programStartEvent.enabled);
            }
        } catch (e) {
            toast.error('Unable to update Program Start event');
        }
    };

    const toggleEndEvent = async () => {
        try {
            if (programEndEvent) {
                programEndEvent.enabled = !programEndEvent.enabled;
                await api.events.update(PROGRAM_END, {
                    enabled: programEndEvent.enabled,
                });
                setEndEnabled(programEndEvent.enabled);
            }
        } catch (e) {
            toast.error('Unable to update Program End event');
        }
    };

    const togglePauseEvent = async () => {
        try {
            if (programPauseEvent) {
                programPauseEvent.enabled = !programPauseEvent.enabled;
                await api.events.update(PROGRAM_PAUSE, {
                    enabled: programPauseEvent.enabled,
                });
                setPauseEnabled(programPauseEvent.enabled);
            }
        } catch (e) {
            toast.error('Unable to update Program Pause event');
        }
    };
    const toggleResumeEvent = async () => {
        try {
            if (programResumeEvent) {
                programResumeEvent.enabled = !programResumeEvent.enabled;
                await api.events.update(PROGRAM_RESUME, {
                    enabled: programResumeEvent.enabled,
                });
                setResumeEnabled(programResumeEvent.enabled);
            }
        } catch (e) {
            toast.error('Unable to update Program Resume event');
        }
    };

    const updateProgramStartEvent = async () => {
        try {
            if (programStartEvent) {
                await api.events.update(PROGRAM_START, {
                    commands: programStartCode,
                });
            } else {
                const res = await api.events.create({
                    event: PROGRAM_START,
                    trigger: 'gcode',
                    commands: programStartCode,
                });
                const { record } = res.body;
                setProgramStartEvent(record);
            }
            toast.info('Updated Program Start event');
        } catch (e) {
            toast.error('Unable to update Program Start event');
        }
    };

    const updateProgramEndEvent = async () => {
        try {
            if (programEndEvent) {
                await api.events.update(PROGRAM_END, {
                    commands: programEndCode,
                });
            } else {
                const res = await api.events.create({
                    event: PROGRAM_END,
                    trigger: 'gcode',
                    commands: programEndCode,
                });
                const { record } = res.body;
                setProgramEndEvent(record);
            }
            toast.info('Updated Program Stop event');
        } catch (e) {
            toast.error('Unable to update Program Stop event');
        }
    };

    const updateProgramPauseEvent = async () => {
        try {
            if (programPauseEvent) {
                await api.events.update(PROGRAM_PAUSE, {
                    commands: programPauseCode,
                });
            } else {
                const res = await api.events.create({
                    event: PROGRAM_PAUSE,
                    trigger: 'gcode',
                    commands: programPauseCode,
                });
                const { record } = res.body;
                setProgramPauseEvent(record);
            }
            toast.info('Updated Program Pause event');
        } catch (e) {
            toast.error('Unable to update Program Pause event');
        }
    };

    const updateProgramResumeEvent = async () => {
        try {
            if (programResumeEvent) {
                await api.events.update(PROGRAM_RESUME, {
                    commands: programResumeCode,
                });
            } else {
                const res = await api.events.create({
                    event: PROGRAM_RESUME,
                    trigger: 'gcode',
                    commands: programResumeCode,
                });
                const { record } = res.body;
                setProgramResumeEvent(record);
            }
            toast.info('Updated Program Resume event');
        } catch (e) {
            toast.error('Unable to update Program Resume event');
        }
    };

    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await api.events.fetch();
                const { records: jsonRecords } = response.body;
                const records = new Map(Object.entries(jsonRecords));
                const startEvent = records.get(PROGRAM_START);
                const endEvent = records.get(PROGRAM_END);
                const pauseEvent = records.get(PROGRAM_PAUSE);
                const resumeEvent = records.get(PROGRAM_RESUME);
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
                toast.error('Unable to fetch Start/Stop event records');
            }
        }

        fetchEvents();

        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.SETTINGS.PROGRAM_EVENTS);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    return (
        <SettingWrapper title="Program Events" show={active}>
            <GeneralArea>
                <div
                    className={styles.flexColumn}
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'space-between',
                    }}
                >
                    <div
                        className={styles.flexRowEvent}
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'space-around',
                        }}
                    >
                        <Fieldset
                            legend="Program Start"
                            className={styles.paddingBottom}
                        >
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch
                                    checked={startEnabled}
                                    onChange={toggleStartEvent}
                                    label="Enabled"
                                />
                            </div>
                            <textarea
                                rows="10"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onStart"
                                value={programStartCode}
                                onChange={changeStartCodeValue}
                            />
                            <FunctionButton
                                primary
                                onClick={updateProgramStartEvent}
                                style={{ marginBottom: '0.5rem' }}
                            >
                                Update Start Event
                            </FunctionButton>
                        </Fieldset>
                        <Fieldset
                            legend="Program Stop"
                            className={styles.paddingBottom}
                        >
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch
                                    checked={endEnabled}
                                    onChange={toggleEndEvent}
                                    label="Enabled"
                                />
                            </div>
                            <textarea
                                rows="10"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onStop"
                                value={programEndCode}
                                onChange={changeEndCodeValue}
                            />
                            <FunctionButton
                                primary
                                onClick={updateProgramEndEvent}
                                style={{ marginBottom: '0.5rem' }}
                            >
                                Update Stop Event
                            </FunctionButton>
                        </Fieldset>
                    </div>
                    <div
                        className={styles.flexRowEvent}
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'space-around',
                        }}
                    >
                        <Fieldset
                            legend="Program Pause"
                            className={styles.paddingBottom}
                        >
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch
                                    checked={pauseEnabled}
                                    onChange={togglePauseEvent}
                                    label="Enabled"
                                />
                            </div>
                            <textarea
                                rows="9"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onPause"
                                value={programPauseCode}
                                onChange={changePauseCodeValue}
                            />
                            <FunctionButton
                                primary
                                onClick={updateProgramPauseEvent}
                                style={{ marginBottom: '0.5rem' }}
                            >
                                Update Pause Event
                            </FunctionButton>
                        </Fieldset>
                        <Fieldset
                            legend="Program Resume"
                            className={styles.paddingBottom}
                        >
                            <div className={styles.toggleContainer}>
                                <ToggleSwitch
                                    checked={resumeEnabled}
                                    onChange={toggleResumeEvent}
                                    label="Enabled"
                                />
                            </div>
                            <textarea
                                rows="9"
                                className="form-control"
                                style={{ resize: 'none' }}
                                name="onResume"
                                value={programResumeCode}
                                onChange={changeResumeCodeValue}
                            />
                            <FunctionButton
                                primary
                                onClick={updateProgramResumeEvent}
                                style={{ marginBottom: '0.5rem' }}
                            >
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

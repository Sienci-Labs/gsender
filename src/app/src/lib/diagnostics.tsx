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
import { PiFileZipFill } from 'react-icons/pi';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import partition from 'lodash/partition';
import uniqueId from 'lodash/uniqueId';
import isEqual from 'lodash/isEqual';
import {
    pdf,
    Page,
    View,
    Text,
    Link,
    Document,
    StyleSheet,
} from '@react-pdf/renderer';
import saveAs from 'file-saver';
import JSZip from 'jszip';

import { Button } from 'app/components/Button';
import { toast } from 'app/lib/toaster';
import { AlarmsErrors } from 'app/definitions/alarms_errors';
import { EEPROMSettings, MachineProfile } from 'app/definitions/firmware';
import { UNITS_EN } from 'app/definitions/general';
import { JogSpeeds } from 'app/features/Jogging/definitions';
import { SPINDLE_LASER_T } from 'app/features/Spindle/definitions';
import {
    ConnectionState,
    ControllerState,
    FileInfoState,
} from 'app/store/definitions';
import controllerInstance from 'app/lib/controller';

import store from '../store';
import { store as reduxStore } from '../store/redux';
import pkg from '../../package.json';
import {
    GRBLHAL,
    LASER_MODE,
    METRIC_UNITS,
    WORKSPACE_MODE,
} from '../constants';
import api from '../api';
import { homingString } from '../lib/eeprom';

const styles = StyleSheet.create({
    // Page layout
    body: {
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
    },

    // Header styles
    title: {
        fontSize: 28,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    author: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: 'Helvetica',
        color: '#666666',
    },

    // Section styles
    section: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#2c3e50',
        marginBottom: 12,
        borderBottom: '1px solid #3498db',
    },

    // Text styles
    text: {
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: '#2c3e50',
        lineHeight: 1.4,
        marginBottom: 4,
    },
    textBold: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#1a1a1a',
        lineHeight: 1.4,
        marginBottom: 4,
    },
    textItalic: {
        fontSize: 11,
        fontFamily: 'Helvetica-Oblique',
        color: '#666666',
        lineHeight: 1.4,
        marginBottom: 4,
    },
    textSmall: {
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: '#666666',
        lineHeight: 1.3,
    },

    // Container styles
    container: {
        marginBottom: 12,
    },

    // Grid layout for information sections
    grid: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    gridVertical: {
        flexDirection: 'column',
        marginBottom: 16,
    },
    gridVerticalItem: {
        flex: 1,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
    },
    gridItem: {
        flex: 1,
        marginRight: 12,
        padding: 12,
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
    },
    gridItemLast: {
        flex: 1,
        padding: 12,
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
    },

    // Table styles - modern and clean
    table: {
        width: '100%',
        marginBottom: 16,
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
    },
    tableHeader: {
        backgroundColor: '#3498db',
        flexDirection: 'row',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #e9ecef',
    },
    tableRowEven: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
    },
    tableCol: {
        flex: 1,
        padding: 8,
        borderRight: '1px solid #e9ecef',
    },
    tableColLast: {
        flex: 1,
        padding: 8,
    },
    tableCell: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#2c3e50',
        lineHeight: 1.3,
    },
    tableCellHeader: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        lineHeight: 1.3,
    },

    // Highlighting styles for non-default EEPROM values
    highlightedRow: {
        backgroundColor: '#fff3cd',
        borderLeft: '4px solid #ffc107',
    },
    highlightedCol: {
        backgroundColor: '#fff3cd',
    },
    highlightedText: {
        fontFamily: 'Helvetica-Bold',
        color: '#856404',
    },

    // Status indicators
    statusEnabled: {
        color: '#27ae60',
        fontFamily: 'Helvetica-Bold',
    },
    statusDisabled: {
        color: '#e74c3c',
        fontFamily: 'Helvetica-Bold',
    },
    statusWarning: {
        color: '#f39c12',
        fontFamily: 'Helvetica-Bold',
    },

    // Code/terminal styles
    codeBlock: {
        backgroundColor: '#2c3e50',
        color: '#ecf0f1',
        padding: 8,
        fontFamily: 'Courier',
        fontSize: 9,
        lineHeight: 1.3,
        marginBottom: 12,
    },
    codeBlockText: {
        fontSize: 9,
        fontFamily: 'Courier',
        color: '#ecf0f1',
        lineHeight: 1.3,
    },

    // Alert styles
    alert: {
        padding: 8,
        marginBottom: 8,
        border: '1px solid #e9ecef',
    },
    alertError: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        color: '#721c24',
    },
    alertWarning: {
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        color: '#856404',
    },
    alertInfo: {
        backgroundColor: '#d1ecf1',
        borderColor: '#bee5eb',
        color: '#0c5460',
    },
    // Navigation styles
    navBar: {
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    navTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    navLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    navLink: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#3498db',
        textDecoration: 'underline',
        marginRight: 12,
        marginBottom: 4,
    },
    addBottomMargin: {
        marginBottom: 12,
    },
});

const getEEPROMValues = (): EEPROMSettings => {
    const eeprom: EEPROMSettings = get(
        reduxStore.getState(),
        'controller.settings.settings',
        {},
    );
    return eeprom;
};

const getMachineProfile = (): MachineProfile => {
    const machineProfile: MachineProfile = store.get(
        'workspace.machineProfile',
    );
    return machineProfile;
};

const getGSenderVersion = (): string => {
    const version = `${pkg.version}`;
    return version;
};

const getGRBLInformation = (): ControllerState => {
    const grblInfo: ControllerState = get(reduxStore.getState(), 'controller');
    return grblInfo;
};

const getOS = (): string => {
    // let os = "unknown";
    const navApp = navigator.userAgent;
    const os = navApp.substring(navApp.indexOf('(') + 1, navApp.indexOf(')'));

    return os;
};

const getGCodeFile = (): string => {
    const gcode: string = get(reduxStore.getState(), 'file.content', '');
    return gcode;
};

const getGCodeFileName = () => {
    return get(reduxStore.getState(), 'file.name', 'diagnosticGcode.gcode');
};

const getMode = (): boolean => {
    const mode: SPINDLE_LASER_T = store.get('widgets.spindle.mode');
    return mode === LASER_MODE;
};

const getConnection = (): ConnectionState => {
    const connection: ConnectionState = get(
        reduxStore.getState(),
        'connection',
    );
    return connection;
};

const getFileInfo = (): FileInfoState => {
    const fileInfo: FileInfoState = get(reduxStore.getState(), 'file');
    return fileInfo;
};

const getJogPresets = (): JogSpeeds => {
    const jogPresets: JogSpeeds = store.get('widgets.axes.jog', {});
    return jogPresets;
};

const getWorkspaceUnits = (): string => {
    const workspaceUnits: UNITS_EN = store.get('workspace.units', METRIC_UNITS);
    return workspaceUnits;
};

const getRotaryMode = (): boolean => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;
    const isRotaryMode = store.get('workspace.mode', DEFAULT) === ROTARY;
    return isRotaryMode;
};

const getSafeHeight = (): number => {
    const safeHeight: number = store.get('workspace.safeRetractHeight');
    return safeHeight;
};

const getEvents = async () => {
    const res = await api.events.fetch();
    const events = res.data.records;
    return events;
};

const getTerminalHistory = (): string[] => {
    const terminalHistory: string[] = get(
        reduxStore.getState(),
        'console.history',
        [],
    );
    return terminalHistory;
};

const unwrapObject = (obj: object, iteration: number): string => {
    let tabs = '';
    for (let i = 0; i < iteration; i++) {
        tabs += '    '; // non break spaces to indent
    }
    if (isEmpty(obj)) {
        return tabs + 'NULL\n';
    }
    // .join('') is used to solve an issue where unwanted commas appeared: https://stackoverflow.com/a/45812277
    return Object.keys(obj)
        .map((key, _i) =>
            typeof obj[key as keyof typeof obj] === 'object'
                ? tabs +
                  key +
                  ': \n' +
                  unwrapObject(obj[key as keyof typeof obj], iteration + 1)
                : tabs + key + ': ' + obj[key as keyof typeof obj] + '\n',
        )
        .join('');
};

const isEEPROMValueDifferent = (
    key: string,
    currentValue: any,
    machineProfile: MachineProfile,
    controllerType: string,
): boolean => {
    const profileDefaults =
        controllerType === 'Grbl'
            ? machineProfile.eepromSettings
            : machineProfile.grblHALeepromSettings;

    if (!profileDefaults) {
        return false;
    }

    const defaultValue = get(profileDefaults, key, '-');

    if (defaultValue === '-') {
        return false; // Don't highlight if we don't know the default
    }

    // Compare values, handling numeric comparison for precision
    return !isEqual(
        Number(currentValue).toFixed(3),
        Number(defaultValue).toFixed(3),
    );
};

const createTableRows = (
    array: object,
    machineProfile: MachineProfile,
    controllerType: string,
): React.JSX.Element[] => {
    return Object.keys(array).map((key, index) => {
        const currentValue = array[key as keyof typeof array];
        const isDifferent = isEEPROMValueDifferent(
            key,
            currentValue,
            machineProfile,
            controllerType,
        );

        const profileDefaults =
            controllerType === 'Grbl'
                ? machineProfile.eepromSettings
                : machineProfile.grblHALeepromSettings;
        const defaultValue = get(profileDefaults, key, '-');

        const rowStyle =
            index % 2 === 0 ? styles.tableRow : styles.tableRowEven;

        return (
            <View
                style={[rowStyle, isDifferent && styles.highlightedRow]}
                key={uniqueId()}
                wrap={false}
            >
                <View
                    style={[
                        styles.tableCol,
                        isDifferent && styles.highlightedCol,
                    ]}
                >
                    <Text
                        style={[
                            styles.tableCell,
                            isDifferent && styles.highlightedText,
                        ]}
                    >
                        {key}
                    </Text>
                </View>
                <View
                    style={[
                        styles.tableCol,
                        isDifferent && styles.highlightedCol,
                    ]}
                >
                    <Text
                        style={[
                            styles.tableCell,
                            isDifferent && styles.highlightedText,
                        ]}
                    >
                        {currentValue}
                    </Text>
                </View>
                <View
                    style={[
                        styles.tableColLast,
                        isDifferent && styles.highlightedCol,
                    ]}
                >
                    <Text
                        style={[
                            styles.tableCell,
                            isDifferent && styles.highlightedText,
                        ]}
                    >
                        {defaultValue}
                    </Text>
                </View>
            </View>
        );
    });
};

async function exportSenderSettings() {
    const settings = store.get();
    settings.commandKeys = Object.fromEntries(
        Object.entries(settings.commandKeys).filter(
            ([, shortcut]) => (shortcut as any).category !== 'Macros',
        ),
    );

    delete settings.session;
    const res = await api.events.fetch();
    const events = res.data.records;
    const settingsJSON = JSON.stringify({ settings, events }, null, 3);
    return new Blob([settingsJSON], { type: 'application/json' });
}

function generateSupportFile() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');

    const eeprom = getEEPROMValues();
    const machineProfile = getMachineProfile();
    const version = getGSenderVersion();
    const grblInfo = getGRBLInformation();
    const os = getOS();
    const terminalHistory = getTerminalHistory();
    const gcode = getGCodeFile();
    const mode = getMode();
    const connection = getConnection();
    const fileInfo = getFileInfo();
    const jogPresets = getJogPresets();
    const workspaceUnits = getWorkspaceUnits();
    const isRotaryMode = getRotaryMode();
    const safeHeight = getSafeHeight();
    let fileStart = {};
    let filePause = {};
    let fileResume = {};
    let fileStop = {};

    getEvents().then((events) => {
        console.log(events);
        if (events) {
            fileStart = events['gcode:start'];
            filePause = events['gcode:pause'];
            fileResume = events['gcode:resume'];
            fileStop = events['gcode:stop'];
        }
    });

    let alarms: Array<AlarmsErrors>,
        errors: Array<AlarmsErrors> = [];

    api.alarmList.recent().then((value) => {
        const grblAlarmsAndErrors = get(value, 'data.list', []);
        [alarms, errors] = partition(grblAlarmsAndErrors, ['type', 'ALARM']);
    });

    let eepromData = [];
    Object.entries(eeprom).forEach((entry) => {
        const [key, value] = entry;
        eepromData.push({ key: key, value: value });
    });

    const SupportFile = () => (
        <Document>
            <Page style={styles.body}>
                <Text style={styles.title}>Diagnostics Report</Text>
                <Text style={styles.author}>
                    gSender v{version} • Generated on{' '}
                    {new Date().toLocaleDateString()}
                </Text>

                <View style={styles.navBar}>
                    <Text style={styles.navTitle}>Quick Navigation</Text>
                    <View style={styles.navLinks}>
                        <Link src="#environment" style={styles.navLink}>
                            Environment & Machine Profile
                        </Link>
                        <Link src="#connection" style={styles.navLink}>
                            Connection & Controller Status
                        </Link>
                        <Link src="#preferences" style={styles.navLink}>
                            Preferences & Settings
                        </Link>
                        <Link src="#automations" style={styles.navLink}>
                            Automations
                        </Link>
                        <Link src="#firmware" style={styles.navLink}>
                            Firmware Settings
                        </Link>
                        <Link src="#alerts" style={styles.navLink}>
                            Errors and Alarms
                        </Link>
                        <Link src="#terminal" style={styles.navLink}>
                            Terminal History
                        </Link>
                        <Link src="#gcode" style={styles.navLink}>
                            G-Code File Status
                        </Link>
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text id="environment" style={styles.subtitle}>
                            Environment
                        </Text>
                        <Text style={styles.textBold}>Operating System:</Text>
                        <Text style={styles.text}>{os}</Text>

                        <Text style={styles.textBold}>Homing:</Text>
                        <Text
                            style={[
                                styles.text,
                                Number(eeprom.$22) % 2 === 1
                                    ? styles.statusEnabled
                                    : styles.statusDisabled,
                            ]}
                        >
                            {Number(eeprom.$22) % 2 === 1
                                ? 'Enabled'
                                : 'Disabled'}
                        </Text>

                        <Text style={styles.textBold}>Soft Limits:</Text>
                        <Text
                            style={[
                                styles.text,
                                eeprom.$20 === '1'
                                    ? styles.statusEnabled
                                    : styles.statusDisabled,
                            ]}
                        >
                            {eeprom.$20 === '1' ? 'Enabled' : 'Disabled'}
                        </Text>

                        <Text style={styles.textBold}>Home Location:</Text>
                        <Text style={styles.text}>
                            {homingString(eeprom.$23 as string)}
                        </Text>

                        <Text style={styles.textBold}>Report Inches:</Text>
                        <Text
                            style={[
                                styles.text,
                                eeprom.$13 === '1'
                                    ? styles.statusEnabled
                                    : styles.statusDisabled,
                            ]}
                        >
                            {eeprom.$13 === '1' ? 'Enabled' : 'Disabled'}
                        </Text>

                        <Text style={styles.textBold}>Stepper Motors:</Text>
                        <Text
                            style={[
                                styles.text,
                                eeprom.$1 === '255'
                                    ? styles.statusWarning
                                    : styles.statusEnabled,
                            ]}
                        >
                            {eeprom.$1 === '255' ? 'Locked' : 'Unlocked'}
                        </Text>
                    </View>

                    <View style={styles.gridItemLast}>
                        <Text id="machine-profile" style={styles.subtitle}>
                            Machine Profile
                        </Text>
                        {machineProfile ? (
                            <>
                                <Text style={styles.textBold}>ID:</Text>
                                <Text style={styles.text}>
                                    {machineProfile.id}
                                </Text>

                                <Text style={styles.textBold}>Company:</Text>
                                <Text style={styles.text}>
                                    {machineProfile.company}
                                </Text>

                                <Text style={styles.textBold}>Name:</Text>
                                <Text style={styles.text}>
                                    {machineProfile.name}
                                </Text>

                                <Text style={styles.textBold}>Type:</Text>
                                <Text style={styles.text}>
                                    {machineProfile.type}
                                </Text>

                                <Text style={styles.textBold}>Version:</Text>
                                <Text style={styles.text}>
                                    {machineProfile.version}
                                </Text>

                                <Text style={styles.textBold}>Work Area:</Text>
                                <Text style={styles.textSmall}>
                                    X: {get(machineProfile, 'limits.xmax', '0')}
                                    mm{'\n'}
                                    Y: {get(machineProfile, 'limits.ymax', '0')}
                                    mm{'\n'}
                                    Z: {get(machineProfile, 'limits.zmax', '0')}
                                    mm
                                </Text>

                                <Text style={styles.textBold}>
                                    Spindle/Laser:
                                </Text>
                                <Text
                                    style={[
                                        styles.text,
                                        machineProfile.spindle
                                            ? styles.statusEnabled
                                            : styles.statusDisabled,
                                    ]}
                                >
                                    {machineProfile.spindle
                                        ? 'Available'
                                        : 'Not Available'}
                                </Text>

                                <Text style={styles.textBold}>Laser Mode:</Text>
                                <Text
                                    style={[
                                        styles.text,
                                        mode
                                            ? styles.statusEnabled
                                            : styles.statusDisabled,
                                    ]}
                                >
                                    {mode ? 'Enabled' : 'Disabled'}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.text}>
                                No machine profile loaded
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text id="connection" style={styles.subtitle}>
                            Connection
                        </Text>
                        {connection ? (
                            <>
                                <Text style={styles.textBold}>
                                    Connected Port:
                                </Text>
                                <Text style={styles.text}>
                                    {connection.port || 'Not connected'}
                                </Text>

                                <Text style={styles.textBold}>Baudrate:</Text>
                                <Text style={styles.text}>
                                    {connection.baudrate || 'N/A'}
                                </Text>

                                {connection.port && (
                                    <>
                                        <Text style={styles.textBold}>
                                            Manufacturer:
                                        </Text>
                                        <Text style={styles.text}>
                                            {connection.manufacturer ||
                                                'Unknown'}
                                        </Text>

                                        <Text style={styles.textBold}>
                                            In Use:
                                        </Text>
                                        <Text
                                            style={[
                                                styles.text,
                                                connection.inUse
                                                    ? styles.statusWarning
                                                    : styles.statusEnabled,
                                            ]}
                                        >
                                            {connection.inUse ? 'Yes' : 'No'}
                                        </Text>
                                    </>
                                )}

                                <Text style={styles.textBold}>
                                    Available Ports:
                                </Text>
                                <Text style={styles.text}>
                                    {connection.ports.length > 0
                                        ? connection.ports
                                              .map(
                                                  (port, index) =>
                                                      `${port.port}${index < connection.ports.length - 1 ? ', ' : ''}`,
                                              )
                                              .join('')
                                        : 'None detected'}
                                </Text>

                                {connection.unrecognizedPorts &&
                                    connection.unrecognizedPorts.length > 0 && (
                                        <>
                                            <Text style={styles.textBold}>
                                                Unrecognized Ports:
                                            </Text>
                                            {connection.unrecognizedPorts.map(
                                                (port, index) => (
                                                    <Text
                                                        style={styles.text}
                                                        key={index}
                                                    >
                                                        • {port.port}
                                                    </Text>
                                                ),
                                            )}
                                        </>
                                    )}
                            </>
                        ) : (
                            <Text style={styles.text}>
                                No connection information available
                            </Text>
                        )}
                    </View>

                    <View style={styles.gridItemLast}>
                        <Text id="controller-status" style={styles.subtitle}>
                            Controller Status
                        </Text>
                        <Text style={styles.textBold}>Type:</Text>
                        <Text style={styles.text}>
                            {grblInfo.type || 'Unknown'}
                        </Text>

                        <Text style={styles.textBold}>Firmware:</Text>
                        <Text style={styles.text}>
                            {grblInfo.settings.info?.BOARD || 'N/A'}
                        </Text>

                        <Text style={styles.textBold}>Workflow State:</Text>
                        <Text
                            style={[
                                styles.text,
                                grblInfo.workflow.state === 'Idle'
                                    ? styles.statusEnabled
                                    : styles.statusWarning,
                            ]}
                        >
                            {grblInfo.workflow.state}
                        </Text>

                        <Text style={styles.textBold}>Homing Status:</Text>
                        <Text
                            style={[
                                styles.text,
                                grblInfo.homingFlag
                                    ? styles.statusEnabled
                                    : styles.statusDisabled,
                            ]}
                        >
                            {grblInfo.homingFlag ? 'Homed' : 'Not Homed'}
                        </Text>

                        {!isEmpty(grblInfo.mpos) && (
                            <>
                                <Text style={styles.textBold}>
                                    Machine Position:
                                </Text>
                                <Text style={styles.textSmall}>
                                    X: {grblInfo.mpos.x}mm{'\n'}
                                    Y: {grblInfo.mpos.y}mm{'\n'}
                                    Z: {grblInfo.mpos.z}mm
                                    {grblInfo.mpos.a !== undefined &&
                                        `\nA: ${grblInfo.mpos.a}°`}
                                    {grblInfo.mpos.b !== undefined &&
                                        `\nB: ${grblInfo.mpos.b}°`}
                                    {grblInfo.mpos.c !== undefined &&
                                        `\nC: ${grblInfo.mpos.c}°`}
                                </Text>
                            </>
                        )}

                        {!isEmpty(grblInfo.wpos) && (
                            <>
                                <Text style={styles.textBold}>
                                    Work Position:
                                </Text>
                                <Text style={styles.textSmall}>
                                    X: {grblInfo.wpos.x}mm{'\n'}
                                    Y: {grblInfo.wpos.y}mm{'\n'}
                                    Z: {grblInfo.wpos.z}mm
                                    {grblInfo.wpos.a !== undefined &&
                                        `\nA: ${grblInfo.wpos.a}°`}
                                    {grblInfo.wpos.b !== undefined &&
                                        `\nB: ${grblInfo.wpos.b}°`}
                                    {grblInfo.wpos.c !== undefined &&
                                        `\nC: ${grblInfo.wpos.c}°`}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text id="preferences" style={styles.subtitle}>
                        Preferences & Settings
                    </Text>

                    <View style={styles.grid}>
                        <View style={styles.gridItem}>
                            <Text style={styles.textBold}>
                                Workspace Units:
                            </Text>
                            <Text
                                style={[
                                    styles.text,
                                    workspaceUnits === 'mm'
                                        ? styles.statusEnabled
                                        : styles.statusWarning,
                                ]}
                            >
                                {workspaceUnits === 'mm'
                                    ? 'Metric (mm)'
                                    : 'Imperial (inches)'}
                            </Text>

                            <Text style={styles.textBold}>Safeheight:</Text>
                            <Text style={styles.text}>{safeHeight}</Text>

                            <Text style={styles.textBold}>Laser Mode:</Text>
                            <Text
                                style={[
                                    styles.text,
                                    mode
                                        ? styles.statusEnabled
                                        : styles.statusDisabled,
                                ]}
                            >
                                {mode ? 'Enabled' : 'Disabled'}
                            </Text>

                            <Text style={styles.textBold}>Rotary Mode:</Text>
                            <Text
                                style={[
                                    styles.text,
                                    isRotaryMode
                                        ? styles.statusEnabled
                                        : styles.statusDisabled,
                                ]}
                            >
                                {isRotaryMode ? 'Enabled' : 'Disabled'}
                            </Text>

                            {isRotaryMode && (
                                <>
                                    <Text style={styles.textBold}>
                                        Rotary Settings:
                                    </Text>
                                    <Text style={styles.textSmall}>
                                        Travel Resolution: Y={eeprom.$101}
                                        {'\n'}
                                        {grblInfo.type === GRBLHAL &&
                                            `A=${eeprom.$103}\n`}
                                        Max Rate: Y={eeprom.$111}
                                        {grblInfo.type === GRBLHAL &&
                                            `, A=${eeprom.$113}`}
                                    </Text>
                                </>
                            )}
                        </View>

                        <View style={styles.gridItemLast}>
                            <Text style={styles.textBold}>Jog Presets:</Text>

                            <Text style={styles.textBold}>Rapid:</Text>
                            <Text style={styles.text}>
                                XY Step:{' '}
                                {jogPresets.rapid?.xyStep
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.rapid.xyStep} mm`
                                        : `${(jogPresets.rapid.xyStep / 25.4).toFixed(3)} in`
                                    : 'N/A'}
                            </Text>
                            <Text style={styles.text}>
                                Z Step:{' '}
                                {jogPresets.rapid?.zStep
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.rapid.zStep} mm`
                                        : `${(jogPresets.rapid.zStep / 25.4).toFixed(3)} in`
                                    : 'N/A'}
                            </Text>
                            <Text style={styles.text}>
                                Feedrate:{' '}
                                {jogPresets.rapid?.feedrate
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.rapid.feedrate} mm/min`
                                        : `${(jogPresets.rapid.feedrate / 25.4).toFixed(1)} in/min`
                                    : 'N/A'}
                            </Text>
                            {jogPresets.rapid?.aStep && (
                                <Text style={styles.text}>
                                    A Step: {jogPresets.rapid.aStep}°
                                </Text>
                            )}

                            <Text style={styles.textBold}>Normal:</Text>
                            <Text style={styles.text}>
                                XY Step:{' '}
                                {jogPresets.normal?.xyStep
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.normal.xyStep} mm`
                                        : `${(jogPresets.normal.xyStep / 25.4).toFixed(3)} in`
                                    : 'N/A'}
                            </Text>
                            <Text style={styles.text}>
                                Z Step:{' '}
                                {jogPresets.normal?.zStep
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.normal.zStep} mm`
                                        : `${(jogPresets.normal.zStep / 25.4).toFixed(3)} in`
                                    : 'N/A'}
                            </Text>
                            <Text style={styles.text}>
                                Feedrate:{' '}
                                {jogPresets.normal?.feedrate
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.normal.feedrate} mm/min`
                                        : `${(jogPresets.normal.feedrate / 25.4).toFixed(1)} in/min`
                                    : 'N/A'}
                            </Text>
                            {jogPresets.normal?.aStep && (
                                <Text style={styles.text}>
                                    A Step: {jogPresets.normal.aStep}°
                                </Text>
                            )}

                            <Text style={styles.textBold}>Precise:</Text>
                            <Text style={styles.text}>
                                XY Step:{' '}
                                {jogPresets.precise?.xyStep
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.precise.xyStep} mm`
                                        : `${(jogPresets.precise.xyStep / 25.4).toFixed(3)} in`
                                    : 'N/A'}
                            </Text>
                            <Text style={styles.text}>
                                Z Step:{' '}
                                {jogPresets.precise?.zStep
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.precise.zStep} mm`
                                        : `${(jogPresets.precise.zStep / 25.4).toFixed(3)} in`
                                    : 'N/A'}
                            </Text>
                            <Text style={styles.text}>
                                Feedrate:{' '}
                                {jogPresets.precise?.feedrate
                                    ? workspaceUnits === 'mm'
                                        ? `${jogPresets.precise.feedrate} mm/min`
                                        : `${(jogPresets.precise.feedrate / 25.4).toFixed(1)} in/min`
                                    : 'N/A'}
                            </Text>
                            {jogPresets.precise?.aStep && (
                                <Text style={styles.text}>
                                    A Step: {jogPresets.precise.aStep}°
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.section} break>
                    <Text id="automations" style={styles.subtitle}>
                        Automations
                    </Text>

                    <Text style={styles.textBold}>File Start:</Text>
                    <Text
                        style={[
                            styles.text,
                            fileStart?.enabled
                                ? styles.statusEnabled
                                : styles.statusWarning,
                        ]}
                    >
                        {fileStart?.enabled ? 'Enabled' : 'Disabled'}
                    </Text>
                    {fileStart?.commands ? (
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeBlockText}>
                                {fileStart?.commands}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.text, styles.addBottomMargin]}>
                            {'N/A'}
                        </Text>
                    )}

                    <Text style={styles.textBold}>File Pause:</Text>
                    <Text
                        style={[
                            styles.text,
                            filePause?.enabled
                                ? styles.statusEnabled
                                : styles.statusWarning,
                        ]}
                    >
                        {filePause?.enabled ? 'Enabled' : 'Disabled'}
                    </Text>

                    {filePause?.commands ? (
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeBlockText}>
                                {filePause?.commands}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.text, styles.addBottomMargin]}>
                            {'N/A'}
                        </Text>
                    )}

                    <Text style={styles.textBold}>File Resume:</Text>
                    <Text
                        style={[
                            styles.text,
                            fileResume?.enabled
                                ? styles.statusEnabled
                                : styles.statusWarning,
                        ]}
                    >
                        {fileResume?.enabled ? 'Enabled' : 'Disabled'}
                    </Text>

                    {fileResume?.commands ? (
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeBlockText}>
                                {fileResume?.commands}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.text, styles.addBottomMargin]}>
                            {'N/A'}
                        </Text>
                    )}

                    <Text style={styles.textBold}>File Stop/End:</Text>
                    <Text
                        style={[
                            styles.text,
                            fileStop?.enabled
                                ? styles.statusEnabled
                                : styles.statusWarning,
                        ]}
                    >
                        {fileStop?.enabled ? 'Enabled' : 'Disabled'}
                    </Text>

                    {fileStop?.commands ? (
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeBlockText}>
                                {fileStop?.commands}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.text, styles.addBottomMargin]}>
                            {'N/A'}
                        </Text>
                    )}
                </View>

                <View style={styles.section} break>
                    <Text id="firmware" style={styles.subtitle}>
                        Firmware Settings
                    </Text>
                    <View style={styles.table}>
                        {/* TableHeader */}
                        <View style={styles.tableHeader}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCellHeader}>
                                    Setting
                                </Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCellHeader}>
                                    Current Value
                                </Text>
                            </View>
                            <View style={styles.tableColLast}>
                                <Text style={styles.tableCellHeader}>
                                    Default Value
                                </Text>
                            </View>
                        </View>
                        {/* TableContent */}
                        {createTableRows(eeprom, machineProfile, grblInfo.type)}
                    </View>
                </View>
                <View style={styles.section} break>
                    <Text id="alerts" style={styles.subtitle}>
                        Errors and Alarms
                    </Text>

                    <View style={styles.grid}>
                        <View style={styles.gridItem}>
                            <Text style={styles.textBold}>
                                All Alarms ({alarms.length})
                            </Text>
                            {alarms.length > 0 ? (
                                <View style={styles.container}>
                                    {alarms.map((log) => (
                                        <View
                                            style={[
                                                styles.alert,
                                                styles.alertError,
                                            ]}
                                            key={uniqueId()}
                                        >
                                            <Text style={styles.textSmall}>
                                                <Text style={styles.textBold}>
                                                    {new Date(
                                                        log.time,
                                                    ).toLocaleString()}
                                                </Text>
                                                {'\n' + log.MESSAGE}
                                                {'\nInput: ' + log.line}
                                                {'\nController: ' +
                                                    log.controller}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.text}>
                                    No alarms recorded
                                </Text>
                            )}
                        </View>

                        <View style={styles.gridItemLast}>
                            <Text style={styles.textBold}>
                                All Errors ({errors.length})
                            </Text>
                            {errors.length > 0 ? (
                                <View style={styles.container}>
                                    {errors.map((log) => (
                                        <View
                                            style={[
                                                styles.alert,
                                                styles.alertWarning,
                                            ]}
                                            key={uniqueId()}
                                        >
                                            <Text style={styles.textSmall}>
                                                <Text style={styles.textBold}>
                                                    {new Date(
                                                        log.time,
                                                    ).toLocaleString()}
                                                </Text>
                                                {'\n' + log.MESSAGE}
                                                {'\nInput: ' + log.line}
                                                {'\nController: ' +
                                                    log.controller}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.text}>
                                    No errors recorded
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text id="terminal" style={styles.subtitle}>
                        Terminal History
                    </Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.codeBlockText}>
                            {terminalHistory.length > 0
                                ? terminalHistory.join('\n') // Show last 20 commands
                                : 'No terminal history available'}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text id="gcode" style={styles.subtitle}>
                        G-Code File Status
                    </Text>
                    {fileInfo.fileLoaded && grblInfo.sender.status ? (
                        <View>
                            <Text style={styles.textBold}>
                                File Information
                            </Text>
                            <Text style={styles.text}>
                                Name: {grblInfo.sender.status.name}
                            </Text>
                            <Text style={styles.text}>
                                Total Lines: {grblInfo.sender.status.total}
                            </Text>
                            <Text style={styles.text}>
                                Lines Sent: {grblInfo.sender.status.sent}
                            </Text>
                            <Text style={styles.text}>
                                Remaining:{' '}
                                {grblInfo.sender.status.remainingTime}
                            </Text>
                            <Text style={styles.text}>
                                Progress:{' '}
                                <Text
                                    style={[
                                        Math.round(
                                            (grblInfo.sender.status.sent /
                                                grblInfo.sender.status.total) *
                                                100,
                                        ) === 100
                                            ? styles.statusEnabled
                                            : styles.statusWarning,
                                    ]}
                                >
                                    {Math.round(
                                        (grblInfo.sender.status.sent /
                                            grblInfo.sender.status.total) *
                                            100,
                                    )}
                                    % Complete
                                </Text>
                            </Text>

                            <Text style={styles.textBold}>
                                Full G-Code Content
                            </Text>
                            <View
                                id="g-code-file-content"
                                style={styles.codeBlock}
                            >
                                <Text style={styles.codeBlockText}>
                                    {gcode
                                        ? gcode.substring(0, 2000) +
                                          (gcode.length > 2000
                                              ? '\n\n... (truncated for file size)'
                                              : '')
                                        : 'No file content available'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.text}>
                            No G-code file loaded or no sender status available
                        </Text>
                    )}
                </View>
            </Page>
        </Document>
    );

    const submitDiagnosticForm = async () => {
        if (isGenerating) {
            return; // Prevent multiple simultaneous generations
        }

        setTimeout(async () => {
            setIsGenerating(true);
            setProgress('Preparing...');

            const delay = (ms = 100) =>
                new Promise((resolve) => setTimeout(resolve, ms));

            try {
                // Step 1: Generate PDF
                setProgress('Generating PDF...');
                await delay(100); // Allow UI to update
                const blob = await pdf(<SupportFile />).toBlob();

                // Step 2: Prepare file data
                setProgress('Collecting system data...');
                await delay(100);
                const date = new Date();
                const currentDate = date
                    .toLocaleDateString()
                    .replaceAll('/', '-');
                const currentTime = date
                    .toLocaleTimeString('it-IT')
                    .replaceAll(':', '-');

                // Step 3: Create EEPROM file
                setProgress('Exporting EEPROM settings...');
                await delay(100);
                const eepromSettings = getEEPROMValues();
                const output = JSON.stringify(eepromSettings, null, 1);
                const eepromBlob = new Blob([output], {
                    type: 'application/json',
                });
                const eepromFileName = `gSender-firmware-settings-${currentDate}-${currentTime}.json`;

                // Step 4: Get sender settings
                setProgress('Exporting application settings...');
                await delay(100);
                const senderSettings = await exportSenderSettings();

                // Step 5: Create ZIP
                setProgress('Creating ZIP archive...');
                await delay(100);
                const zip = new JSZip();
                const diagnosticPDFLabel = `diagnostics_${currentDate}_${currentTime}.pdf`;

                const code = getGCodeFile();
                if (code.length > 0) {
                    zip.file(getGCodeFileName(), new Blob([code]));
                }

                zip.file(diagnosticPDFLabel, blob);
                zip.file(eepromFileName, eepromBlob);
                zip.file(
                    `gSenderSettings_${currentDate}_${currentTime}.json`,
                    senderSettings,
                );

                // Step 6: Generate and download
                setProgress('Finalizing download...');
                await delay(100);
                const content = await zip.generateAsync({ type: 'blob' });

                saveAs(
                    content,
                    'diagnostics_' + currentDate + '_' + currentTime + '.zip',
                );

                setProgress('');
                toast.success('Diagnostic file downloaded successfully!');
            } catch (error) {
                console.error('Error generating diagnostic file:', error);
                toast.error('Failed to generate diagnostic file');
            } finally {
                setIsGenerating(false);
                setProgress('');
            }
        }, 0);
    };

    return (
        <Button
            icon={
                <PiFileZipFill className="text-gray-600 w-8 h-8 dark:text-gray-200" />
            }
            onClick={submitDiagnosticForm}
            size="lg"
            text={
                isGenerating
                    ? progress || 'Generating...'
                    : 'Download Diagnostic File'
            }
            disabled={isGenerating}
        />
    );
}

export default generateSupportFile;

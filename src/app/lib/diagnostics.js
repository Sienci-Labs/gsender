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
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { pdf, Page, View, Text, Document, StyleSheet } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import pkg from '../../package.json';
import { LASER_MODE } from '../constants';
import { getAllErrors } from '../containers/Preferences/Safety/helper';

const getEEPROMValues = () => {
    const eeprom = get(reduxStore.getState(), 'controller.settings.settings', {});
    return eeprom;
};

const getMachineProfile = () => {
    const machineProfile = store.get('workspace.machineProfile');
    return machineProfile;
};

const getGSenderVersion = () => {
    const version = `${pkg.version}`;
    return version;
};

const getGRBLInformation = () => {
    const grblInfo = get(reduxStore.getState(), 'controller', {});
    return grblInfo;
};

const getOS = () => {
    // let os = "unknown";
    const navApp = navigator.userAgent;
    const os = navApp.substring(navApp.indexOf('(') + 1, navApp.indexOf(')'));

    return os;
};

const getGCodeFile = () => {
    const gcode = get(reduxStore.getState(), 'file.content', '');
    return gcode;
};

const getMode = () => {
    const mode = store.get('widgets.spindle.mode');
    return mode === LASER_MODE;
};

const getConnection = () => {
    const connection = get(reduxStore.getState(), 'connection', '');
    return connection;
};

const getFileInfo = () => {
    const fileInfo = get(reduxStore.getState(), 'file', '');
    return fileInfo;
};

const getErrorsAndAlarms = () => {
    const logs = getAllErrors();
    return logs;
};

const generateSupportFile = () => {
    const eeprom = getEEPROMValues();
    const machineProfile = getMachineProfile();
    const version = getGSenderVersion();
    const grblInfo = getGRBLInformation();
    const os = getOS();
    const history = grblInfo.terminalHistory;
    const gcode = getGCodeFile();
    const mode = getMode();
    const connection = getConnection();
    const fileInfo = getFileInfo();
    const logs = getErrorsAndAlarms();
    console.log(logs);

    let eepromData = [];
    Object.entries(eeprom).forEach(entry => {
        const [key, value] = entry;
        eepromData.push({ key: key, value: value });
    });

    const SupportFile = () => (
        <Document>
            <Page style={styles.body}>
                <Text style={styles.title}>Diagnostics</Text>
                <Text style={styles.author}>gSender {version}</Text>
                <View style={styles.clearTable}>
                    <View style={styles.clearTableRow}>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'Environment\n'}
                                </Text>
                                <Text style={styles.textBold}>
                                    {'OS: '}
                                    <Text style={styles.text}>
                                        {os + '\n'}
                                    </Text>
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'Machine Profile\n'}
                                </Text>
                                {
                                    machineProfile ?
                                        <>
                                            <Text style={styles.textBold}>
                                                {'ID: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.id + '\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Company: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.company + '\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Name: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.name + '\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Type: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.type + '\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Version: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.version + '\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Limits:\n'}
                                                <Text style={styles.textItalic}>
                                                    {'    X Max: '}
                                                    <Text style={styles.text}>
                                                        {machineProfile.limits.xmax + '\n'}
                                                    </Text>
                                                    {'    Y Max: '}
                                                    <Text style={styles.text}>
                                                        {machineProfile.limits.ymax + '\n'}
                                                    </Text>
                                                    {'    Z Max: '}
                                                    <Text style={styles.text}>
                                                        {machineProfile.limits.zmax + '\n'}
                                                    </Text>
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Spindle/Laser: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.spindle + '\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Laser Mode Enabled: '}
                                                <Text style={styles.text}>
                                                    {mode + '\n'}
                                                </Text>
                                            </Text>
                                        </>
                                        :
                                        <Text style={styles.text}>
                                            {'NULL\n'}
                                        </Text>
                                }
                            </Text>
                        </View>
                    </View>
                    <View style={styles.clearTableRow}>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'Connection\n'}
                                </Text>
                                {
                                    connection ?
                                        <>
                                            <Text style={styles.textBold}>
                                                {'Available Ports:\n'}
                                                <Text style={styles.text}>
                                                    {
                                                        unwrapObject(connection.ports, 1)
                                                    }
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Connected Port: '}
                                                <Text style={styles.text}>
                                                    {connection.port + '\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Baudrate: '}
                                                <Text style={styles.text}>
                                                    {connection.baudrate ? connection.baudrate + '\n' : 'null\n'}
                                                </Text>
                                            </Text>
                                            <Text style={styles.textBold}>
                                                {'Unrecognized Ports:\n'}
                                                <Text style={styles.text}>
                                                    {
                                                        unwrapObject(connection.unrecognizedPorts, 1)
                                                    }
                                                </Text>
                                            </Text>
                                        </>
                                        :
                                        <Text style={styles.text}>
                                            {'NULL\n'}
                                        </Text>
                                }
                            </Text>
                        </View>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'GRBL Information\n'}
                                </Text>
                                <Text style={styles.textBold}>
                                    {'Type: '}
                                    <Text style={styles.text}>
                                        { grblInfo.type ? grblInfo.type + '\n' : 'NULL\n' }
                                    </Text>
                                </Text>
                                {
                                    !isEmpty(grblInfo.mpos) ?
                                        <Text style={styles.textBold}>
                                            {'MPos: \n'}
                                            <Text style={styles.textItalic}>
                                                {'    a: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.mpos.a + '\n'}
                                                </Text>
                                                {'    b: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.mpos.b + '\n'}
                                                </Text>
                                                {'    c: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.mpos.c + '\n'}
                                                </Text>
                                                {'    x: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.mpos.x + '\n'}
                                                </Text>
                                                {'    y: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.mpos.y + '\n'}
                                                </Text>
                                                {'    z: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.mpos.z + '\n'}
                                                </Text>
                                            </Text>
                                        </Text>
                                        :
                                        <Text style={styles.textBold}>
                                            {'MPos: '}
                                            <Text style={styles.text}>
                                                {'NULL\n'}
                                            </Text>
                                        </Text>
                                }
                                {
                                    !isEmpty(grblInfo.wpos) ?
                                        <Text style={styles.textBold}>
                                            {'WPos: \n'}
                                            <Text style={styles.textItalic}>
                                                {'    a: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.wpos.a + '\n'}
                                                </Text>
                                                {'    b: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.wpos.b + '\n'}
                                                </Text>
                                                {'    c: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.wpos.c + '\n'}
                                                </Text>
                                                {'    x: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.wpos.x + '\n'}
                                                </Text>
                                                {'    y: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.wpos.y + '\n'}
                                                </Text>
                                                {'    z: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.wpos.z + '\n'}
                                                </Text>
                                            </Text>
                                        </Text>
                                        :
                                        <Text style={styles.textBold}>
                                            {'WPos: '}
                                            <Text style={styles.text}>
                                                {'NULL\n'}
                                            </Text>
                                        </Text>
                                }
                                {
                                    grblInfo.sender.status ?
                                        <Text style={styles.textBold}>
                                            {'Sender Status: \n'}
                                            <Text style={styles.textItalic}>
                                                {'    Modal: \n'}
                                                <Text style={styles.text}>
                                                    {
                                                        grblInfo.sender.status.context ? unwrapObject(grblInfo.sender.status.context.modal, 2) : 'NULL\n'
                                                    }
                                                </Text>
                                                {'    Tool: '}
                                                <Text style={styles.text}>
                                                    {grblInfo.sender.status.context?.tool ? '        ' + grblInfo.sender.status.context.tool.toString() + '\n' : 'NULL\n'}
                                                </Text>
                                            </Text>
                                        </Text>
                                        :
                                        <Text style={styles.textBold}>
                                            {'Sender Status: '}
                                            <Text style={styles.text}>
                                                {'NULL\n'}
                                            </Text>
                                        </Text>
                                }
                                <Text style={styles.textBold}>
                                    {'Workflow State: '}
                                    <Text style={styles.text}>
                                        {grblInfo.workflow.state + '\n'}
                                    </Text>
                                </Text>
                                <Text style={styles.textBold}>
                                    {'Homing Flag: '}
                                    <Text style={styles.text}>
                                        {grblInfo.homingFlag + '\n'}
                                    </Text>
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.subtitle} break>
                    EEPROM Values
                </Text>
                {/* table from https://github.com/diegomura/react-pdf/issues/487#issuecomment-465513123 */}
                <View style={styles.table}>
                    {/* TableHeader */}
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                Setting
                            </Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                Value
                            </Text>
                        </View>
                    </View>
                    {/* TableContent */}
                    { createTableRows(eeprom) }
                </View>
                <Text style={styles.subtitle} break>
                    Recent Alarms
                </Text>
                <View style={styles.container}>
                    {
                        logs.length > 0 ?
                            logs.map((log, i) => {
                                if (log.toLowerCase().includes('alarm') && log.includes('[error] GRBL_ALARM:')) {
                                    const split = log.split('[error] GRBL_ALARM:');
                                    const time = split[0].slice(1, 20).replace(' ', ' at ');
                                    const msg = split[1];
                                    return (
                                        <View style={styles.lineWrapper} key={i}>
                                            <Text style={styles.text}>
                                                {time + '\n'}
                                                <Text style={[styles.error, { color: 'red' }]}>
                                                    {'    ' + msg + '\n'}
                                                </Text>
                                            </Text>
                                        </View>
                                    );
                                }
                                return null;
                            })
                            :
                            <Text style={styles.text}>
                                None
                            </Text>
                    }
                </View>
                <Text style={styles.subtitle}>
                    Recent Errors
                </Text>
                <View style={styles.container}>
                    {
                        logs.length > 0 ?
                            logs.map((log, i) => {
                                if (log.toLowerCase().includes('error') && log.includes('[error] GRBL_ERROR:')) {
                                    const split = log.split('[error] GRBL_ERROR:');
                                    const content = split[1].split('Line');

                                    const time = split[0].slice(1, 20).replace(' ', ' at ');
                                    const msg = content[0];
                                    const line = content[1].split('Origin')[0];
                                    return (
                                        <View style={styles.lineWrapper} key={i}>
                                            <Text style={styles.text}>
                                                {time + '\n'}
                                                <Text style={[styles.error, { color: 'red' }]}>
                                                    {'    ' + msg + '\n'}
                                                </Text>
                                                {'    On Line ' + line + '\n'}
                                            </Text>
                                        </View>
                                    );
                                }
                                return null;
                            })
                            :
                            <Text style={styles.text}>
                                None
                            </Text>
                    }
                </View>
                <Text style={styles.subtitle}>
                    Terminal History
                </Text>
                <View style={styles.container}>
                    <Text style={styles.text}>
                        {
                            history.length > 0 ?
                                history.map((value, i) => {
                                    return value + '\n';
                                })
                                :
                                'None'
                        }
                    </Text>
                </View>
                <Text style={styles.subtitle}>
                    GCode File
                </Text>
                {
                    fileInfo.fileLoaded && grblInfo.sender.status ?
                        <View style={styles.table}>
                            {/* TableHeader */}
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Status
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Value
                                    </Text>
                                </View>
                            </View>
                            {/* TableContent */}
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Name
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.name}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Sent
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.sent}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Received
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.remainingTime}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Total
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.total}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        :
                        <View style={styles.table}>
                            {/* TableHeader */}
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Status
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Value
                                    </Text>
                                </View>
                            </View>
                        </View>
                }
                <View style={styles.container}>
                    <Text style={styles.text}>
                        { gcode || 'No File Loaded' }
                    </Text>
                </View>
                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) => (
                        `${pageNumber} / ${totalPages}`
                    )}
                    fixed
                />
            </Page>
        </Document>
    );

    const styles = StyleSheet.create({
        body: {
            paddingTop: 35,
            paddingBottom: 65,
            paddingHorizontal: 35,
        },
        title: {
            fontSize: 24,
            textAlign: 'center',
            fontFamily: 'Helvetica-Bold'
        },
        author: {
            fontSize: 12,
            textAlign: 'center',
            marginBottom: 40,
            fontFamily: 'Helvetica'
        },
        container: {
            margin: 18,
            marginTop: 0,
            fontSize: 12,
        },
        subtitle: {
            fontSize: 18,
            margin: 12,
            textDecoration: 'underline',
            fontFamily: 'Helvetica-Bold'
        },
        lineWrapper: {
            marginTop: 6
        },
        textBold: {
            fontSize: 12,
            textAlign: 'justify',
            fontFamily: 'Helvetica-Bold',
        },
        text: {
            fontSize: 12,
            textAlign: 'justify',
            fontFamily: 'Helvetica'
        },
        textItalic: {
            fontSize: 12,
            textAlign: 'justify',
            fontFamily: 'Helvetica-Oblique'
        },
        image: {
            marginVertical: 15,
            marginHorizontal: 100,
        },
        header: {
            fontSize: 12,
            marginBottom: 20,
            textAlign: 'center',
            color: 'grey',
        },
        pageNumber: {
            position: 'absolute',
            fontSize: 12,
            bottom: 30,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'grey',
        },

        // table styles from https://github.com/diegomura/react-pdf/issues/487#issuecomment-465513123
        table: {
            display: 'table',
            width: '280px',
            margin: 12,
            marginTop: 6,
            borderStyle: 'solid',
            borderLeftWidth: 1,
            borderTopWidth: 1,
        },
        tableRow: {
            // margin: 'auto',
            flexDirection: 'row'
        },
        tableCol: {
            width: '50%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0
        },
        tableCell: {
            margin: 'auto',
            marginTop: 5,
            fontSize: 10
        },

        clearTable: {
            display: 'table',
            width: '100%',
            margin: 12,
        },
        clearTableRow: {
            marginBottom: 12,
            flexDirection: 'row'
        },
        clearTableCol: {
            width: '50%',
        },
        clearTableCell: {
            marginRight: 'auto',
            marginTop: 12,
            fontSize: 10
        }
    });

    const unwrapObject = (obj, iteration) => {
        let tabs = '';
        for (let i = 0; i < iteration; i++) {
            tabs += '    '; // non break spaces to indent
        }
        if (isEmpty(obj)) {
            return tabs + 'NULL\n';
        }
        // .join('') is used to solve an issue where unwanted commas appeared: https://stackoverflow.com/a/45812277
        return (
            Object.keys(obj).map((key, i) => (
                typeof obj[key] === 'object'
                    ? tabs + key + ': \n' + unwrapObject(obj[key], iteration + 1)
                    : tabs + key + ': ' + obj[key] + '\n'
            )).join('')
        );
    };

    const createTableRows = (array) => {
        return (
            Object.keys(array).map((key, i) => (
                // from https://github.com/diegomura/react-pdf/issues/487#issuecomment-465513123
                <View style={styles.tableRow} key={i}>
                    <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                            {key}
                        </Text>
                    </View>
                    <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                            {array[key]}
                        </Text>
                    </View>
                </View>
            ))
        );
    };

    const submitForm = async (event) => {
        event.preventDefault(); // prevent page reload
        const blob = await pdf(<SupportFile />).toBlob();
        const date = new Date();
        const currentDate = date.toLocaleDateString().replaceAll('/', '-');
        const currentTime = date.toLocaleTimeString('it-IT').replaceAll(':', '-');

        saveAs(blob, 'diagnostics_' + currentDate + '_' + currentTime + '.pdf');
    };

    return (
        <FunctionButton primary onClick={submitForm}>Download Now!</FunctionButton>
    );
};

export default generateSupportFile;

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
import { GRBL_ALARMS } from 'server/controllers/Grbl/constants';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import styles from './workflow-control.styl';

const getCodeDescription = (code = 1) => {
    const alarm = GRBL_ALARMS.find(alarm => alarm.code === code);
    if (alarm) {
        return alarm.description;
    }
    return 'Invalid alarm code - no matching description found';
};

const AlarmDescriptionIcon = ({ code = 1 }) => {
    const alarmDescription = getCodeDescription(code);
    return (
        <Tooltip content={alarmDescription} placement="bottom">
            <div className={styles.alarmDescriptionButton}>
                <i className="fa fa-question" />
            </div>
        </Tooltip>
    );
};

export default AlarmDescriptionIcon;

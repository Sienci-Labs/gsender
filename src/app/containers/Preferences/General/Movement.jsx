/*
 * Copyright (C) 2022 Sienci Labs Inc.
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

import Tooltip from 'app/components/TooltipCustom/ToolTip';

import Input from '../components/Input';
import Fieldset from '../components/Fieldset';

const Movement = ({ state, actions }) => {
    const { units, safeRetractHeight } = state;

    return (
        <Fieldset legend="Movement">
            <Tooltip content="Amount Z-Axis will move before making any X/Y-Axis movements" location="default">
                <Input
                    label="Safe Height"
                    units={units}
                    value={safeRetractHeight}
                    onChange={(e) => actions.general.setSafeRetractHeight(e)}
                    additionalProps={{ name: 'safeRetractHeight', type: 'number' }}
                />
            </Tooltip>
        </Fieldset>
    );
};

export default Movement;

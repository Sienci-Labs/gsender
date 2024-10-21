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
import { Tooltip as TooltipCustom } from 'app/components/Tooltip';
import Select from 'react-select';
import Input from '../../components/Input';
import styles from '../../index.module.styl';
import { DRILL, END_MILL } from '../../../../lib/constants';

const AddTool = ({ actions, state }) => {
    const { tool } = state;
    const toolActions = actions.tool;

    return (
        <div>
            <TooltipCustom
                content="Specify the diameter of your custom Metric tool"
                location="default"
            >
                <Input
                    label="Metric Diameter"
                    units="mm"
                    value={tool.metricDiameter}
                    onChange={toolActions.setMetricDiameter}
                    additionalProps={{
                        id: 'metricDiameter',
                        type: 'number',
                        step: '0.1',
                    }}
                />
            </TooltipCustom>
            <TooltipCustom
                content="Specify the diameter of your custom Imperial tool"
                location="default"
            >
                <Input
                    label="Imperial Diameter"
                    units="in"
                    additionalProps={{
                        id: 'imperialDiameter',
                        type: 'number',
                        step: '0.1',
                    }}
                    value={tool.imperialDiameter}
                    onChange={toolActions.setImperialDiameter}
                />
            </TooltipCustom>
            <div className={styles.inputSpread}>
                <label htmlFor="touchplateType">Touchplate Type</label>
                <Select
                    options={[
                        { label: END_MILL, value: END_MILL },
                        { label: DRILL, value: DRILL },
                    ]}
                    placeholder="Select Type"
                    value={{ label: tool.type, value: tool.type }}
                    onChange={toolActions.setToolType}
                />
            </div>
            <TooltipCustom
                content="Add your new custom tool to the list"
                location="default"
            >
                <button
                    className={styles.addTool}
                    type="button"
                    onClick={toolActions.addTool}
                    disabled={
                        tool.imperialDiameter === 0 || tool.metricDiameter === 0
                    }
                >
                    Add Tool
                </button>
            </TooltipCustom>
        </div>
    );
};

export default AddTool;

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

import includes from 'lodash/includes';
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { DragDropContext } from 'react-beautiful-dnd';

import DroppableColumn from './DroppableColumn';

import {
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED
} from '../../constants';

import styles from './index.styl';

const Container = ({ columns, children }) => {
    const arr = new Array(columns).fill(columns);
    const gridTemplateColumns = arr.reduce((acc) => acc + ' 1fr', '');

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns,
                overflowY: 'auto',
                position: 'absolute',
                height: '100%'
            }}
        >
            {children}
        </div>
    );
};

const Macro = ({ state, actions, workflow }) => {
    const { macros = [] } = state;

    const [columns, setColumns] = useState({
        column1: { items: [] },
        column2: { items: [] },
    });

    const setRowIndices = macros => {
        for (let i = 0; i < macros.length; i++) {
            macros[i].rowIndex = i;
        }
        return macros;
    };

    useEffect(() => {
        const computedColumns = [computeColumn('column1'), computeColumn('column2')];

        setColumns({
            column1: { items: computedColumns[0] },
            column2: { items: computedColumns[1] },
        });
    }, [macros]);

    useEffect(() => {
        const combined = [...columns?.column1?.items, ...columns?.column2?.items];
        actions.updateMacros(combined);
    }, [columns]);

    const canRunMacro = () => {
        const {
            canClick,
        } = state;

        return canClick && includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflow.state);
    };

    // https://codesandbox.io/s/i0ex5?file=/src/App.js
    const onDragEnd = (result, columns, setColumns) => {
        const { source, destination } = result;
        if (!destination) {
            return;
        }

        //Check if we are trying to move the macro into a different column
        if (source.droppableId !== destination.droppableId) {
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [popped] = sourceItems.splice(source.index, 1);

            // Update the macro column and row index properties so they can be saved
            // within the API call and can be sorted properly when the user closes and opens the program again
            popped.column = destination.droppableId;

            destItems.splice(destination.index, 0, popped);

            setRowIndices(sourceItems);
            setRowIndices(destItems);

            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...sourceColumn,
                    items: sourceItems
                },
                [destination.droppableId]: {
                    ...destColumn,
                    items: destItems
                }
            });
        } else {
            const column = columns[source.droppableId];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);
            setRowIndices(copiedItems);
            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...column,
                    items: copiedItems
                }
            });
        }
    };

    // Set rowIndices after sorting to correct any invalid saved data, normally it should be a no-op
    const computeColumn = (columnName) => setRowIndices(macros.filter(macro => macro.column === columnName).sort((a, b) => a.rowIndex - b.rowIndex));

    const disabled = !canRunMacro();
    const { column1, column2 } = columns;

    return (
        <>
            {
                macros.length === 0
                    ? <div className={styles['macro-container']}><div className={styles.emptyResult}>No Macros...</div></div>
                    : (
                        <div style={{ position: 'absolute', height: '75%', width: '100%' }}>
                            <DragDropContext onDragEnd={result => onDragEnd(result, columns, setColumns)}>
                                <Container columns={2}>
                                    <DroppableColumn
                                        droppableId="column1"
                                        macros={column1.items}
                                        actions={actions}
                                        disabled={disabled}
                                    />
                                    <DroppableColumn
                                        droppableId="column2"
                                        macros={column2.items}
                                        actions={actions}
                                        disabled={disabled}
                                    />
                                </Container>
                            </DragDropContext>
                        </div>
                    )
            }
        </>
    );
};

export default connect((store) => {
    const workflow = get(store, 'controller.workflow');
    return {
        workflow
    };
})(Macro);

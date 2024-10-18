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
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

import DroppableColumn from './DroppableColumn';

import { WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED } from '../../constants';

interface ContainerProps {
    columns: number;
    children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ columns, children }) => {
    const arr = new Array(columns).fill(columns);
    const gridTemplateColumns = arr.reduce((acc) => acc + ' 1fr', '');

    return (
        <div
            className="grid overflow-y-auto absolute h-full w-full gap-1"
            style={{ gridTemplateColumns }}
        >
            {children}
        </div>
    );
};

interface MacroItem {
    id: string;
    name: string;
    description: string;
    column: string;
    rowIndex: number;
}

interface MacroState {
    macros: MacroItem[];
    canClick: boolean;
}

interface MacroActions {
    updateMacros: (macros: MacroItem[]) => void;
}

interface MacroProps {
    state: MacroState;
    actions: MacroActions;
    workflow: {
        state: string;
    };
}

interface ColumnState {
    items: MacroItem[];
}

interface ColumnsState {
    column1: ColumnState;
    column2: ColumnState;
}

const Macro: React.FC<MacroProps> = ({ state, actions, workflow }) => {
    const { macros = [] } = state;

    const [columns, setColumns] = useState<ColumnsState>({
        column1: { items: [] },
        column2: { items: [] },
    });

    const setRowIndices = (macros: MacroItem[]): MacroItem[] => {
        return macros.map((macro, index) => ({
            ...macro,
            rowIndex: index,
        }));
    };

    useEffect(() => {
        const computedColumns = [
            computeColumn('column1'),
            computeColumn('column2'),
        ];

        setColumns({
            column1: { items: computedColumns[0] },
            column2: { items: computedColumns[1] },
        });
    }, [macros]);

    useEffect(() => {
        const combined = [...columns.column1.items, ...columns.column2.items];
        actions.updateMacros(combined);
    }, [columns]);

    const canRunMacro = (): boolean => {
        const { canClick } = state;

        return (
            canClick &&
            includes(
                [WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED],
                workflow.state,
            )
        );
    };

    // https://codesandbox.io/s/i0ex5?file=/src/App.js
    const onDragEnd = (
        result: DropResult,
        columns: ColumnsState,
        setColumns: React.Dispatch<React.SetStateAction<ColumnsState>>,
    ): void => {
        const { source, destination } = result;
        if (!destination) {
            return;
        }

        //Check if we are trying to move the macro into a different column
        if (source.droppableId !== destination.droppableId) {
            const sourceColumn =
                columns[source.droppableId as keyof ColumnsState];
            const destColumn =
                columns[destination.droppableId as keyof ColumnsState];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [popped] = sourceItems.splice(source.index, 1);

            // Update the macro column and row index properties so they can be saved
            // within the API call and can be sorted properly when the user closes and opens the program again
            popped.column = destination.droppableId;

            destItems.splice(destination.index, 0, popped);

            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...sourceColumn,
                    items: setRowIndices(sourceItems),
                },
                [destination.droppableId]: {
                    ...destColumn,
                    items: setRowIndices(destItems),
                },
            });
        } else {
            const column = columns[source.droppableId as keyof ColumnsState];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...column,
                    items: setRowIndices(copiedItems),
                },
            });
        }
    };

    // Set rowIndices after sorting to correct any invalid saved data, normally it should be a no-op
    const computeColumn = (columnName: string): MacroItem[] =>
        setRowIndices(
            macros
                .filter((macro) => macro.column === columnName)
                .sort((a, b) => a.rowIndex - b.rowIndex),
        );

    const disabled = !canRunMacro();
    const { column1, column2 } = columns;

    return (
        <>
            {macros.length === 0 ? (
                <div className="grid gap-1 p-1 h-full">
                    <div className="w-full flex justify-center items-center">
                        No Macros...
                    </div>
                </div>
            ) : (
                <DragDropContext
                    onDragEnd={(result) =>
                        onDragEnd(result, columns, setColumns)
                    }
                >
                    <Container columns={2}>
                        <DroppableColumn
                            droppableId="column1"
                            macros={column1.items}
                            actions={actions as any}
                            disabled={disabled}
                        />
                        <DroppableColumn
                            droppableId="column2"
                            macros={column2.items}
                            actions={actions as any}
                            disabled={disabled}
                        />
                    </Container>
                </DragDropContext>
            )}
        </>
    );
};

export default connect((store: any) => {
    const workflow = get(store, 'controller.workflow');
    return {
        workflow,
    };
})(Macro);

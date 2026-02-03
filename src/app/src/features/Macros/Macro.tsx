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

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import includes from 'lodash/includes';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED } from '../../constants';
import DroppableColumn, { Actions } from './DroppableColumn';

type ContainerProps = {
    columns: number;
    children: React.ReactNode;
};

const Container = ({ columns, children }: ContainerProps) => {
    const arr = new Array(columns).fill(columns);
    const gridTemplateColumns = arr.reduce((acc) => acc + ' 1fr', '');

    return (
        <div className="grid grid-cols-[1fr_1fr] absolute h-full w-full gap-1">
            {children}
        </div>
    );
};

type MacroItem = {
    id: string;
    name: string;
    description: string;
    column: string;
    rowIndex: number;
};

type MacroState = {
    macros: MacroItem[];
    canClick: boolean;
};

type MacroActions = {
    updateMacros: (macros: MacroItem[]) => void;
    runMacro: (id: string, options: { name: string }) => void;
    openEditMacroModal: (id: string) => void;
    deleteMacro: (id: string) => void;
};

type MacroProps = {
    state: MacroState;
    actions: MacroActions;
    workflow: {
        state: string;
    };
};

type ColumnState = {
    items: MacroItem[];
};

type ColumnsState = {
    column1: ColumnState;
    column2: ColumnState;
};

const Macro = ({ state, actions, workflow }: MacroProps) => {
    const { macros = [] } = state;
    const [activeId, setActiveId] = useState<string | null>(null);
    const [columns, setColumns] = useState<ColumnsState>({
        column1: { items: [] },
        column2: { items: [] },
    });

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
    );

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

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeColumn = active.data.current?.column;
        const overColumn = over.data.current?.column;

        if (activeColumn !== overColumn) {
            // Moving between columns
            const sourceColumn = columns[activeColumn as keyof ColumnsState];
            const destColumn = columns[overColumn as keyof ColumnsState];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [movedItem] = sourceItems.splice(
                sourceItems.findIndex((item) => item.id === active.id),
                1,
            );

            movedItem.column = overColumn as string;
            destItems.splice(
                destItems.findIndex((item) => item.id === over.id),
                0,
                movedItem,
            );

            setColumns({
                ...columns,
                [activeColumn]: {
                    ...sourceColumn,
                    items: setRowIndices(sourceItems),
                },
                [overColumn]: {
                    ...destColumn,
                    items: setRowIndices(destItems),
                },
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeColumn = active.data.current?.column;
        const overColumn = over.data.current?.column;

        if (activeColumn === overColumn) {
            // Moving within the same column
            const column = columns[activeColumn as keyof ColumnsState];
            const oldIndex = column.items.findIndex(
                (item) => item.id === active.id,
            );
            const newIndex = column.items.findIndex(
                (item) => item.id === over.id,
            );

            setColumns({
                ...columns,
                [activeColumn]: {
                    ...column,
                    items: setRowIndices(
                        arrayMove(column.items, oldIndex, newIndex),
                    ),
                },
            });
        }

        setActiveId(null);
    };

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
                <div className="flex gap-1 p-1 h-full">
                    <div className="w-full flex justify-center items-center dark:text-white">
                        No Macros...
                    </div>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <Container columns={2}>
                        <SortableContext
                            items={column1.items.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <DroppableColumn
                                droppableId="column1"
                                macros={column1.items}
                                actions={actions as unknown as Actions}
                                disabled={disabled}
                            />
                        </SortableContext>
                        <SortableContext
                            items={column2.items.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <DroppableColumn
                                droppableId="column2"
                                macros={column2.items}
                                actions={actions as unknown as Actions}
                                disabled={disabled}
                            />
                        </SortableContext>
                    </Container>
                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-white border border-gray-200 rounded-md shadow-lg p-2 dark:bg-dark dark:border-dark-lighter dark:text-white">
                                {
                                    [...column1.items, ...column2.items].find(
                                        (item) => item.id === activeId,
                                    )?.name
                                }
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
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

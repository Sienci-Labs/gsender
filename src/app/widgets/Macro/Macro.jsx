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

import PropTypes from 'prop-types';
import includes from 'lodash/includes';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TooltipCustom from 'app/components/TooltipCustom/ToolTip';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import {
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED
} from '../../constants';

import MacroItem from './MacroItem';
import styles from './index.styl';

class Macro extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        workflow: PropTypes.object,
    };

    canRunMacro = () => {
        const {
            canClick,
        } = this.props.state;
        const { workflow } = this.props;

        return canClick && includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflow.state);
    }

    handleRunMacro = (macro) => {
        if (!this.canRunMacro()) {
            return;
        }

        const { actions } = this.props;
        const { id, name } = macro;
        actions.runMacro(id, { name });
    };

    handleEditMacro = (macro) => (event) => {
        const { actions } = this.props;
        actions.openEditMacroModal(macro.id);
    };

    handleDeleteMacro = (macroID) => {
        const { actions } = this.props;
        actions.deleteMacro(macroID);
    }

    onDeleteClick = ({ name, id }) => {
        Confirm({
            title: 'Delete Macro',
            content: (
                <>
                    <p>Are you sure you want to delete this macro?</p>
                    <p><strong>{name}</strong></p>
                </>
            ),
            confirmLabel: 'Delete',
            onConfirm: () => this.handleDeleteMacro(id),
        });
    }

    onDragEnd = ({ source, destination, draggableId }) => {
        if (!destination || !draggableId) {
            return;
        }

        const { actions, state } = this.props;
        const { macros } = state;
        const macro = macros.find(macro => macro.id === draggableId);
        if (!macro) {
            return;
        }

        let filtered;

        //If we are moving the macro in the same column, we only need to update it and
        //all the other macros in that column and disregard the ones in the second column
        if (source.droppableId === destination.droppableId) {
            filtered = macros
                .sort((a, b) => a.rowIndex - b.rowIndex)
                .filter(currentMacro => currentMacro.column === macro.column)
                .filter(currentMacro => currentMacro.id !== macro.id);
        } else {
            filtered = macros
                .sort((a, b) => a.rowIndex - b.rowIndex);

            console.log(filtered);

            filtered = macros.filter(currentMacro => currentMacro.id !== macro.id);
        }

        filtered.splice(destination.index, 0, { ...macro, column: destination.droppableId, rowIndex: destination.index });

        //Re-index the macros to match their position in the array
        const newArr = filtered.map((currentMacro, i) => ({ ...currentMacro, rowIndex: i }));

        actions.updateMacros(newArr);
    }

    render() {
        const { state } = this.props;
        const {
            macros = []
        } = state;

        const computeColumn = ({ columnName }) => {
            return macros
                .filter(macro => macro.column === columnName)
                .sort((a, b) => a.rowIndex - b.rowIndex);
        };

        const [column1, column2] = [computeColumn({ columnName: 'column1' }), computeColumn({ columnName: 'column2' })];

        const disabled = !this.canRunMacro();

        // return (
        //     <div className={styles['macro-container']}>
        //         {macros.length === 0 && (
        //             <div className={styles.emptyResult}>
        //                 {i18n._('No macros...')}<br />
        //             </div>
        //         )}

        //         {ensureArray(macros).map((macro) => (
        //             <div key={macro.id}>
        //                 <MacroItem
        //                     key={macro.id}
        //                     macro={macro}
        //                     onRun={this.handleRunMacro}
        //                     onEdit={this.handleEditMacro}
        //                     onDelete={this.handleDeleteMacro}
        //                     disabled={disabled}
        //                 />
        //             </div>
        //         ))}
        //     </div>
        // );
        const getListStyle = isDraggingOver => ({
            // background: isDraggingOver ? 'lightblue' : 'lightgrey',
            padding: 8,
            width: '100%',
            display: 'grid',
            gridAutoRows: 'min-content',
            gap: 5,
        });

        const Container = ({ columns, children }) => {
            const arr = new Array(columns).fill(columns);
            const gridTemplateColumns = arr.reduce((acc) => acc + ' 1fr', '');

            return (
                <div style={{ display: 'grid', gridTemplateColumns, overflowY: 'auto' }}>
                    {children}
                </div>
            );
        };

        const DroppableColumn = ({ droppableId, macros }) => {
            return (
                <Droppable droppableId={droppableId}>
                    {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}
                        >
                            {macros.map((macro, index) => (
                                <Draggable key={macro.id} draggableId={macro.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            {
                                                macro.description
                                                    ? (
                                                        <TooltipCustom content={macro.description} location="default">
                                                            <MacroItem
                                                                key={macro.id}
                                                                macro={macro}
                                                                onRun={this.handleRunMacro}
                                                                onEdit={this.handleEditMacro}
                                                                onDelete={() => this.onDeleteClick({ name: macro.name, id: macro.id })}
                                                                disabled={disabled}
                                                            />
                                                        </TooltipCustom>
                                                    )
                                                    : (
                                                        <MacroItem
                                                            key={macro.id}
                                                            macro={macro}
                                                            onRun={this.handleRunMacro}
                                                            onEdit={this.handleEditMacro}
                                                            onDelete={() => this.onDeleteClick({ name: macro.name, id: macro.id })}
                                                            disabled={disabled}
                                                        />
                                                    )
                                            }
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            );
        };

        return macros.length === 0
            ? <div className={styles['macro-container']}><div className={styles.emptyResult}>No Macros...</div></div>
            : (
                <DragDropContext onDragEnd={this.onDragEnd}>
                    <Container columns={2}>
                        <DroppableColumn droppableId="column1" macros={column1} />
                        <DroppableColumn droppableId="column2" macros={column2} />
                    </Container>
                </DragDropContext>
            );
    }
}

export default connect((store) => {
    const workflow = get(store, 'controller.workflow');
    return {
        workflow
    };
})(Macro);

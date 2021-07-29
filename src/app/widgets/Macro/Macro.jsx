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

import ensureArray from 'ensure-array';
import PropTypes from 'prop-types';
import includes from 'lodash/includes';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import i18n from 'app/lib/i18n';
import {
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED
} from '../../constants';

import MacroItem from './MacroItem';
import styles from './index.styl';

class Macro extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
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

        const disabled = !this.canRunMacro();

        return (
            <div className={styles['macro-container']}>
                {macros.length === 0 && (
                    <div className={styles.emptyResult}>
                        {i18n._('No macros...')}<br />
                    </div>
                )}
                {ensureArray(macros).map((macro) => (
                    <MacroItem
                        key={macro.id}
                        macro={macro}
                        onRun={this.handleRunMacro}
                        onEdit={this.handleEditMacro}
                        onDelete={this.handleDeleteMacro}
                        disabled={disabled}
                    />
                ))}
            </div>
        );
    }
}

export default connect((store) => {
    const workflow = get(store, 'controller.workflow');
    return {
        workflow
    };
})(Macro);

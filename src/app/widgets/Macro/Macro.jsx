import ensureArray from 'ensure-array';
import PropTypes from 'prop-types';
import includes from 'lodash/includes';
import React, { PureComponent } from 'react';
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
            workflow,
        } = this.props.state;

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

    handleDeleteMacro = (macroID) => (event) => {
        const { actions } = this.props;
        actions.deleteMacro(macroID);
    }

    render() {
        const { state, actions } = this.props;
        const {
            macros = []
        } = state;

        return (
            <div className={styles['macro-container']}>
                <button
                    type="button"
                    className={styles['add-macro-button']}
                    title="Add Macro"
                    onClick={actions.openAddMacroModal}
                >
                    <i className="fas fa-plus" />
                </button>
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
                    />
                ))}
            </div>
        );
    }
}

export default Macro;

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
import { get } from 'lodash';
import reduxStore from 'app/store/redux';
import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import { useWizardAPI } from 'app/components/Wizard/context';
import StepButton from 'app/components/Wizard/components/StepButton';
import styles from '../index.styl';

const Controls = () => {
    const { completeSubStep, decrementStep, scrollToActiveStep, hasIncompleteActions, updateSubstepOverlay } = useWizardAPI();

    const isNotIdle = () => {
        const state = reduxStore.getState();
        const activeState = get(state, 'controller.state.status.activeState', '');
        return activeState !== GRBL_ACTIVE_STATE_IDLE;
    };

    return (
        <div className={styles.controls}>
            <StepButton
                inverted
                onClick={() => {
                    const activeValues = decrementStep();
                    updateSubstepOverlay(activeValues);
                    scrollToActiveStep(activeValues);
                }}
            >
                <i className="fas fa-arrow-left" />
                Back
            </StepButton>
            <StepButton
                onClick={() => {
                    const activeValues = completeSubStep();
                    updateSubstepOverlay(activeValues);
                    scrollToActiveStep(activeValues);
                }}
                disabled={hasIncompleteActions() || isNotIdle()}
            >
                Complete
                <i className="fas fa-arrow-right" />
            </StepButton>
        </div>
    );
};

export default Controls;

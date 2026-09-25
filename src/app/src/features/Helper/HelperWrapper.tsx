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

import { useWizardAPI } from 'app/features/Helper/context';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import store from 'app/store';
import reduxStore, { type RootState } from 'app/store/redux';
import {
    disableInfoHelper,
    enableInfoHelper,
    enableWizard,
} from 'app/store/redux/slices/helper.slice.ts';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import { useEffect, useRef, useState } from 'react';
import HelperInfo from './HelperInfo';
import {
    getDismissStoreKey,
    normalizeHelperMessage,
} from './messages/normalize';
import { KIND_META } from './messages/styles';
import type { HelperPayload, NormalizedHelperMessage } from './messages/types';
import Wizard from './Wizard';

const normalizeWithControllerState = (payload: HelperPayload) => {
    const state = reduxStore.getState();
    return normalizeHelperMessage(payload, {
        controllerType: get(state, 'controller.type'),
        controllerAlarms: get(state, 'controller.settings.alarms'),
        isDismissed: (key) => Boolean(store.get(getDismissStoreKey(key))),
    });
};

const HelperWrapper = () => {
    const { load, updateSubstepOverlay } = useWizardAPI();
    const [infoMessage, setInfoMessage] =
        useState<NormalizedHelperMessage | null>(null);
    const currentRef = useRef<NormalizedHelperMessage | null>(null);
    // Lower-severity messages that arrived while another was open
    const queueRef = useRef<NormalizedHelperMessage[]>([]);
    const infoHelperMinimized = useTypedSelector(
        (state: RootState) => state.helper.infoHelperMinimized,
    );

    const showMessage = (message: NormalizedHelperMessage | null) => {
        currentRef.current = message;
        setInfoMessage(message);
    };

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('wizard:load', (_, payload) => {
                const { instructions, title, context, comment } = payload;
                load(instructions, title, { context, comment });
                updateSubstepOverlay(
                    { activeStep: 0, activeSubstep: 0 },
                    instructions.steps,
                );
                reduxStore.dispatch(enableWizard());
            }),
            pubsub.subscribe('helper:info', (_, payload: HelperPayload) => {
                const message = normalizeWithControllerState(payload);
                if (!message) {
                    return;
                }
                const current = currentRef.current;
                if (
                    current &&
                    KIND_META[message.kind].rank < KIND_META[current.kind].rank
                ) {
                    queueRef.current.push(message);
                    return;
                }
                showMessage(message);
                reduxStore.dispatch(enableInfoHelper());
            }),
        ];

        return () => {
            tokens.forEach((token) => {
                pubsub.unsubscribe(token);
            });
        };
    }, []);

    const closeInfoHelper = () => {
        const next = queueRef.current.shift();
        if (next) {
            showMessage(next);
            return;
        }
        showMessage(null);
        reduxStore.dispatch(disableInfoHelper());
    };

    return (
        <>
            <HelperInfo
                payload={infoMessage}
                infoVisible={Boolean(infoMessage) && !infoHelperMinimized}
                onClose={closeInfoHelper}
            />
            <Wizard />
        </>
    );
};

export default HelperWrapper;

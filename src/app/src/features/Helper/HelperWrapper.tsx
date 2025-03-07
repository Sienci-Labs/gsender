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

import { useEffect, useState } from 'react';
import pubsub from 'pubsub-js';
import { useWizardAPI } from 'app/features/Helper/context';
import reduxStore from 'app/store/redux';
import {
    disableInfoHelper,
    enableInfoHelper,
    enableWizard,
} from 'app/store/redux/slices/helper.slice.ts';
import Wizard from './Wizard';
import HelperInfo from './HelperInfo';

const HelperWrapper = () => {
    const { load, updateSubstepOverlay } = useWizardAPI();
    const [infoPayload, setInfoPayload] = useState({});
    const [infoVisible, setInfoVisible] = useState(false);

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('wizard:load', (_, payload) => {
                const { instructions, title } = payload;
                load(instructions, title);
                updateSubstepOverlay(
                    { activeStep: 0, activeSubstep: 0 },
                    instructions.steps,
                );
                reduxStore.dispatch(enableWizard());
            }),
            pubsub.subscribe('helper:info', (_, payload) => {
                setInfoPayload(payload);
                setInfoVisible(true);
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
        setInfoVisible(false);
        reduxStore.dispatch(disableInfoHelper());
    };

    return (
        <>
            <HelperInfo
                payload={infoPayload}
                infoVisible={infoVisible}
                onClose={closeInfoHelper}
            />
            <Wizard />
        </>
    );
};

export default HelperWrapper;

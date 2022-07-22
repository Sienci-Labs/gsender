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

import { UPDATE_FILE_INFO, UPDATE_FILE_PROCESSING } from 'app/actions/fileInfoActions';
import reduxStore from 'app/store/redux';
import pubsub from 'pubsub-js';

export const estimateResponseHandler = ({ data }) => {
    const reduxPayload = {
        ...data,
        fileProcessing: false
    };
    reduxStore.dispatch({
        type: UPDATE_FILE_INFO,
        payload: reduxPayload
    });
    reduxStore.dispatch({
        type: UPDATE_FILE_PROCESSING,
        payload: {
            value: false
        }
    });

    pubsub.publish('file:loaded');
};

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

import React from 'react';
import { Button } from 'app/components/Buttons';
import ModalTemplate from 'app/components/ModalTemplate';
import controller from 'app/lib/controller';
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';


const attemptReconnect = (forcedReload = true) => {
    controller.reconnect();
};

const ServerDisconnected = (props) => (
    <Modal
        size="xs"
        disableOverlay={true}
        showCloseButton={false}
    >
        <Modal.Body>
            <ModalTemplate type="error">
                <h5>{i18n._('Server Connection Lost')}</h5>
                <p>{i18n._('It looks like the server connection has been lost - attempt to reconnect?')}</p>
            </ModalTemplate>
        </Modal.Body>
        <Modal.Footer>
            <Button
                btnStyle="primary"
                onClick={attemptReconnect}
            >
                {i18n._('Attempt Reconnect')}
            </Button>
        </Modal.Footer>
    </Modal>
);

export default ServerDisconnected;

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
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';

const reloadPage = (forcedReload = true) => {
    // Reload the current page, without using the cache
    window.location.reload(forcedReload);
};

const ServerDisconnected = (props) => (
    <Modal
        size="xs"
        disableOverlay={true}
        showCloseButton={false}
    >
        <Modal.Body>
            <ModalTemplate type="error">
                <h5>{i18n._('Server has stopped working')}</h5>
                <p>{i18n._('A problem caused the server to stop working correctly. Check out the server status and try again.')}</p>
            </ModalTemplate>
        </Modal.Body>
        <Modal.Footer>
            <Button
                btnStyle="primary"
                onClick={reloadPage}
            >
                {i18n._('Reload')}
            </Button>
        </Modal.Footer>
    </Modal>
);

export default ServerDisconnected;

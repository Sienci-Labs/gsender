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

import pubsub from 'pubsub-js';
import { ReactNode } from 'react';

export const DIALOG_CONFIRM = 'confirm';
export const DIALOG_CANCEL = 'cancel';
export const DIALOG_INVERT = 'invert';

interface ConfirmOptions {
    title?: string;
    buttons?: string[];
    content?: ReactNode;
    onClose?: () => void;
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    hideClose?: boolean;
    show?: boolean;
}

export const Confirm = (options: ConfirmOptions = {}): void => {
    const {
        title = 'Confirm',
        buttons = [],
        content = 'Are you sure you want to do this?',
        onClose = null,
        onConfirm = null,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        show = true,
        hideClose = false,
    } = options;

    pubsub.publish('dialog:new', {
        title,
        buttons,
        content,
        onClose,
        onConfirm,
        confirmLabel,
        cancelLabel,
        hideClose,
        show,
    });
};

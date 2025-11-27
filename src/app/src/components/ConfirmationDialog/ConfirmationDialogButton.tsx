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
import cx from 'classnames';

import { DIALOG_CANCEL, DIALOG_CONFIRM } from './ConfirmationDialogLib';

interface ConfirmationDialogButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    variant?: typeof DIALOG_CONFIRM | typeof DIALOG_CANCEL;
}

const ConfirmationDialogButton: React.FC<ConfirmationDialogButtonProps> = ({
    children,
    onClick,
    variant = DIALOG_CONFIRM,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                'py-2 px-4 text-base rounded-lg bg-none border-none outline-none transition-all duration-150',
                {
                    ['bg-blue-600 text-white hover:bg-blue-700']:
                        variant === DIALOG_CONFIRM,
                    ['bg-white text-red-600 border border-red-600 hover:bg-red-300 hover:text-white']:
                        variant === DIALOG_CANCEL,
                },
            )}
        >
            {children}
        </button>
    );
};

export default ConfirmationDialogButton;

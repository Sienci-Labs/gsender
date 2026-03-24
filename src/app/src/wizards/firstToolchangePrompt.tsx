/*
 * Copyright (C) 2026 Sienci Labs Inc.
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
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

interface FirstToolchangePromptOptions {
    comment: string;
}

/**
 * Show a prompt for the first automatic toolchange, allowing the user to skip
 * the routine if they already have the correct tool installed.
 * @returns A promise that resolves if confirmed, rejects if closed
 */
export const showFirstToolchangePrompt = ({
    comment,
}: FirstToolchangePromptOptions): Promise<boolean> => {
    return new Promise((resolve) => {
        const promptContent = (
            <div>
                <p>
                    A toolchange command was detected at the start of your file.
                </p>
                <p>
                    If you already have the correct tool installed, you can skip
                    the toolchange routine. Otherwise, run the routine to probe
                    and set up your initial tool.
                </p>
                {comment && (
                    <p>
                        Comment: <b>{comment}</b>
                    </p>
                )}
            </div>
        );

        Confirm({
            title: 'First Tool Change Detected',
            content: promptContent,
            confirmLabel: 'Run Toolchange Routine',
            cancelLabel: 'Skip & Continue',
            onConfirm: () => resolve(true),
            onClose: () => resolve(false),
        });
    });
};

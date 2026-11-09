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
import { i18n } from 'app/i18n';

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
                    {i18n.t(
                        'notifications:toolchange.firstToolchange.detected',
                    )}
                </p>
                <p>
                    {i18n.t('notifications:toolchange.firstToolchange.content')}
                </p>
                {comment && (
                    <p>
                        {i18n.t('notifications:controller.commentLabel')}{' '}
                        <b>{comment}</b>
                    </p>
                )}
            </div>
        );

        Confirm({
            title: i18n.t('notifications:toolchange.firstToolchange.title'),
            content: promptContent,
            confirmLabel: i18n.t(
                'notifications:toolchange.firstToolchange.confirm',
            ),
            cancelLabel: i18n.t(
                'notifications:toolchange.firstToolchange.cancel',
            ),
            onConfirm: () => resolve(true),
            onClose: () => resolve(false),
        });
    });
};

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
import { useState, useEffect, ReactNode } from 'react';
import pubsub from 'pubsub-js';
import cx from 'classnames';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { Button } from 'app/components/Button';
import ConfirmationDialogButton from './ConfirmationDialogButton';
import { DIALOG_CONFIRM, DIALOG_CANCEL } from './ConfirmationDialogLib';

import styles from './index.module.styl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from 'app/components/shadcn/AlertDialog.tsx';

interface DialogOptions {
    title: string;
    content: ReactNode;
    onClose?: () => void;
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    hideClose?: boolean;
    show: boolean;
}

const ConfirmationDialog = () => {
    const [show, setShow] = useState<boolean>(false);
    const [title, setTitle] = useState<string | null>(null);
    const [content, setContent] = useState<ReactNode | null>(null);
    const [onClose, setOnClose] = useState<(() => void) | null>(null);
    const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
    const [confirmLabel, setConfirmLabel] = useState<string | null>(null);
    const [cancelLabel, setCancelLabel] = useState<string | null>(null);
    const [hideClose, setHideClose] = useState(false);

    let hideModal = !show;

    useEffect(() => {
        hideModal = !show;
    }, [show]);

    useEffect(() => {
        const token = pubsub.subscribe(
            'dialog:new',
            (_: string, options: DialogOptions) => {
                setTitle(options.title);
                setContent(options.content);
                setOnClose(() => options.onClose);
                setOnConfirm(() => options.onConfirm);
                setConfirmLabel(options.confirmLabel || null);
                setCancelLabel(options.cancelLabel || null);
                setHideClose(options.hideClose || false);
                setShow(options.show);
            },
        );

        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    return (
        <AlertDialog open={show}>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{content}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {!hideClose && (
                        <AlertDialogCancel
                            onClick={() => {
                                if (onClose !== null) {
                                    onClose();
                                }
                                setShow(false);
                            }}
                        >
                            {cancelLabel}
                        </AlertDialogCancel>
                    )}

                    <AlertDialogAction
                        onClick={() => {
                            if (onConfirm !== null) {
                                onConfirm();
                            }
                            setShow(false);
                        }}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
    /*return (
        <div
            className={cx(styles.confirmationDialogWrapper, {
                [styles.hidden]: hideModal,
            })}
        >
            <div className={styles.confirmationDialog}>
                <div className={styles.confirmationBar} />
                <div className={styles.confirmationDialogTitle}>
                    <FaExclamationTriangle />
                    <span>{title}</span>
                </div>
                <div className={styles.confirmationDialogContent}>
                    {content}
                </div>
                <div className={styles.confirmationDialogButtons}>
                    {cancelLabel && (
                        <ConfirmationDialogButton
                            onClick={() => {
                                if (onClose !== null) {
                                    onClose();
                                }
                                setShow(false);
                            }}
                            variant={DIALOG_CANCEL}
                        >
                            {cancelLabel}
                        </ConfirmationDialogButton>
                    )}

                    {confirmLabel && (
                        <ConfirmationDialogButton
                            onClick={() => {
                                if (onConfirm !== null) {
                                    onConfirm();
                                }
                                setShow(false);
                            }}
                            variant={DIALOG_CONFIRM}
                        >
                            {confirmLabel}
                        </ConfirmationDialogButton>
                    )}
                </div>
            </div>
        </div>
    );*/
};

export default ConfirmationDialog;

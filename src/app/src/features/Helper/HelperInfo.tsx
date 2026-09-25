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

import * as DialogPrimitive from '@radix-ui/react-dialog';
import Button from 'app/components/Button';
import {
    Dialog,
    DialogOverlay,
    DialogPortal,
} from 'app/components/shadcn/Dialog';
import { Checkbox } from 'app/components/shadcn/Checkbox';
import { useFocusTrapping } from 'app/lib/focus-trapping';
import store from 'app/store';
import cx from 'classnames';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ChecklistBlock } from './components/message/ChecklistBlock';
import { MessageHeader } from './components/message/MessageHeader';
import { ProgressBlock } from './components/message/ProgressBlock';
import { ResourceBlock } from './components/message/ResourceBlock';
import { StepsList } from './components/message/StepsList';
import { getDismissStoreKey } from './messages/normalize';
import { KIND_META, neutral } from './messages/styles';
import type {
    HelperAction,
    HelperWeight,
    NormalizedHelperMessage,
} from './messages/types';

interface Props {
    payload: NormalizedHelperMessage | null;
    infoVisible: boolean;
    onClose: () => void;
}

const WIDTH: Record<HelperWeight, string> = {
    full: 'max-w-[780px] portrait:max-w-[660px]',
    compact: 'max-w-[600px]',
    minimal: 'max-w-[460px]',
};

// Order in which the dialog picks its initially focused control
const FOCUS_ORDER = ['guide', 'primary', 'dismiss', 'close'];

// Matches the shadcn DialogContent open/close animation
const CONTENT_ANIMATION =
    'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]';

const FOOTER_BUTTON = 'min-h-11 px-6 text-base font-bold';

function Summary({ children, className }: { children: ReactNode; className: string }) {
    return (
        <DialogPrimitive.Description asChild>
            <div className={cx(neutral.body, className)}>{children}</div>
        </DialogPrimitive.Description>
    );
}

// Plain-string content gets the inner panel; components bring their own styling
function ContentSlot({ content }: { content: ReactNode }) {
    if (content === null || content === undefined || content === false) {
        return null;
    }
    if (typeof content === 'string') {
        return (
            <div
                className={cx(
                    'rounded-lg border px-4 py-3 text-sm',
                    neutral.panel,
                    neutral.body,
                )}
            >
                {content}
            </div>
        );
    }
    return <>{content}</>;
}

const HelperInfo = ({ payload, infoVisible, onClose }: Props) => {
    const focusTrapping = useFocusTrapping();
    const contentRef = useRef<HTMLDivElement>(null);
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [dontRemind, setDontRemind] = useState(false);

    // Checklist and "don't remind" reset whenever the dialog opens
    useEffect(() => {
        if (infoVisible) {
            setChecked({});
            setDontRemind(false);
        }
    }, [payload, infoVisible]);

    if (!payload) {
        return null;
    }

    const { kind, weight, resource, checklist, dismissKey } = payload;
    const { critical } = KIND_META[kind];
    const checklistComplete =
        !checklist || checklist.every((item) => checked[item.id]);

    const dismissPermanently = () => {
        if (dismissKey) {
            store.set(getDismissStoreKey(dismissKey), true);
        }
    };

    const close = () => {
        if (dontRemind) {
            dismissPermanently();
        }
        onClose();
    };

    const runAction = (action?: HelperAction) => {
        if (action?.onClick?.() === false) {
            return;
        }
        close();
    };

    const handleOpenAutoFocus = (e: Event) => {
        e.preventDefault();
        if (!focusTrapping || !contentRef.current) {
            return;
        }
        for (const target of FOCUS_ORDER) {
            const candidates = contentRef.current.querySelectorAll<HTMLElement>(
                `[data-helper-focus="${target}"]:not([disabled])`,
            );
            // Skip copies hidden by the landscape/portrait variants
            const visible = Array.from(candidates).find(
                (el) => el.getClientRects().length > 0,
            );
            if (visible) {
                visible.focus();
                return;
            }
        }
    };

    // Alarm/error stay up on a stray tap near the machine; Esc/X/Dismiss still close
    const blockOutside = critical
        ? (e: Event) => e.preventDefault()
        : undefined;

    const primaryButton = payload.primaryAction && (
        <Button
            variant="primary"
            size="custom"
            className={FOOTER_BUTTON}
            data-helper-focus="primary"
            disabled={!checklistComplete}
            onClick={() => runAction(payload.primaryAction)}
        >
            {payload.primaryAction.label}
        </Button>
    );

    const renderFull = () => (
        <>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div
                    className={cx('grid gap-7', {
                        'landscape:grid-cols-[minmax(0,1fr)_236px]': resource,
                    })}
                >
                    <div className="flex min-w-0 flex-col gap-5">
                        <Summary className="text-base leading-relaxed">
                            {payload.description}
                        </Summary>
                        {payload.steps && payload.steps.length > 0 && (
                            <StepsList steps={payload.steps} />
                        )}
                        <ContentSlot content={payload.content} />
                        {resource && (
                            <ResourceBlock
                                resource={resource}
                                variant="row"
                                className="landscape:hidden"
                            />
                        )}
                        {(payload.secondaryAction ||
                            payload.primaryAction) && (
                            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                                {payload.secondaryAction && (
                                    <Button
                                        variant="secondary"
                                        size="custom"
                                        className={FOOTER_BUTTON}
                                        onClick={() =>
                                            runAction(payload.secondaryAction)
                                        }
                                    >
                                        {payload.secondaryAction.label}
                                    </Button>
                                )}
                                {primaryButton}
                            </div>
                        )}
                    </div>
                    {resource && (
                        <ResourceBlock
                            resource={resource}
                            variant="column"
                            className="portrait:hidden"
                        />
                    )}
                </div>
            </div>
        </>
    );

    const renderCompact = () => (
        <>
            <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pb-5 pl-[76px] pr-[22px]">
                <Summary className="text-[15px] leading-relaxed">
                    {payload.description}
                </Summary>
                {checklist && (
                    <ChecklistBlock
                        kind={kind}
                        items={checklist}
                        checked={checked}
                        onChange={(id, value) =>
                            setChecked((prev) => ({ ...prev, [id]: value }))
                        }
                    />
                )}
                {payload.progress && (
                    <ProgressBlock kind={kind} progress={payload.progress} />
                )}
                <ContentSlot content={payload.content} />
                {resource && (
                    <ResourceBlock resource={resource} variant="inline" />
                )}
            </div>
            <div
                className={cx(
                    'flex shrink-0 flex-wrap items-center gap-3 border-t px-[22px] py-3',
                    neutral.divider,
                )}
            >
                {payload.tertiaryAction && (
                    <button
                        type="button"
                        className={cx(
                            'min-h-11 bg-transparent text-base',
                            neutral.link,
                        )}
                        onClick={() => runAction(payload.tertiaryAction)}
                    >
                        {payload.tertiaryAction.label}
                    </button>
                )}
                {!payload.tertiaryAction && dismissKey && (
                    <label
                        className={cx(
                            'flex min-h-11 cursor-pointer items-center gap-3 text-base',
                            neutral.body,
                        )}
                    >
                        <Checkbox
                            className="h-5 w-5"
                            checked={dontRemind}
                            onCheckedChange={(value) =>
                                setDontRemind(value === true)
                            }
                        />
                        Don’t remind me again
                    </label>
                )}
                <div className="flex-1" />
                <Button
                    variant="secondary"
                    size="custom"
                    className={FOOTER_BUTTON}
                    data-helper-focus="dismiss"
                    onClick={() => runAction(payload.secondaryAction)}
                >
                    {payload.secondaryAction?.label ??
                        (payload.primaryAction ? 'Cancel' : 'Dismiss')}
                </Button>
                {primaryButton}
            </div>
        </>
    );

    const renderMinimal = () => {
        // A dismissable minimal message offers "Don't show tips" in place of
        // a secondary action
        let secondary: HelperAction | undefined = payload.secondaryAction;
        if (!secondary && dismissKey) {
            secondary = {
                label:
                    kind === 'tip'
                        ? 'Don’t show tips'
                        : 'Don’t remind me again',
                onClick: dismissPermanently,
            };
        }
        return (
            <>
                <div className="min-h-0 flex-1 overflow-y-auto pb-[18px] pl-[76px] pr-[22px]">
                    <Summary className="text-[15px] leading-relaxed">
                        {payload.description}
                    </Summary>
                    <ContentSlot content={payload.content} />
                </div>
                <div className="flex shrink-0 items-center gap-3 pb-[18px] pl-[70px] pr-[22px]">
                    {secondary && (
                        <Button
                            variant="ghost"
                            size="custom"
                            className="min-h-11 px-2.5 text-base"
                            data-helper-focus="dismiss"
                            onClick={() => runAction(secondary)}
                        >
                            {secondary.label}
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                        variant="primary"
                        size="custom"
                        className={FOOTER_BUTTON}
                        data-helper-focus="primary"
                        onClick={() => runAction(payload.primaryAction)}
                    >
                        {payload.primaryAction?.label ?? 'Got it'}
                    </Button>
                </div>
            </>
        );
    };

    return (
        <Dialog
            open={infoVisible}
            onOpenChange={(open) => {
                if (!open) {
                    close();
                }
            }}
        >
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    ref={contentRef}
                    role={critical ? 'alertdialog' : 'dialog'}
                    onOpenAutoFocus={handleOpenAutoFocus}
                    onCloseAutoFocus={
                        focusTrapping ? undefined : (e) => e.preventDefault()
                    }
                    onPointerDownOutside={blockOutside}
                    onInteractOutside={blockOutside}
                    className={cx(
                        'fixed left-[50%] top-[50%] z-[9999] flex max-h-[calc(100vh-48px)] w-[calc(100vw-48px)] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-lg border text-sm shadow-lg',
                        CONTENT_ANIMATION,
                        neutral.surface,
                        neutral.divider,
                        WIDTH[weight],
                    )}
                >
                    <MessageHeader message={payload} />
                    {weight === 'full' && renderFull()}
                    {weight === 'compact' && renderCompact()}
                    {weight === 'minimal' && renderMinimal()}
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
};

export default HelperInfo;

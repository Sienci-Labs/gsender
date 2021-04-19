import pubsub from 'pubsub-js';

export const DIALOG_CONFIRM = 'confirm';
export const DIALOG_CANCEL = 'cancel';
export const DIALOG_INVERT = 'invert';

export const Confirm = (options = {}) => {
    const {
        title = 'Confirm',
        buttons = [],
        content = 'Are you sure you want to do this?',
        onClose = null,
        onConfirm = null,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel'
    } = options;
    pubsub.publish('dialog:new', {
        title: title,
        buttons: buttons,
        content: content,
        onClose: onClose,
        onConfirm: onConfirm,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel
    });
};

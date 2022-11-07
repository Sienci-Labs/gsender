import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import styles from './index.styl';

const ProfileItem = ({ title, icon, id, onClick, onDelete }) => {
    const handleDelete = (e) => {
        e.stopPropagation(); //Prevents bubbling that will fire the parent div's onclick first

        Confirm({
            content: 'Are you sure you want to delete this gamepad profile?',
            title: 'Delete Gamepad Profile',
            onConfirm: () => onDelete(id)
        });
    };

    return (
        <div
            tabIndex={-1}
            role="button"
            onClick={() => onClick(id)}
            onKeyDown={null}
            className={styles.profileItem}
        >
            <i className={classnames(icon, styles.profileItemIcon)} />
            <div className={styles.profileItemTitle}>{title}</div>

            <i
                tabIndex={-1}
                role="button"
                onClick={handleDelete}
                onKeyDown={null}
                className={classnames('fas fa-times', styles.profileItemDelete)}
            />
        </div>
    );
};
ProfileItem.propTypes = {
    title: PropTypes.string,
    icon: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    active: PropTypes.bool,
    onClick: PropTypes.func,
    onDelete: PropTypes.func,
    showActiveStatus: PropTypes.bool,
    showDeleteButton: PropTypes.bool,
};

export default ProfileItem;

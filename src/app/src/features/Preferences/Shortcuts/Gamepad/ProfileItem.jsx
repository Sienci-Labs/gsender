import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import {
    Toaster,
    TOASTER_SUCCESS,
    TOASTER_SHORT,
} from 'app/lib/toaster/ToasterLib';

import styles from '../index.module.styl';
import { GamepadContext } from './utils/context';
import {
    removeGamepadProfileFromList,
    setCurrentGamepadProfile,
} from './utils/actions';
import { toast } from 'app/lib/toaster';

const ProfileItem = ({ title, icon, id }) => {
    const { dispatch } = useContext(GamepadContext);

    const deleteProfile = (profileID) => {
        dispatch(removeGamepadProfileFromList(profileID));
        toast.info('Removed Gamepad Profile');
    };

    const handleDelete = (e, ommitId) => {
        e.stopPropagation(); //Prevents bubbling that will fire the parent div's onclick first

        Confirm({
            content: 'Are you sure you want to delete this gamepad profile?',
            title: 'Delete Gamepad Profile',
            onConfirm: () => deleteProfile(ommitId),
        });
    };

    const setCurrentProfile = (profileID) => {
        dispatch(setCurrentGamepadProfile(profileID));
    };

    return (
        <div
            tabIndex={-1}
            role="button"
            onClick={() => setCurrentProfile(id)}
            onKeyDown={null}
            className={styles.profileItem}
        >
            <i className={classnames(icon, styles.profileItemIcon)} />

            <div className={styles.profileItemTitle}>{title}</div>

            <i
                tabIndex={-1}
                role="button"
                onClick={(event) => handleDelete(event, id)}
                onKeyDown={null}
                className={classnames('fas fa-times', styles.profileItemDelete)}
            />
        </div>
    );
};
ProfileItem.propTypes = {
    title: PropTypes.string,
    icon: PropTypes.string,
    id: PropTypes.array,
};

export default ProfileItem;

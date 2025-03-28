import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FaGamepad, FaTimes } from 'react-icons/fa';

import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { toast } from 'app/lib/toaster';
import ToolCard from 'app/components/ToolCard';

import { GamepadContext } from './utils/context';
import {
    removeGamepadProfileFromList,
    setCurrentGamepadProfile,
} from './utils/actions';

const ProfileItem = ({ title, icon, id }) => {
    const { dispatch } = useContext(GamepadContext);

    const handleDelete = (e) => {
        e.stopPropagation(); //Prevents bubbling that will fire the parent div's onclick first

        Confirm({
            content: 'Are you sure you want to delete this gamepad profile?',
            title: 'Delete Gamepad Profile',
            onConfirm: () => deleteProfile(id),
        });
    };

    const deleteProfile = (id) => {
        dispatch(removeGamepadProfileFromList(id));
        toast.info('Removed Gamepad Profile');
    };

    const setCurrentProfile = (profileID) => {
        dispatch(setCurrentGamepadProfile(profileID));
    };

    return (
        <div className="relative">
            <ToolCard
                title={title}
                icon={FaGamepad}
                onClick={() => setCurrentProfile(id)}
            />
            <FaTimes
                tabIndex={-1}
                role="button"
                onClick={(e) => handleDelete(e)}
                onKeyDown={null}
                className="text-red-500 cursor-pointer hover:text-red-700 absolute top-2 right-2 z-10"
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

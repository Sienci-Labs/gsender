import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import ToolCard from 'app/components/ToolCard';
import { i18n } from 'app/i18n';
import { toast } from 'app/lib/toaster';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { FaGamepad, FaTimes } from 'react-icons/fa';
import {
    removeGamepadProfileFromList,
    setCurrentGamepadProfile,
} from './utils/actions';
import { GamepadContext } from './utils/context';

const ProfileItem = ({ title, icon, id }) => {
    const { dispatch } = useContext(GamepadContext);

    const handleDelete = (e) => {
        e.stopPropagation(); //Prevents bubbling that will fire the parent div's onclick first

        Confirm({
            content: i18n.t('notifications:gamepad.deleteProfile.content'),
            title: i18n.t('notifications:gamepad.deleteProfile.title'),
            onConfirm: () => deleteProfile(id),
        });
    };

    const deleteProfile = (id) => {
        dispatch(removeGamepadProfileFromList(id));
        toast.info(i18n.t('notifications:gamepad.profileRemoved'), {
            position: 'bottom-right',
        });
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
                tabIndex={0}
                role="button"
                onClick={(e) => handleDelete(e)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDelete(e);
                    }
                }}
                aria-label={`Delete gamepad profile ${title}`}
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

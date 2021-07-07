import React, { useState } from 'react';
import classnames from 'classnames';

import styles from './index.styl';
import ProfileItem from './ProfileItem';
import MainTable from './MainTable';
import ProfileShortcutModal from './ProfileShortcutModal';

const Profile = ({ currentProfile }) => {
    const { profileName, icon, shortcuts } = currentProfile;

    const [currentShortcut, setCurrentShortcut] = useState(null);
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div style={{ overflowY: 'clip' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 11fr', alignItems: 'center', margin: '0 0 1rem' }}>
                    <i className={classnames(icon, styles.profileItemIcon)} /> <div style={{ fontSize: '1.5rem' }}>{profileName}</div>
                </div>
                <div style={{ overflowY: 'auto', height: '90%', backgroundColor: 'white' }}>
                    <MainTable
                        onEdit={(shortcut) => {
                            setShowModal(true);
                            setCurrentShortcut(shortcut);
                        }}
                        onDelete={() => console.log('Deleting...')}
                        onShortcutToggle={() => console.log('Shortcut Toggle...')}
                        data={shortcuts}
                    />
                </div>
            </div>

            {showModal && (
                <ProfileShortcutModal
                    profile={currentProfile}
                    shortcut={currentShortcut}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export { Profile, ProfileItem };

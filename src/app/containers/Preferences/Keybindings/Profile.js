import React from 'react';

import classnames from 'classnames';

import styles from './index.styl';
import ProfileItem from './ProfileItem';
import MainTable from './MainTable';

const Profile = ({ currentProfile, active, onClick, onDelete, shortcut }) => {
    const { profileName, icon, shortcuts } = currentProfile;

    return (
        <div style={{ overflowY: 'clip' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 11fr', alignItems: 'center', margin: '0 0 1rem' }}>
                <i className={classnames(icon, styles.profileItemIcon)} /> <div style={{ fontSize: '1.5rem' }}>{profileName}</div>
            </div>
            <div style={{ overflowY: 'auto', height: '100%' }}>
                <MainTable
                    onEdit={() => console.log('Editing...')}
                    onDelete={() => console.log('Deleting...')}
                    onShortcutToggle={() => console.log('Shortcut Toggle...')}
                    data={shortcuts}
                />
            </div>
        </div>
    );
};

export { Profile, ProfileItem };

import React from 'react';

// import PropTypes from 'prop-types';
import classnames from 'classnames';

import Table from 'app/components/Table';

import styles from './index.styl';

import ProfileItem from './ProfileItem';

const Profile = ({ currentProfile, active, onClick, onDelete, shortcut }) => {
    const { title, icon, id, data } = currentProfile;

    const columns = [
        { dataIndex: 'id', title: 'ID', sortable: true, key: 'id', width: '10%' },
        { dataIndex: 'name', title: 'Name', sortable: true, key: 'name', width: '40%', },
        { dataIndex: 'action', title: 'Action', key: 'action', width: '40%', },
        { dataIndex: 'active', title: 'Active', key: 'active', width: '10%', },
    ];

    return (
        <div style={{ overflowY: 'auto' }}>
            <h3 style={{ margin: '1rem 0 2rem' }}>
                <i className={classnames(icon, styles.profileItemIcon)} /> {title}{' '}
                <small>(ID: {id})</small>
            </h3>
            <Table
                bordered
                rowKey="id"
                columns={columns}
                data={data}
                emptyText={() => 'No Actions for This Profile'}
            />
        </div>
    );
};

export { Profile, ProfileItem };

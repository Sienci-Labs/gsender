import React from 'react';

import PropTypes from 'prop-types';
import classnames from 'classnames';

import Table from 'app/components/Table';

import styles from './index.styl';

const ProfileItem = ({ title, icon, id, active, onClick, onDelete }) => {
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

            <i className={classnames('fas fa-circle', styles.profileItemStatus)} />

            <i
                tabIndex={-1}
                role="button"
                onClick={(e) => {
                    e.stopPropagation(); //Prevents bubbling that will fire the parent div's onclick first
                    onDelete(id);
                }}
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
};

const Profile = ({ title, icon, id, active, onClick, onDelete, shortcut }) => {
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
                data={[
                    { id: 0, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 1, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 2, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 3, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 4, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 5, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 6, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 7, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 8, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 9, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 10, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 11, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 12, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 13, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 14, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 15, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 16, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 17, name: 'X+', action: 'Start Job', active: 'Yes' },
                    { id: 18, name: 'X+', action: 'Start Job', active: 'Yes' },
                ]}
                emptyText={() => 'No Actions for This Profile'}
            />
        </div>
    );
};

export { Profile, ProfileItem };

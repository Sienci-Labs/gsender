/*
 * Copyright (C) 2021 Sienci Labs Inc.
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

import React, { useEffect, useMemo, useState } from 'react';
import {
    sortingFns,
} from '@tanstack/react-table';
import Icon from '@mdi/react';
import { mdiAlert, mdiPencil, mdiCheckOutline } from '@mdi/js';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import EditArea from './EditArea';
import styles from '../index.styl';
import { SortableTable } from '../../../components/SortableTable';
import maintenanceActions from './lib/maintenanceApiActions';

const determineTime = (task) => {
    const { rangeStart, rangeEnd, currentTime } = task;
    if (currentTime < rangeStart) {
        return rangeStart - Math.floor(currentTime);
    } else if (currentTime >= rangeStart && currentTime <= rangeEnd) {
        return 'Due';
    } else {
        return <div><Icon path={mdiAlert} size={1} />{' Urgent!'}</div>;
    }
};

const Maintenance = () => {
    const [tasks, setTasks] = useState([]);
    const [data, setData] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(0);

    const updateData = () => {
        maintenanceActions.fetch(setTasks).then((tasks) => {
            let formattedTasks = [];
            tasks.forEach(task => {
                const formattedTask = {
                    id: task.id,
                    part: task.name,
                    time: determineTime(task),
                    edit: '',
                    subRow: task.description
                };
                formattedTasks.push(formattedTask);
            });
            setData(formattedTasks);
        });
    };

    const updateTasks = (updatedTasks) => {
        maintenanceActions.update(updatedTasks).then((res) => {
            updateData();
        });
    };

    const replaceTask = (newTask) => {
        const updatedTasks = tasks.map((obj) => {
            if (obj.id === newTask.id) {
                return newTask;
            }
            return obj;
        });
        updateTasks(updatedTasks);
    };

    useEffect(() => {
        console.log('api call');
        updateData();
    }, []);

    const onClear = (id) => {
        Confirm({
            title: 'Reset Maintenance Timer',
            content: 'Are you sure you want to reset the maintenance timer for ' + tasks.find((obj) => obj.id === id).name + '? Only do this if you have just performed this maintenance task.',
            confirmLabel: 'Yes',
            onConfirm: () => {
                const updatedTasks = tasks.map((obj) => {
                    if (obj.id === id) {
                        let newObj = obj;
                        newObj.currentTime = 0;
                        return newObj;
                    }
                    return obj;
                });
                updateTasks(updatedTasks);
            }
        });
    };

    const onEdit = (id) => {
        const selectedTask = tasks.find((obj) => obj.id === id);
        setCurrentTask(selectedTask);
        setShowEditModal(true);
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: 'part',
                header: () => 'Part',
                enableSorting: false,
            },
            {
                accessorKey: 'time',
                header: () => 'Time Until Next Maintenance',
                cell: (info) => {
                    if (Number(info.renderValue())) {
                        return <div style={{ color: 'green' }}>{info.renderValue() + ' Hours'}</div>;
                    } else if (info.renderValue() === 'Due') {
                        return <span style={{ color: '#E15C00', fontStyle: 'bold' }}>{info.renderValue()}</span>;
                    } else {
                        return <div style={{ color: 'red' }}>{info.renderValue()}</div>;
                    }
                },
                minSize: 90,
                maxSize: 90,
                invertSorting: true,
                filterFn: 'fuzzy',
                sortingFn: sortingFns.alphanumeric
            },
            {
                accessorKey: 'edit',
                header: () => '',
                cell: (info) => {
                    return (
                        <div className={styles.iconContainer}>
                            <Icon path={mdiCheckOutline} size={1.5} color="green" onClick={() => onClear(info.cell.row.original.id)} />
                            <Icon path={mdiPencil} size={1.5} onClick={() => onEdit(info.cell.row.original.id)} />
                        </div>
                    );
                },
                disableColSpan: true,
                enableSorting: false,
                minSize: 15,
                maxSize: 15,
            }
        ]
    );
    const sortBy = [
        {
            id: 'time',
            desc: true
        }
    ];

    return (
        <div>
            <div className={[styles.addMargin].join(' ')}>
                <SortableTable data={data} columns={columns} enableSortingRemoval={false} sortBy={sortBy} />
            </div>
            { showEditModal && (
                <EditArea
                    task={currentTask}
                    update={replaceTask}
                    closeModal={() => setShowEditModal(false)}
                />
            ) }
        </div>
    );
};

export default Maintenance;

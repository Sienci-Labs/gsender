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
import SortableTable from 'app/components/SortableTable/SortableTable';
import EditArea from './EditArea';
import AddArea from './AddArea';
import styles from '../index.styl';
import maintenanceActions from './lib/maintenanceApiActions';
import { collectUserUsageData } from '../../../lib/heatmap';
import { USAGE_TOOL_NAME } from '../../../constants';

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
    const [formattedData, setFormattedData] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
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
                    description: task.description
                };
                formattedTasks.push(formattedTask);
            });
            setFormattedData(formattedTasks);
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

    const addTask = (newTask) => {
        const maxIDTask = tasks.reduce((prev, current) => {
            return (prev && prev.id > current.id) ? prev : current;
        });
        newTask.id = maxIDTask.id + 1;

        tasks.push(newTask);
        updateTasks(tasks);
    };

    const deleteTask = () => {
        Confirm({
            title: 'Delete Task',
            content: 'Are you sure you want to delete ' + currentTask.name + '?',
            confirmLabel: 'Yes',
            onConfirm: () => {
                setShowEditModal(false);
                const index = tasks.indexOf(currentTask);
                if (index >= 0) {
                    tasks.splice(index, 1);
                }
                updateTasks(tasks);
            }
        });
    };

    useEffect(() => {
        updateData();

        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.SETTINGS.JOB_HISTORY.MAINTENANCE);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
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

    const onAdd = () => {
        setShowAddModal(true);
    };

    // styling doesnt work with classname
    const columns = useMemo(
        () => [
            {
                accessorKey: 'time',
                header: () => null,
                cell: (info) => {
                    if (Number(info.renderValue())) {
                        return (
                            <div
                                style={{
                                    color: 'green',
                                    display: 'flex',
                                    maxHeight: '100%',
                                    alignContent: 'center',
                                    justifyContent: 'center',
                                    // padding: '50% 0px'
                                }}
                            >
                                {info.renderValue() + ' Hours'}
                            </div>
                        );
                    } else if (info.renderValue() === 'Due') {
                        return (
                            <div
                                style={{
                                    color: '#E15C00',
                                    fontStyle: 'bold',
                                    display: 'flex',
                                    textAlign: 'center',
                                    alignContent: 'center',
                                    justifyContent: 'center',
                                    height: '100%'
                                }}
                            >
                                {info.renderValue()}
                            </div>
                        );
                    } else {
                        return (
                            <div
                                style={{
                                    color: 'red',
                                    fontStyle: 'bold',
                                    display: 'flex',
                                    textAlign: 'center',
                                    alignContent: 'center',
                                    justifyContent: 'center',
                                    height: '100%'
                                }}
                            >
                                {info.renderValue()}
                            </div>
                        );
                    }
                },
                minSize: 30,
                maxSize: 30,
                invertSorting: true,
                enableSorting: false,
                filterFn: 'fuzzy',
                sortingFn: sortingFns.alphanumeric,
            },
            {
                accessorKey: 'part',
                header: () => null,
                cell: (info) => {
                    return (
                        <div style={{ whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
                            <strong style={{ fontSize: '16px' }}>{info.cell.row.original.part}</strong>
                            <span>{'\n'}</span>
                            <span>{info.cell.row.original.description}</span>
                        </div>
                    );
                },
                enableSorting: false,
            },
            {
                accessorKey: 'edit',
                header: () => null,
                cell: (info) => {
                    return (
                        <div
                            style={{
                                flexDirection: 'column',
                                textAlign: 'center',
                            }}
                        >
                            <Icon path={mdiCheckOutline} size={1.5} color="green" onClick={() => onClear(info.cell.row.original.id)} />
                            <Icon path={mdiPencil} size={1.5} onClick={() => onEdit(info.cell.row.original.id)} />
                        </div>
                    );
                },
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
                <SortableTable data={formattedData} columns={columns} enableSortingRemoval={false} sortBy={sortBy} onAdd={onAdd} />
            </div>
            { showEditModal && (
                <EditArea
                    task={currentTask}
                    update={replaceTask}
                    closeModal={() => setShowEditModal(false)}
                    deleteTask={deleteTask}
                />
            ) }
            { showAddModal && (
                <AddArea
                    update={addTask}
                    closeModal={() => setShowAddModal(false)}
                />
            ) }
        </div>
    );
};

export default Maintenance;

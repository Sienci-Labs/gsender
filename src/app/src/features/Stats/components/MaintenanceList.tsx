import React, { useContext, useEffect, useMemo, useState } from 'react';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { sortingFns } from '@tanstack/react-table';
import Icon from '@mdi/react';
import { mdiAlert, mdiCheckOutline, mdiPencil } from '@mdi/js';
import SortableTable from 'app/components/SortableTable';
import { MaintenanceAddTaskDialog } from 'app/features/Stats/components/MaintenanceAddTaskDialog.tsx';
import { MaintenanceEditTaskDialog } from 'app/features/Stats/components/MaintenanceEditTaskDialog.tsx';

function determineTime(task) {
    const { rangeStart, rangeEnd, currentTime } = task;
    if (currentTime < rangeStart) {
        return rangeStart - Math.floor(currentTime);
    } else if (currentTime >= rangeStart && currentTime <= rangeEnd) {
        return 'Due';
    } else {
        return (
            <div>
                <Icon path={mdiAlert} size={1} />
                {' Urgent!'}
            </div>
        );
    }
}

function formatTasks(data) {
    const formattedTasks = [];
    data.forEach((task) => {
        const formattedTask = {
            id: task.id,
            part: task.name,
            time: determineTime(task),
            edit: '',
            description: task.description,
        };
        formattedTasks.push(formattedTask);
    });
    return formattedTasks;
}

export function MaintenanceList() {
    const { maintenanceTasks } = useContext(StatContext);
    const [formattedData, setFormattedData] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editID, setEditID] = useState(-1);

    useEffect(() => {
        const refactor = formatTasks(maintenanceTasks);
        setFormattedData(refactor);
    }, [maintenanceTasks]);

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
                                    height: '100%',
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
                                    height: '100%',
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
                        <div
                            style={{
                                whiteSpace: 'pre-line',
                                overflowWrap: 'break-word',
                            }}
                        >
                            <strong style={{ fontSize: '16px' }}>
                                {info.cell.row.original.part}
                            </strong>
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
                            <button onClick={() => console.log('clear')}>
                                <Icon
                                    path={mdiCheckOutline}
                                    size={1.5}
                                    color="green"
                                />
                            </button>

                            <button
                                onClick={() => {
                                    onEdit(info.cell.row.original.id);
                                }}
                            >
                                <Icon path={mdiPencil} size={1.5} />
                            </button>
                        </div>
                    );
                },
                enableSorting: false,
                minSize: 15,
                maxSize: 15,
            },
        ],
        [],
    );

    const sortBy = [
        {
            id: 'time',
            desc: true,
        },
    ];

    function onAdd() {
        setShowAddForm(true);
    }

    function onEdit(id) {
        setEditID(id);
        setShowEditForm(true);
    }

    return (
        <div>
            <SortableTable
                data={formattedData}
                columns={columns}
                enableSortingRemoval={false}
                sortBy={sortBy}
                onAdd={onAdd}
            />
            <MaintenanceAddTaskDialog
                show={showAddForm}
                toggleShow={setShowAddForm}
            />
            <MaintenanceEditTaskDialog
                show={showEditForm}
                toggleShow={setShowEditForm}
                id={editID}
            />
        </div>
    );
}

import { useContext, useEffect, useState } from 'react';
import {
    MaintenanceTask,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import { sortingFns } from '@tanstack/react-table';
import Icon from '@mdi/react';
import { mdiAlert, mdiCheckOutline, mdiPencil } from '@mdi/js';
import SortableTable, { CustomColumnDef } from 'app/components/SortableTable';
import { MaintenanceAddTaskDialog } from 'app/features/Stats/components/MaintenanceAddTaskDialog.tsx';
import { MaintenanceEditTaskDialog } from 'app/features/Stats/components/MaintenanceEditTaskDialog.tsx';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from 'app/components/shadcn/AlertDialog';

interface FormattedTask {
    id: number;
    part: string;
    time: number | JSX.Element | 'Due';
    edit: string;
    description: string;
    subRow?: string;
}

function determineTime(task: MaintenanceTask) {
    const { rangeStart, rangeEnd, currentTime } = task;
    if (currentTime < rangeStart) {
        return rangeStart - Math.floor(currentTime);
    } else if (currentTime >= rangeStart && currentTime <= rangeEnd) {
        return 'Due';
    } else {
        return (
            <div className="flex flex-col items-center text-center justify-center">
                <Icon path={mdiAlert} size={1} />
                {'Urgent!'}
            </div>
        );
    }
}

function formatTasks(data: MaintenanceTask[]) {
    const formattedTasks: FormattedTask[] = [];
    data.forEach((task) => {
        const formattedTask: FormattedTask = {
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
    const { maintenanceTasks, maintenanceActions, setMaintenanceTasks } =
        useContext(StatContext);
    const [formattedData, setFormattedData] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);
    const [currentTask, setCurrentTask] = useState<MaintenanceTask>(null);

    useEffect(() => {
        const refactor = formatTasks(maintenanceTasks);
        setFormattedData(refactor);
    }, [maintenanceTasks]);

    const columns: CustomColumnDef<FormattedTask, any>[] = [
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
                                textAlign: 'center',
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
            size: 30,
            invertSorting: true,
            enableSorting: true,
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
            size: 500,
        },
        {
            accessorKey: 'description',
            header: () => null,
            cell: (_info) => {
                return <></>;
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
                        <button
                            onClick={() => {
                                onClear(info.cell.row.original.id);
                            }}
                        >
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
            size: 30,
        },
    ];

    const sortBy = [
        {
            id: 'time',
            desc: true,
        },
    ];

    function onAdd() {
        setShowAddForm(true);
    }

    function onEdit(id: number) {
        const selectedTask = maintenanceTasks.find((obj) => obj.id === id);
        setCurrentTask(selectedTask);
        setShowEditForm(true);
    }

    function onClear(id: number) {
        const selectedTask = maintenanceTasks.find((obj) => obj.id === id);
        setCurrentTask(selectedTask);
        setShowClearConfirmation(true);
    }

    return (
        <div>
            <SortableTable
                data={formattedData}
                columns={columns}
                enableSortingRemoval={false}
                sortBy={sortBy}
                onAdd={onAdd}
                pagination={false}
                searchPlaceholder="Search Tasks..."
                columnVisibility={{ description: false }} // this makes it so the description column doesnt show, but it exists to search on
            />
            <MaintenanceAddTaskDialog
                show={showAddForm}
                toggleShow={setShowAddForm}
            />
            <MaintenanceEditTaskDialog
                show={showEditForm}
                toggleShow={setShowEditForm}
                currentTask={currentTask}
            />
            {showClearConfirmation && (
                <AlertDialog
                    open={showClearConfirmation}
                    onOpenChange={setShowClearConfirmation}
                >
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Reset Maintenance Timer
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {'Are you sure you want to reset the maintenance timer for ' +
                                    currentTask.name +
                                    '? Only do this if you have just performed this maintenance task.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    const updatedTasks = maintenanceTasks.map(
                                        (obj) => {
                                            if (obj.id === currentTask.id) {
                                                let newObj = obj;
                                                newObj.currentTime = 0;
                                                return newObj;
                                            }
                                            return obj;
                                        },
                                    );
                                    setCurrentTask({
                                        currentTime: 0,
                                        ...currentTask,
                                    });
                                    setMaintenanceTasks(updatedTasks);
                                    maintenanceActions.update(updatedTasks);
                                }}
                            >
                                Yes
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}

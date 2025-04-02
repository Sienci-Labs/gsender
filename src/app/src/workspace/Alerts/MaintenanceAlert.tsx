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

import chainedFunction from 'chained-function';
import React from 'react';
import uniqueId from 'lodash/uniqueId';
import { MaintenanceTask } from 'app/features/Stats/utils/StatContext';
import api from 'app/api';
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
import { Button } from 'app/components/shadcn/Button';
import { toast } from 'app/lib/toaster';

interface Props {
    tasks: MaintenanceTask[];
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    onClose: () => void;
}

const MaintenanceAlert: React.FC<Props> = ({
    tasks,
    showModal,
    setShowModal,
    onClose,
}) => {
    let alertTasks: MaintenanceTask[] = [];
    tasks.forEach((task: MaintenanceTask) => {
        const { rangeStart, currentTime } = task;
        if (currentTime >= rangeStart) {
            alertTasks.push(task);
        }
    });

    return (
        <AlertDialog open={showModal} onOpenChange={setShowModal}>
            <AlertDialogContent className="bg-slate-200">
                <AlertDialogHeader className="flex justify-between items-center">
                    <AlertDialogTitle>Maintenance Alert</AlertDialogTitle>
                    <AlertDialogDescription>
                        <p>{'The following maintenance tasks are due:'}</p>
                        <span className="flex flex-col overflow-y-auto border border-slate-400 m-3">
                            {alertTasks.map((task) => {
                                return (
                                    <span key={uniqueId()}>
                                        {'• ' + task.name + '\n'}
                                    </span>
                                );
                            })}
                        </span>
                        <p>
                            Click 'Reset Timers' to reset the timers on ALL
                            listed tasks. Click 'Close' to close the popup and
                            do nothing.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction>
                        <Button
                            className="pull-left bg-red-500 text-white"
                            onClick={chainedFunction(() => {
                                const updatedTasks = tasks.map((task) => {
                                    const { rangeStart, currentTime } = task;
                                    if (currentTime >= rangeStart) {
                                        let newTask = task;
                                        newTask.currentTime = 0;
                                        return newTask;
                                    }
                                    return task;
                                });
                                api.maintenance
                                    .update(updatedTasks)
                                    .then((res) => {
                                        if (res.status === 200) {
                                            toast('Reset Timers successfully');
                                        } else {
                                            toast('Failed to Reset Timers.', {
                                                description:
                                                    'Please go to the Stats Page to reset them manually.',
                                            });
                                        }
                                    });
                            }, onClose)}
                        >
                            {'Reset Timers'}
                        </Button>
                    </AlertDialogAction>
                    <AlertDialogCancel>
                        <Button onClick={onClose}>{'Close'}</Button>
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default MaintenanceAlert;

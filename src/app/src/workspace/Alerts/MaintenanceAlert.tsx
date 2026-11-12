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
import type { MaintenanceTask } from 'app/features/Stats/utils/StatContext';
import { i18n, useAppTranslation } from 'app/i18n';
import { toast } from 'app/lib/toaster';
import chainedFunction from 'chained-function';
import uniqueId from 'lodash/uniqueId';
import type React from 'react';

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
    const { t } = useAppTranslation();
    const alertTasks: MaintenanceTask[] = [];
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
                    <AlertDialogTitle>
                        {t('workspace:alerts.maintenance.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <p>{t('workspace:alerts.maintenance.tasksDue')}</p>
                        <span className="flex flex-col overflow-y-auto border border-slate-400 m-3">
                            {alertTasks.map((task) => {
                                return (
                                    <span key={uniqueId()}>
                                        {'• ' + task.name + '\n'}
                                    </span>
                                );
                            })}
                        </span>
                        <p>{t('workspace:alerts.maintenance.instructions')}</p>
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
                                        const newTask = task;
                                        newTask.currentTime = 0;
                                        return newTask;
                                    }
                                    return task;
                                });
                                api.maintenance
                                    .update(updatedTasks)
                                    .then((res) => {
                                        if (res.status === 200) {
                                            toast(
                                                i18n.t(
                                                    'notifications:maintenance.timersReset',
                                                ),
                                                {
                                                    position: 'bottom-right',
                                                },
                                            );
                                        } else {
                                            toast(
                                                i18n.t(
                                                    'notifications:maintenance.timersResetFailed',
                                                ),
                                                {
                                                    description: i18n.t(
                                                        'notifications:maintenance.timersResetFailedDescription',
                                                    ),
                                                    position: 'bottom-right',
                                                },
                                            );
                                        }
                                    });
                            }, onClose)}
                        >
                            {t('workspace:alerts.maintenance.resetTimers')}
                        </Button>
                    </AlertDialogAction>
                    <AlertDialogCancel>
                        <Button onClick={onClose}>
                            {t('common:actions.close')}
                        </Button>
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default MaintenanceAlert;

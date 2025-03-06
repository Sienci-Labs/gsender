import api from 'app/api';
import { MaintenanceTask } from 'app/features/Stats/utils/StatContext';
import { useEffect, useState } from 'react';
import MaintenanceAlert from './MaintenanceAlert';
import pubsub from 'pubsub-js';

export const Alerts = () => {
    const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    useEffect(() => {
        const token = pubsub.subscribe('job:end', () => {
            api.maintenance.fetch().then((res) => {
                const taskList: MaintenanceTask[] = res.data;
                console.log(taskList);
                let shouldAlert = false;
                for (const task of taskList) {
                    const { rangeStart, currentTime } = task;
                    console.log('start: ' + rangeStart);
                    console.log('current time: ' + currentTime);
                    if (currentTime >= rangeStart) {
                        shouldAlert = true;
                        break;
                    }
                }
                if (shouldAlert) {
                    console.log('made it');
                    setTasks(taskList);
                    setShowMaintenanceAlert(true);
                }
            });
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    console.log(showMaintenanceAlert);

    return (
        <>
            {showMaintenanceAlert && (
                <MaintenanceAlert
                    tasks={tasks}
                    showModal={showMaintenanceAlert}
                    setShowModal={setShowMaintenanceAlert}
                    onClose={() => setShowMaintenanceAlert(false)}
                />
            )}
        </>
    );
};

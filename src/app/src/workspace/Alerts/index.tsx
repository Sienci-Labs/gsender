import api from 'app/api';
import { Job, MaintenanceTask } from 'app/features/Stats/utils/StatContext';
import { useEffect, useState } from 'react';
import MaintenanceAlert from './MaintenanceAlert';
import pubsub from 'pubsub-js';
import JobEndModal from './JobEndModal';

export const Alerts = () => {
    const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
    const [showJobEndModal, setShowJobEndModal] = useState(false);
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [job, setJob] = useState<Job>(null);
    const [errors, setErrors] = useState([]);
    useEffect(() => {
        const tokens = [
            pubsub.subscribe('job:end', (_, data) => {
                const { errors } = data;
                setErrors(errors);
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
            }),
            pubsub.subscribe('lastJob', (_, job) => {
                setJob(job);
                setShowJobEndModal(true);
            }),
        ];
        return () => {
            tokens.forEach((token) => {
                pubsub.unsubscribe(token);
            });
        };
    }, []);

    return (
        <>
            {showJobEndModal && (
                <JobEndModal
                    job={job}
                    errors={errors}
                    showModal={showJobEndModal}
                    setShowModal={setShowJobEndModal}
                    onClose={() => setShowJobEndModal(false)}
                />
            )}
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

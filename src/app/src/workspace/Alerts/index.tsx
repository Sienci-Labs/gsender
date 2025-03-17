import api from 'app/api';
import { Job, MaintenanceTask } from 'app/features/Stats/utils/StatContext';
import { useEffect, useState } from 'react';
import MaintenanceAlert from './MaintenanceAlert';
import pubsub from 'pubsub-js';
import JobEndModal from './JobEndModal';
import store from 'app/store';

export const Alerts = () => {
    const [modalEnabled, setModalEnabled] = useState(
        store.get('widgets.visualizer.jobEndModal'),
    );
    const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
    const [showJobEndModal, setShowJobEndModal] = useState(false);
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [job, setJob] = useState<Job>(null);
    const [errors, setErrors] = useState([]);

    const handleStoreChange = () => {
        setShowJobEndModal(false);
        setShowMaintenanceAlert(false);
        setModalEnabled(store.get('widgets.visualizer.jobEndModal'));
    };

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('job:end', (_, data) => {
                const { errors } = data;
                setErrors(errors);
                api.maintenance.fetch().then((res) => {
                    const taskList: MaintenanceTask[] = res.data;
                    let shouldAlert = false;
                    for (const task of taskList) {
                        const { rangeStart, currentTime } = task;
                        if (currentTime >= rangeStart) {
                            shouldAlert = true;
                            break;
                        }
                    }
                    if (shouldAlert) {
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

        store.on('change', handleStoreChange);
        return () => {
            tokens.forEach((token) => {
                pubsub.unsubscribe(token);
            });
            store.removeListener('change', handleStoreChange);
        };
    }, []);

    return (
        <>
            {modalEnabled && (
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
            )}
        </>
    );
};

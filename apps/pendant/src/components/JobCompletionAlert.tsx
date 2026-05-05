import { useEffect, useRef, useState } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { JOB_STATUS, JOB_TYPES, WORKFLOW_STATE_IDLE, WORKFLOW_STATE_RUNNING } from 'app/constants';
import type { Job } from 'app/features/Stats/utils/StatContext';
import JobEndModal from 'app/workspace/Alerts/JobEndModal';

export default function JobCompletionAlert() {
    const senderStatus = useTypedSelector((state: RootState) => state.controller.sender.status) as any;
    const workflowState = useTypedSelector((state: RootState) => state.controller.workflow.state);
    const controllerType = useTypedSelector((state: RootState) => state.controller.type);
    const port = useTypedSelector((state: RootState) => state.connection.port);
    const filePath = useTypedSelector((state: RootState) => state.file.path);

    const [showJobEndModal, setShowJobEndModal] = useState(false);
    const [job, setJob] = useState<Job | null>(null);

    const hasRunRef = useRef(false);
    const lastFinishTimeRef = useRef(0);

    useEffect(() => {
        if (workflowState === WORKFLOW_STATE_RUNNING) {
            hasRunRef.current = true;
        }

        const finishTime = Number(senderStatus?.finishTime) || 0;
        if (!hasRunRef.current || finishTime <= 0) {
            return;
        }

        if (workflowState !== WORKFLOW_STATE_IDLE) {
            return;
        }

        if (finishTime === lastFinishTimeRef.current) {
            return;
        }

        const nextJob: Job = {
            id: String(finishTime),
            type: JOB_TYPES.JOB,
            file: String(senderStatus?.name || ''),
            path: filePath || '',
            port: String(port || ''),
            controller: controllerType as any,
            startTime: new Date(Number(senderStatus?.startTime) || Date.now()),
            endTime: new Date(finishTime),
            duration: Number(senderStatus?.elapsedTime) || 0,
            jobStatus: JOB_STATUS.COMPLETE,
            totalLines: Number(senderStatus?.total) || 0,
        };

        setJob(nextJob);
        setShowJobEndModal(true);
        lastFinishTimeRef.current = finishTime;
        hasRunRef.current = false;
    }, [workflowState, senderStatus, controllerType, port, filePath]);

    if (!job) {
        return null;
    }

    return (
        <JobEndModal
            job={job}
            errors={[]}
            showModal={showJobEndModal}
            setShowModal={setShowJobEndModal}
            onClose={() => setShowJobEndModal(false)}
        />
    );
}

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from 'app/components/shadcn/AlertDialog';
import { Button } from 'app/components/shadcn/Button';
import { JOB_STATUS } from 'app/constants';
import { Job } from 'app/features/Stats/utils/StatContext';
import { convertMillisecondsToTimeStamp } from 'app/lib/datetime';
import cx from 'classnames';
import uniqueId from 'lodash/uniqueId';

interface Props {
    job: Job;
    errors: string[];
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    onClose: () => void;
}

const JobEndModal: React.FC<Props> = ({
    job,
    errors,
    showModal,
    setShowModal,
    onClose,
}) => {
    return (
        <AlertDialog open={showModal} onOpenChange={setShowModal}>
            <AlertDialogContent className="bg-slate-200">
                <AlertDialogHeader className="flex items-center">
                    <AlertDialogTitle>Job End</AlertDialogTitle>
                    <AlertDialogDescription>
                        <div className="min-h-[100px] max-h-[500px] flex flex-col">
                            <div className="flex flex-col m-2 mt-0 overflow-y-auto float-left">
                                <div>
                                    <strong>Status:</strong>
                                    <span
                                        className={cx({
                                            'text-green-500':
                                                job.jobStatus ===
                                                JOB_STATUS.COMPLETE,
                                            'text-red-500':
                                                job.jobStatus ===
                                                JOB_STATUS.STOPPED,
                                        })}
                                    >{` ${job.jobStatus}\n`}</span>
                                </div>
                                <div>
                                    <strong>Time:</strong>
                                    <span>{` ${convertMillisecondsToTimeStamp(job.duration)}\n`}</span>
                                </div>
                                <strong>{'Errors:\n'}</strong>

                                {errors.length === 0 ? (
                                    <span className="flex flex-col m-2 mt-0">
                                        None
                                    </span>
                                ) : (
                                    <span className="flex flex-col m-2 mt-0 text-red-500">
                                        {errors.map((error) => {
                                            return (
                                                <span
                                                    key={uniqueId()}
                                                >{`- ${error}\n`}</span>
                                            );
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>
                        Close
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default JobEndModal;

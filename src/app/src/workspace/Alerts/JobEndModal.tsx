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
import type { Job } from 'app/features/Stats/utils/StatContext';
import { useAppTranslation } from 'app/i18n';
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
    const { t } = useAppTranslation();
    const jobStatusLabel =
        job.jobStatus === JOB_STATUS.COMPLETE
            ? t('workspace:alerts.jobEnd.statusComplete')
            : job.jobStatus === JOB_STATUS.STOPPED
              ? t('workspace:alerts.jobEnd.statusStopped')
              : job.jobStatus;
    return (
        <AlertDialog open={showModal} onOpenChange={setShowModal}>
            <AlertDialogContent className="bg-slate-200">
                <AlertDialogHeader className="flex items-center">
                    <AlertDialogTitle>
                        {t('workspace:alerts.jobEnd.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <div className="min-h-[100px] max-h-[500px] flex flex-col">
                            <div className="flex flex-col m-2 mt-0 overflow-y-auto float-left">
                                <div>
                                    <strong>
                                        {t('workspace:alerts.jobEnd.status')}
                                    </strong>
                                    <span
                                        className={cx({
                                            'text-green-500':
                                                job.jobStatus ===
                                                JOB_STATUS.COMPLETE,
                                            'text-red-500':
                                                job.jobStatus ===
                                                JOB_STATUS.STOPPED,
                                        })}
                                    >{` ${jobStatusLabel}\n`}</span>
                                </div>
                                <div>
                                    <strong>
                                        {t('workspace:alerts.jobEnd.time')}
                                    </strong>
                                    <span>{` ${convertMillisecondsToTimeStamp(job.duration)}\n`}</span>
                                </div>
                                <strong>{`${t('workspace:alerts.jobEnd.errors')}\n`}</strong>

                                {errors.length === 0 ? (
                                    <span className="flex flex-col m-2 mt-0">
                                        {t('workspace:alerts.jobEnd.noErrors')}
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
                        {t('common:actions.close')}
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default JobEndModal;

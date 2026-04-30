import get from 'lodash/get';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import ProgressArea from 'app/features/JobControl/ProgressArea';

export default function ProgressAreaWrapper() {
    const senderStatus = useTypedSelector((s: RootState) => get(s, 'controller.sender.status', {})) as any;
    const workflowState = useTypedSelector((s: RootState) => get(s, 'controller.workflow.state', '')) as string;

    return <ProgressArea senderStatus={senderStatus} workflowState={workflowState} />;
}

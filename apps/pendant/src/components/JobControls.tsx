import { useState } from 'react';
import get from 'lodash/get';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import ControlButton from 'app/features/JobControl/ControlButton';
import { START, PAUSE, STOP } from 'app/constants';

export default function JobControls() {
    const [lastLine, setLastLine] = useState<number | null>(null);

    const workflow = useTypedSelector((s: RootState) => get(s, 'controller.workflow'));
    const activeState = useTypedSelector((s: RootState) => get(s, 'controller.state.status.activeState'));
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const fileLoaded = useTypedSelector((s: RootState) => get(s, 'file.fileLoaded', false));

    const onStop = () => {
        setLastLine(null);
    };

    const sharedProps = { workflow, activeState, isConnected, fileLoaded, onStop };

    return (
        <div className="flex gap-2">
            <ControlButton type={START} {...sharedProps} />
            <ControlButton type={PAUSE} {...sharedProps} />
            <ControlButton type={STOP}  {...sharedProps} />
        </div>
    );
}

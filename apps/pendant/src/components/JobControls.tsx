import { JSX, useState } from 'react';
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

    const validateATC = (): [boolean, { type: string; title: string; body: JSX.Element }] => [
        false,
        { type: '', title: '', body: <span /> },
    ];
    const sharedProps = { workflow, activeState, isConnected, fileLoaded, onStop, validateATC };

    return (
        <div className="flex w-full items-center justify-center gap-2">
            <ControlButton type={START} {...sharedProps} />
            <ControlButton type={PAUSE} {...sharedProps} />
            <ControlButton type={STOP}  {...sharedProps} />
        </div>
    );
}

import { StatusIndicator } from 'app/features/SDCard/components/StatusIndicator.tsx';
import { FileList } from 'app/features/SDCard/components/FileList.tsx';
import { useSDCard } from 'app/features/SDCard/hooks/useSDCard.ts';
import { useEffect } from 'react';
import controller from 'app/lib/controller.ts';
import redux, {RootState} from 'app/store/redux';
import { emptyAllSDFiles } from 'app/store/redux/slices/controller.slice.ts';
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";
import {GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_IDLE} from "app/constants";

const SDCardElement = () => {
    const { isMounted, isConnected } =
        useSDCard();

    const activeState = useTypedSelector((state: RootState) => controller.state.status?.activeState);
    const canSendSystemCommands = [GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_IDLE].includes(activeState);

    useEffect(() => {
        if (isConnected && canSendSystemCommands) {
            redux.dispatch(emptyAllSDFiles());
            controller.command('sdcard:list');
        }
    }, []);

    return (
        <div className="bg-gray-50 dark:bg-slate-800 h-full flex">
            <div className="w-4/5 mx-auto py-6">
                <div className="space-y-8 flex flex-col h-full">
                    <StatusIndicator isMounted={isMounted} />
                    <FileList />
                </div>
            </div>
        </div>
    );
};

const SDCard = () => {
    return <SDCardElement />;
};

export default SDCard;

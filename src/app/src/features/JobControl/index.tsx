import { Widget } from 'app/components/Widget';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { WORKFLOW_STATES_T } from 'app/store/definitions';
import ControlButton from './ControlButton';
import { GRBL_ACTIVE_STATE_IDLE, PAUSE, START, STOP } from '../../constants';
import Overrides from './FeedOverride';
import OutlineButton from './OutlineButton';
import StartFromLine from './StartFromLine';
import ProgressArea from './ProgressArea';
import { SenderStatus } from 'app/lib/definitions/sender_feeder';
import { useEffect, useState } from 'react';
import pubsub from 'pubsub-js';

interface JobControlProps {
    workflow: { state: WORKFLOW_STATES_T };
    activeState: GRBL_ACTIVE_STATES_T;
    isConnected: boolean;
    fileLoaded: boolean;
    ovF: number;
    ovS: number;
    feedrate: string;
    spindle: string;
    senderStatus: SenderStatus;
    fileCompletion: number;
}

const JobControl: React.FC<JobControlProps> = ({
    workflow,
    activeState,
    isConnected,
    fileLoaded,
    ovF,
    ovS,
    feedrate,
    spindle,
    senderStatus,
    fileCompletion,
}) => {
    const [lastLine, setLastLine] = useState(1);
    const [pubsubTokens, setPubsubTokens] = useState([]);
    const disabled = !isConnected || !fileLoaded;

    useEffect(() => {
        subscribe();
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        // if finish time on job exists, then reset the start from line value to 1
        if (fileCompletion !== 0) {
            setLastLine(1);
        }
    }, [fileCompletion]);

    const subscribe = () => {
        const tokens = [
            pubsub.subscribe(
                'disconnect:recovery',
                (_msg: string, { received }) => {
                    if (received) {
                        setLastLine(received);
                    }
                },
            ),
        ];
        setPubsubTokens(pubsubTokens.concat(tokens));
    };

    const unsubscribe = () => {
        pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        setPubsubTokens([]);
    };

    const onStop = () => {
        setLastLine(senderStatus?.received);
    };

    return (
        <>
            <div className="z-10 absolute bottom-[30%] portrait:bottom-[calc(50%+85px)] left-1/2 right-1/2 -translate-x-1/2 w-64 justify-center items-center flex">
                {isConnected && fileLoaded && senderStatus?.sent > 0 && (
                    <ProgressArea senderStatus={senderStatus}></ProgressArea>
                )}
            </div>
            <div className="relative h-full">
                <div className="bg-transparent z-10 absolute top-[-80px] left-1/2 right-1/2 flex flex-col justify-center items-center">
                    {fileLoaded && activeState === GRBL_ACTIVE_STATE_IDLE && (
                        <div className="flex flex-row gap-2 justify-center mb-3 w-full">
                            <OutlineButton disabled={disabled} />
                            <StartFromLine
                                disabled={disabled}
                                lastLine={lastLine}
                            />
                        </div>
                    )}
                </div>

                <div className="z-10 absolute top-[-30px] left-1/2 right-1/2 flex flex-row gap-2 justify-center items-center">
                    <ControlButton
                        type={START}
                        workflow={workflow}
                        activeState={activeState}
                        isConnected={isConnected}
                        fileLoaded={fileLoaded}
                        onStop={onStop}
                    />
                    <ControlButton
                        type={PAUSE}
                        workflow={workflow}
                        activeState={activeState}
                        isConnected={isConnected}
                        fileLoaded={fileLoaded}
                        onStop={onStop}
                    />
                    <ControlButton
                        type={STOP}
                        workflow={workflow}
                        activeState={activeState}
                        isConnected={isConnected}
                        fileLoaded={fileLoaded}
                        onStop={onStop}
                    />
                </div>
                <Widget>
                    <Widget.Content className="flex justify-center items-center flex-col">
                        <div className="mt-4">
                            <Overrides
                                ovF={ovF}
                                ovS={ovS}
                                feedrate={feedrate}
                                spindle={spindle}
                                isConnected={isConnected}
                            />
                        </div>
                    </Widget.Content>
                </Widget>
            </div>
        </>
    );
};

export default connect((store) => {
    const workflow = get(store, 'controller.workflow');
    const activeState = get(store, 'controller.state.status.activeState');
    const isConnected = get(store, 'connection.isConnected');
    const fileLoaded = get(store, 'file.fileLoaded', false);
    const ov = get(store, 'controller.state.status.ov', [100, 100, 100]);
    const ovF = ov[0];
    const ovS = ov[2];
    const feedrate = get(store, 'controller.state.status.feedrate');
    const spindle = get(store, 'controller.state.status.spindle');
    const senderStatus = get(store, 'controller.sender.status');
    const fileCompletion = get(store, 'controller.sender.status.finishTime', 0);

    return {
        fileLoaded,
        workflow,
        activeState,
        isConnected,
        ovF,
        ovS,
        feedrate,
        spindle,
        senderStatus,
        fileCompletion,
    };
})(JobControl);

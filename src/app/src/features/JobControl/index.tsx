import { Widget } from 'app/components/Widget';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { WORKFLOW_STATES_T } from 'app/store/definitions';
import ControlButton from './ControlButton';
import {
    GRBL_ACTIVE_STATE_IDLE,
    PAUSE,
    START,
    STOP,
    WORKFLOW_STATE_IDLE,
} from '../../constants';
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
    ovTimestamp: number;
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
    ovTimestamp,
    feedrate,
    spindle,
    senderStatus,
    fileCompletion,
    currentTool,
    spindleToolEvents,
    toolOffsets,
    atcEnabled,
}) => {
    const [lastLine, setLastLine] = useState(1);
    const [pubsubTokens, setPubsubTokens] = useState([]);
    const disabled = !isConnected || !fileLoaded;
    const { state: workflowState } = workflow;

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

    function validateFileForATC() {
        let hasTC = false;
        let toolEvent = null;

        // No ATC, always return a fine validation
        if (!atcEnabled) {
            return [false, null];
        }

        if (!spindleToolEvents) {
            return;
        }

        for (const [eventKey] of Object.entries(spindleToolEvents)) {
            toolEvent = spindleToolEvents[eventKey];
            if (toolEvent.hasOwnProperty('M') && toolEvent['M'] === 6) {
                hasTC = true;
                break;
            }
        }
        // early return if we see a M6 in the file - no need to prompt
        if (hasTC) {
            return [false, null];
        }
        // No tool change in file - prompt based on current tool and offsets

        // Tool selected with offsets
        if (currentTool > 0) {
            const offsets = toolOffsets[Number(currentTool)];
            const zOffset = get(offsets, 'toolOffsets.z', 0);

            // Tool selected with Offsets
            if (zOffset < 0) {
                return [
                    true,
                    {
                        type: 'alert',
                        title: `Using Current Tool (T${currentTool})`,
                        body: (
                            <>
                                <p>
                                    This file contains no tool change commands
                                    (M6) and the tool in the spindle will be
                                    used.
                                </p>
                                <p>
                                    Please confirm that you want to use this
                                    tool
                                </p>
                            </>
                        ),
                    },
                ];
            } else {
                return [
                    true,
                    {
                        type: 'error',
                        title: 'Current Tool Not Probed',
                        body: (
                            <>
                                <p>
                                    The file contains no tool change commands
                                    (M6) and the tool in the spindle will be
                                    used. However, the tool in the spindle does
                                    not have an offset.
                                </p>
                                <p>
                                    Select <b>"Probe"</b> in the ATC tab to
                                    establish an offset and re-zero the
                                    workpiece before trying again.
                                </p>
                            </>
                        ),
                    },
                ];
            }
            // Tool selected with no offsets
        } else {
            // no current tool - prompt to load one
            return [
                true,
                {
                    type: 'error',
                    title: 'No Current Tool',
                    body: (
                        <>
                            <p>
                                This file contains no tool change commands (M6)
                                and there is no tool in the spindle.
                            </p>
                            <p>
                                Load the tool you want to use into the spindle
                                before trying again.
                            </p>
                            <p>
                                Alternatively, you can update your
                                post-processor to include a tool change command
                                with your file.
                            </p>
                        </>
                    ),
                },
            ];
        }
    }

    return (
        <>
            <div className="z-10 absolute bottom-[30%] portrait:bottom-[calc(50%+85px)] left-1/2 right-1/2 -translate-x-1/2 w-64 justify-center items-center flex">
                {isConnected && fileLoaded && senderStatus?.sent > 0 && (
                    <ProgressArea
                        senderStatus={senderStatus}
                        workflowState={workflowState}
                    ></ProgressArea>
                )}
            </div>
            <div className="relative h-full">
                <div className="bg-transparent z-10 absolute top-[-80px] left-1/2 right-1/2 flex flex-col justify-center items-center">
                    {fileLoaded &&
                        workflowState === WORKFLOW_STATE_IDLE &&
                        activeState === GRBL_ACTIVE_STATE_IDLE && (
                            <div className="flex flex-row gap-2 justify-center mb-3 w-full">
                                <OutlineButton disabled={disabled} />
                                <StartFromLine
                                    disabled={disabled}
                                    lastLine={lastLine}
                                    atcValidator={validateFileForATC}
                                />
                            </div>
                        )}
                </div>

                <div className="z-10 absolute top-[-30px] max-xl:top-[-28px] left-1/2 right-1/2 flex flex-row gap-2 justify-center items-center">
                    <ControlButton
                        type={START}
                        workflow={workflow}
                        activeState={activeState}
                        isConnected={isConnected}
                        fileLoaded={fileLoaded}
                        onStop={onStop}
                        validateATC={validateFileForATC}
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
                        <div className="mt-4 max-xl:mt-0">
                            <Overrides
                                ovF={ovF}
                                ovS={ovS}
                                ovTimestamp={ovTimestamp}
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
    const ovTimestamp = get(store, 'controller.state.status.ovTimestamp', 0);
    const feedrate = get(store, 'controller.state.status.feedrate');
    const spindle = get(store, 'controller.state.status.spindle');
    const senderStatus = get(store, 'controller.sender.status');
    const fileCompletion = get(store, 'controller.sender.status.finishTime', 0);

    const spindleToolEvents = get(store, 'file.spindleToolEvents', {});
    const toolOffsets = get(store, 'controller.settings.toolTable', {});
    const currentTool = get(store, 'controller.state.status.currentTool', -1);
    const atcFlag = get(store, 'controller.settings.info.NEWOPT.ATC', '0');
    const atcEnabled = atcFlag === '1';

    return {
        fileLoaded,
        workflow,
        activeState,
        isConnected,
        ovF,
        ovS,
        ovTimestamp,
        feedrate,
        spindle,
        senderStatus,
        fileCompletion,
        spindleToolEvents,
        toolOffsets,
        currentTool,
        atcEnabled,
    };
})(JobControl);

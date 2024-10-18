import { Widget } from 'app/components/Widget';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { WORKFLOW_STATES_T } from 'app/store/definitions';
import ControlButton from './ControlButton';
import { GRBL_ACTIVE_STATE_IDLE, PAUSE, START, STOP } from '../../constants';
import Overrides from './FeedOverride';
import OutlineButton from './OutlineButton';
import StartFromLine from './StartFromLine';
import ProgressArea from './ProgressArea';
import { SenderStatus } from 'app/lib/definitions/sender_feeder';

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
}) => {
    const disabled = !isConnected || !fileLoaded;

    return (
        <Widget>
            <Widget.Content className="flex justify-center items-center flex-col relative w-full">
                <div className="z-10 top-[-85px] flex flex-col justify-center items-center absolute left-1/2 right-1/2">
                    <div className="flex flex-col justify-center items-center w-full">
                        {isConnected && fileLoaded && senderStatus.sent > 0 && (
                            <ProgressArea
                                senderStatus={senderStatus}
                            ></ProgressArea>
                        )}
                    </div>
                    <div
                        className={`bg-transparent z-10 flex flex-col justify-center items-center ${!fileLoaded || activeState !== GRBL_ACTIVE_STATE_IDLE ? 'opacity-0' : ''}`}
                    >
                        <div className="flex flex-row gap-2 justify-center mb-3 w-full">
                            <OutlineButton disabled={disabled} />
                            <StartFromLine disabled={disabled} />
                        </div>
                    </div>

                    <div className="flex flex-row gap-2 justify-center items-center">
                        <ControlButton
                            type={START}
                            workflow={workflow}
                            activeState={activeState}
                            isConnected={isConnected}
                            fileLoaded={fileLoaded}
                        />
                        <ControlButton
                            type={PAUSE}
                            workflow={workflow}
                            activeState={activeState}
                            isConnected={isConnected}
                            fileLoaded={fileLoaded}
                        />
                        <ControlButton
                            type={STOP}
                            workflow={workflow}
                            activeState={activeState}
                            isConnected={isConnected}
                            fileLoaded={fileLoaded}
                        />
                    </div>
                </div>
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
    };
})(JobControl);

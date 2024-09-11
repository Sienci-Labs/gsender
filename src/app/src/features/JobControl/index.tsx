import {Widget} from "app/components/Widget";
import { GRBL_ACTIVE_STATES_T } from "app/definitions/general";
import { get } from "lodash";
import { connect } from "react-redux";
import { WORKFLOW_STATES_T } from "app/store/definitions";
import ControlButton from "./ControlButton";
import { PAUSE, START, STOP } from "../../constants";
import Overrides from "./FeedOverride";

interface JobControlProps {
    workflow: { state: WORKFLOW_STATES_T },
    activeState: GRBL_ACTIVE_STATES_T,
    isConnected: boolean,
    fileLoaded: boolean,
    ovF: number,
    ovS: number,
    feedrate: string
    spindle: string
};

const JobControl: React.FC<JobControlProps> = ({ workflow, activeState, isConnected, fileLoaded, ovF, ovS, feedrate, spindle }) => {
    return (
        <Widget>
            <Widget.Header
                className="bg-transparent z-10 absolute -bottom-4"
            >
                <div className="flex flex-row gap-2 justify-center -mt-12">
                    <ControlButton type={START} workflow={workflow} activeState={activeState} isConnected={isConnected} fileLoaded={fileLoaded} />
                    <ControlButton type={PAUSE} workflow={workflow} activeState={activeState} isConnected={isConnected} fileLoaded={fileLoaded} />
                    <ControlButton type={STOP} workflow={workflow} activeState={activeState} isConnected={isConnected} fileLoaded={fileLoaded} />
                </div>
            </Widget.Header>
            <Widget.Content
                className="flex justify-center items-center flex-col"
            >
                <div className="mt-4">
                    <Overrides ovF={ovF} ovS={ovS} feedrate={feedrate} spindle={spindle} isConnected={isConnected} />
                </div>
            </Widget.Content>
        </Widget>
    )
}

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

    return {
        fileLoaded,
        workflow,
        activeState,
        isConnected,
        ovF,
        ovS,
        feedrate,
        spindle
    };
})(JobControl);

import { Widget } from "components/Widget";
import { GRBL_ACTIVE_STATES_T } from "definitions/general";
import { get } from "lodash";
import { connect } from "react-redux";
import { WORKFLOW_STATES_T } from "store/definitions";
import ControlButton from "./ControlButton";
import { PAUSE, START, STOP } from "../../constants";

interface JobControlProps {
    workflow: { state: WORKFLOW_STATES_T },
    activeState: GRBL_ACTIVE_STATES_T,
    isConnected: boolean,
    fileLoaded: boolean
};

const JobControl: React.FC<JobControlProps> = ({ workflow, activeState, isConnected, fileLoaded }) => {
    return (
        <Widget>
            <Widget.Content
                className="flex justify-center items-center w-full"
            >
                <div className="grid grid-cols-3 gap-2">
                    <ControlButton type={START} workflow={workflow} activeState={activeState} isConnected={isConnected} fileLoaded={fileLoaded} />
                    <ControlButton type={PAUSE} workflow={workflow} activeState={activeState} isConnected={isConnected} fileLoaded={fileLoaded} />
                    <ControlButton type={STOP} workflow={workflow} activeState={activeState} isConnected={isConnected} fileLoaded={fileLoaded} />
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

    return {
        fileLoaded,
        workflow,
        activeState,
        isConnected
    };
})(JobControl);

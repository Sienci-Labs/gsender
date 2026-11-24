// NOTE: require(), not import - the server logger needs GSENDER_LOG_LEVEL set
// before the module graph loads (see GrblHalAxsProbe.test.js).
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const GrblHalRunner = require('../GrblHalRunner').default;
const {
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING,
} = require('../../../lib/Workflow');

// A successful PRB copies the probe position into the current tool's offsets,
// but only mid-job. Outside a job $# reports [T:] lines before [PRB:], so a
// stale PRB would wipe the offsets that were just reported.

const PRB_SUCCESS = '[PRB:5.000,6.000,7.000:1]';
const PRB_FAIL = '[PRB:5.000,6.000,7.000:0]';
const ORIGINAL = { x: 1, y: 2, z: 3 };

function makeRunner(workflowState) {
    const runner = new GrblHalRunner({
        getWorkflowState: () => workflowState,
    });
    runner.settings.toolTable = { 1: { toolOffsets: { ...ORIGINAL } } };
    runner.state.status.currentTool = 1;
    return runner;
}

describe('GrblHalRunner PRB tool offset updates', () => {
    it('ignores PRB for tool offsets while idle but still stores the parameter', () => {
        const runner = makeRunner(WORKFLOW_STATE_IDLE);
        runner.parse(PRB_SUCCESS);

        expect(runner.settings.toolTable[1].toolOffsets).toEqual(ORIGINAL);
        expect(runner.settings.parameters.PRB).toMatchObject({
            x: '5.000',
            y: '6.000',
            z: '7.000',
            result: 1,
        });
    });

    it('treats a missing workflow getter as idle', () => {
        const runner = new GrblHalRunner();
        runner.settings.toolTable = { 1: { toolOffsets: { ...ORIGINAL } } };
        runner.state.status.currentTool = 1;
        runner.parse(PRB_SUCCESS);

        expect(runner.settings.toolTable[1].toolOffsets).toEqual(ORIGINAL);
    });

    it.each([WORKFLOW_STATE_RUNNING, WORKFLOW_STATE_PAUSED])(
        'updates the current tool offsets while %s',
        (state) => {
            const runner = makeRunner(state);
            runner.parse(PRB_SUCCESS);

            expect(runner.settings.toolTable[1].toolOffsets).toEqual({
                x: 5,
                y: 6,
                z: 7,
            });
        },
    );

    it('ignores a failed probe mid-job', () => {
        const runner = makeRunner(WORKFLOW_STATE_RUNNING);
        runner.parse(PRB_FAIL);

        expect(runner.settings.toolTable[1].toolOffsets).toEqual(ORIGINAL);
    });
});

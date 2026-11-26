// NOTE: require(), not import - the server logger needs GSENDER_LOG_LEVEL set
// before the module graph loads (see GrblHalAxsProbe.test.js).
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const GrblHalRunner = require('../GrblHalRunner').default;

// A successful PRB copies the probe Z into the current tool's offset, but only
// while the firmware runs a passed-through M6 (its tool change macro). Any
// other PRB - the tail of a $# dump, or a G38 touch-off in the program - must
// leave the tool table alone.

const PRB_SUCCESS = '[PRB:5.000,6.000,7.000:1]';
const PRB_FAIL = '[PRB:5.000,6.000,7.000:0]';
const ORIGINAL = { x: 1, y: 2, z: 3 };

function seed(runner) {
    runner.settings.toolTable = { 1: { toolOffsets: { ...ORIGINAL } } };
    runner.state.status.currentTool = 1;
    return runner;
}

function makeRunner(toolChangeActive) {
    return seed(
        new GrblHalRunner({ isToolChangeActive: () => toolChangeActive }),
    );
}

describe('GrblHalRunner PRB tool offset updates', () => {
    it('ignores PRB outside a tool change but still stores the parameter', () => {
        const runner = makeRunner(false);
        runner.parse(PRB_SUCCESS);

        expect(runner.settings.toolTable[1].toolOffsets).toEqual(ORIGINAL);
        expect(runner.settings.parameters.PRB).toMatchObject({
            x: '5.000',
            y: '6.000',
            z: '7.000',
            result: 1,
        });
    });

    it('treats a missing isToolChangeActive option as no tool change', () => {
        const runner = seed(new GrblHalRunner());
        runner.parse(PRB_SUCCESS);

        expect(runner.settings.toolTable[1].toolOffsets).toEqual(ORIGINAL);
    });

    it('updates only the Z offset during a tool change', () => {
        const runner = makeRunner(true);
        runner.parse(PRB_SUCCESS);

        expect(runner.settings.toolTable[1].toolOffsets).toEqual({
            x: 1,
            y: 2,
            z: 7,
        });
    });

    it('ignores a failed probe during a tool change', () => {
        const runner = makeRunner(true);
        runner.parse(PRB_FAIL);

        expect(runner.settings.toolTable[1].toolOffsets).toEqual(ORIGINAL);
    });
});

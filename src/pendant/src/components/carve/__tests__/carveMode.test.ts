import { isHomingAlarm, resolveCarveMode } from '../carveMode';

const base = {
    isConnected: true,
    workflowState: 'idle',
    activeState: 'Idle',
    wizardVisible: false,
};

describe('resolveCarveMode', () => {
    it('is disconnected when not connected, whatever else is true', () => {
        expect(
            resolveCarveMode({
                ...base,
                isConnected: false,
                workflowState: 'running',
                activeState: 'Alarm',
                wizardVisible: true,
            }),
        ).toBe('disconnected');
    });

    it('is toolchange when the wizard is visible', () => {
        expect(resolveCarveMode({ ...base, wizardVisible: true })).toBe(
            'toolchange',
        );
    });

    it('is toolchange when the controller reports Tool', () => {
        expect(
            resolveCarveMode({
                ...base,
                workflowState: 'paused',
                activeState: 'Tool',
            }),
        ).toBe('toolchange');
    });

    it('is alarm on Alarm', () => {
        expect(resolveCarveMode({ ...base, activeState: 'Alarm' })).toBe(
            'alarm',
        );
    });

    it('lets alarm win over a running job', () => {
        expect(
            resolveCarveMode({
                ...base,
                workflowState: 'running',
                activeState: 'Alarm',
            }),
        ).toBe('alarm');
    });

    it('is holdJob when the workflow is paused', () => {
        expect(
            resolveCarveMode({
                ...base,
                workflowState: 'paused',
                activeState: 'Idle',
            }),
        ).toBe('holdJob');
    });

    it('is holdJob when running and the controller is in Hold', () => {
        expect(
            resolveCarveMode({
                ...base,
                workflowState: 'running',
                activeState: 'Hold',
            }),
        ).toBe('holdJob');
    });

    it('is holdJob when running and the door is open', () => {
        expect(
            resolveCarveMode({
                ...base,
                workflowState: 'running',
                activeState: 'Door',
            }),
        ).toBe('holdJob');
    });

    it('is running when the workflow is running', () => {
        expect(
            resolveCarveMode({
                ...base,
                workflowState: 'running',
                activeState: 'Run',
            }),
        ).toBe('running');
    });

    it('is holdIdle on Hold with no job', () => {
        expect(resolveCarveMode({ ...base, activeState: 'Hold' })).toBe(
            'holdIdle',
        );
    });

    it('is holdIdle on Door with no job', () => {
        expect(resolveCarveMode({ ...base, activeState: 'Door' })).toBe(
            'holdIdle',
        );
    });

    it('is setup otherwise', () => {
        expect(resolveCarveMode(base)).toBe('setup');
        expect(resolveCarveMode({ ...base, activeState: 'Jog' })).toBe('setup');
    });
});

describe('isHomingAlarm', () => {
    it('matches 11 and Homing only', () => {
        expect(isHomingAlarm(11)).toBe(true);
        expect(isHomingAlarm('Homing')).toBe(true);
        expect(isHomingAlarm(2)).toBe(false);
        expect(isHomingAlarm(0)).toBe(false);
    });
});

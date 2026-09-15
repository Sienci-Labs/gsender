import {
    ALARM,
    ERROR,
    GRBL,
    GRBLHAL,
    isHomingRequiredAlarm,
} from 'app/constants';

// "Homing required" alarms are raised on connect whenever homing is enabled and
// the machine has not homed yet, so they are dropped entirely - not toasted and
// not written to the alarm history. Every other alarm must still get through.
describe('isHomingRequiredAlarm', () => {
    it("matches grbl's synthetic string code", () => {
        // Emitted by the startupAlarm handler in GrblController.
        expect(
            isHomingRequiredAlarm({
                type: ALARM,
                code: 'Homing',
                controller: GRBL,
            }),
        ).toBe(true);
    });

    it('matches grblHAL alarm 11', () => {
        expect(
            isHomingRequiredAlarm({
                type: ALARM,
                code: 11,
                controller: GRBLHAL,
            }),
        ).toBe(true);
    });

    it('matches grblHAL alarm 11 sent as a string', () => {
        expect(
            isHomingRequiredAlarm({
                type: ALARM,
                code: '11',
                controller: GRBLHAL,
            }),
        ).toBe(true);
    });

    it('does not treat grbl alarm 11 as homing', () => {
        // grbl's numeric alarms stop at 9, so an 11 from grbl is not this alarm.
        expect(
            isHomingRequiredAlarm({
                type: ALARM,
                code: 11,
                controller: GRBL,
            }),
        ).toBe(false);
    });

    it('still reports homing FAILURE alarms, which are real faults', () => {
        // grbl 6-9 are "Homing fail" - the user needs to see these.
        [6, 7, 8, 9].forEach((code) => {
            expect(
                isHomingRequiredAlarm({ type: ALARM, code, controller: GRBL }),
            ).toBe(false);
        });
    });

    it('does not suppress other alarms', () => {
        [1, 2, 3, 4, 5, 10, 12].forEach((code) => {
            expect(
                isHomingRequiredAlarm({
                    type: ALARM,
                    code,
                    controller: GRBLHAL,
                }),
            ).toBe(false);
        });
    });

    it('does not suppress errors, only alarms', () => {
        expect(
            isHomingRequiredAlarm({
                type: ERROR,
                code: 11,
                controller: GRBLHAL,
            }),
        ).toBe(false);
    });

    it('is safe on missing or empty input', () => {
        expect(isHomingRequiredAlarm(undefined)).toBe(false);
        expect(isHomingRequiredAlarm({})).toBe(false);
        expect(isHomingRequiredAlarm({ type: ALARM })).toBe(false);
    });
});

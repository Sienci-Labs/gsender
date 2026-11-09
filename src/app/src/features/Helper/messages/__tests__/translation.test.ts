import { GRBL, GRBLHAL } from 'app/constants';
import { changeLanguage } from 'app/i18n';
import { getEyebrow, normalizeHelperMessage } from '../normalize';

afterEach(async () => {
    await changeLanguage('en');
});

describe('helper message translation', () => {
    it('resolves registry text in the current language', async () => {
        const english = normalizeHelperMessage(
            { kind: 'alarm', code: 1 },
            { controllerType: GRBL },
        );
        expect(english?.title).toBe('Hard limit triggered');

        await changeLanguage('de');
        const german = normalizeHelperMessage(
            { kind: 'alarm', code: 1 },
            { controllerType: GRBL },
        );
        expect(german?.title).toBe('Hardware-Endschalter ausgelöst');
        expect(german?.steps?.[0]).toMatch(/Referenzfahrt/);
        expect(german?.resource?.label).toBe(
            'Alarm 1 & 2: Hardware- & Software-Endlagen',
        );
        // URLs are not translated
        expect(german?.resource?.url).toBe(english?.resource?.url);
    });

    it('keeps controller-supplied text as reported', async () => {
        await changeLanguage('fr');
        const message = normalizeHelperMessage(
            { kind: 'error', code: 22 },
            { controllerType: GRBL },
        );
        expect(message?.title).toBe('Undefined feed rate');

        const hal = normalizeHelperMessage(
            { kind: 'alarm', code: 3 },
            {
                controllerType: GRBLHAL,
                controllerAlarms: { 3: { description: 'From firmware' } },
            },
        );
        expect(hal?.description).toBe('From firmware');
    });

    it('keeps the Alarm/Error eyebrow and passes plain payload text through', async () => {
        await changeLanguage('es');
        const message = normalizeHelperMessage({
            kind: 'alarm',
            code: 9,
            title: 'Custom title',
            description: 'Custom text',
        });
        expect(getEyebrow(message!)).toBe('Alarm 9');
        expect(message?.title).toBe('Custom title');
        expect(
            getEyebrow(
                normalizeHelperMessage({
                    kind: 'tip',
                    title: 't',
                    description: 'd',
                })!,
            ),
        ).toBe('Consejo');
    });
});

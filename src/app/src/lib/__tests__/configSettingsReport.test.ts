import {
    SettingsMenu,
    type SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import {
    buildConfigSettingsReport,
    type ConfigReportSource,
} from 'app/lib/configSettingsReport';

const menu = [
    {
        label: 'Basics',
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'Carve screen units',
                        key: 'workspace.units',
                        type: 'radio',
                        description: 'Units on the carve screen.',
                        options: ['mm', 'in'],
                    },
                    {
                        label: 'Reconnect automatically',
                        key: 'widgets.connection.autoReconnect',
                        type: 'boolean',
                        description: 'Reconnect on open.',
                    },
                    {
                        label: 'Backup location',
                        key: 'workspace.backupLoc',
                        type: 'text',
                        description: 'Where backups are stored.',
                        hidden: () => true,
                    },
                ],
            },
            {
                label: 'Jogging Presets',
                settings: [
                    {
                        label: 'Rapid',
                        key: 'widgets.axes.jog.rapid',
                        type: 'jog',
                        description: 'Fast jog preset.',
                    },
                ],
            },
        ],
    },
    {
        label: 'Motors',
        settings: [
            {
                label: 'X-axis',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$100',
                    },
                    {
                        label: 'Minimum spindle speed',
                        key: 'widgets.spindle.spindleMin',
                        type: 'hybrid',
                        eID: '$31',
                        unit: 'rpm',
                        description: 'Minimum spindle speed.',
                    },
                ],
            },
        ],
    },
    {
        label: 'Automations',
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'File start',
                        type: 'event',
                        eventType: 'gcode:start',
                        description: 'Runs before the file.',
                    },
                ],
            },
        ],
    },
] as SettingsMenuSection[];

function source(
    overrides: Partial<ConfigReportSource> = {},
): ConfigReportSource {
    const values: Record<string, unknown> = {
        'workspace.units': 'mm',
        'widgets.connection.autoReconnect': false,
        'widgets.axes.jog.rapid': {
            xyStep: 25.4,
            zStep: 5,
            aStep: 1,
            feedrate: 2540,
        },
        'widgets.spindle.spindleMin': 1000,
    };
    const defaults: Record<string, unknown> = {
        'workspace.units': 'mm',
        'widgets.connection.autoReconnect': true,
        'widgets.axes.jog.rapid': {
            xyStep: 25.4,
            zStep: 5,
            aStep: 1,
            feedrate: 2540,
        },
        'widgets.spindle.spindleMin': 1000,
    };

    return {
        getStoreValue: (key, fallback) =>
            Object.hasOwn(values, key) ? values[key] : fallback,
        getDefaultValue: (key) =>
            Object.hasOwn(defaults, key) ? defaults[key] : null,
        eeprom: {
            $100: '200',
            $31: '10000',
            $4: '1',
        },
        descriptions: {
            '100': {
                description: 'X-axis travel resolution',
                details: 'Steps per mm for X.',
                unit: 'step/mm',
                dataType: 5,
            },
            '4': {
                description: 'Invert step enable pin',
                details: 'Inverts the enable pin.',
                dataType: 0,
            },
            '31': {
                description: 'Minimum spindle speed',
                details: 'Lowest spindle rpm.',
                unit: 'rpm',
                dataType: 5,
            },
        },
        connected: true,
        controllerType: 'Grbl',
        machineProfile: {
            id: 1,
            company: 'Sienci',
            name: 'LongMill',
            type: 'MK2',
            version: '1',
            mm: { width: 1, depth: 1, height: 1 },
            eepromSettings: {
                $100: '200',
                $31: '10000',
                $4: '0',
            },
        },
        events: {
            'gcode:start': {
                enabled: true,
                commands: 'M3 S1000',
            },
        },
        ...overrides,
    };
}

describe('buildConfigSettingsReport', () => {
    test('walks the real config menu in the same section order', () => {
        const report = buildConfigSettingsReport(SettingsMenu, {
            getStoreValue: () => undefined,
            getDefaultValue: () => null,
            eeprom: {},
            connected: false,
            events: {},
        });

        const menuLabels = SettingsMenu.map((section) => section.label);
        const reportLabels = report.map((section) => section.label);
        expect(reportLabels).not.toContain('Customize UI');
        let previousIndex = -1;
        reportLabels.forEach((label) => {
            const index = menuLabels.indexOf(label);
            expect(index).toBeGreaterThan(previousIndex);
            previousIndex = index;
        });
        const basics = report.find((section) => section.label === 'Basics');
        expect(
            basics?.subsections
                .flatMap((subsection) => subsection.rows)
                .some((row) => row.label === 'Carve screen units'),
        ).toBe(true);
    });

    test('mirrors config sections and hides settings the page would hide', () => {
        const report = buildConfigSettingsReport(menu, source());

        expect(report.map((section) => section.label)).toEqual([
            'Basics',
            'Motors',
            'Automations',
        ]);
        expect(report[0].subsections[0].label).toBe('');
        expect(report[0].subsections[1].label).toBe('Jogging Presets');

        const basics = report[0].subsections[0].rows.map((row) => row.label);
        expect(basics).toEqual([
            'Carve screen units',
            'Reconnect automatically',
        ]);

        const reconnect = report[0].subsections[0].rows[1];
        expect(reconnect.value).toBe('Off');
        expect(reconnect.changed).toBe(true);

        const units = report[0].subsections[0].rows[0];
        expect(units.value).toBe('mm');
        expect(units.changed).toBe(false);
    });

    test('formats jog presets and automation events like their controls', () => {
        const report = buildConfigSettingsReport(menu, source());
        const rapid = report[0].subsections[1].rows[0];
        expect(rapid.value).toBe(
            'XY: 25.4 mm\nZ: 5 mm\nA: 1 deg\nSpeed: 2540 mm/min',
        );

        const fileStart = report[2].subsections[0].rows[0];
        expect(fileStart.value).toBe('On\nM3 S1000');
    });

    test('omits firmware rows when disconnected and shows them with config labels when connected', () => {
        const disconnected = buildConfigSettingsReport(
            menu,
            source({ connected: false }),
        );
        expect(disconnected.map((section) => section.label)).toEqual([
            'Basics',
            'Automations',
        ]);

        const connected = buildConfigSettingsReport(menu, source());
        const xAxis = connected[1].subsections[0];
        expect(xAxis.label).toBe('X-axis');
        expect(xAxis.rows[0]).toMatchObject({
            label: 'X-axis travel resolution',
            value: '200 step/mm',
            changed: false,
        });
        expect(xAxis.rows[0].description).toContain('($100, Default 200)');
        expect(xAxis.rows[1]).toMatchObject({
            label: 'Minimum spindle speed',
            value: '1000 rpm',
        });
    });

    test('uses firmware names for hybrid settings on grblHAL', () => {
        const report = buildConfigSettingsReport(
            menu,
            source({ controllerType: 'grblHAL' }),
        );
        const rows = report[1].subsections[0].rows;
        expect(rows[1]).toMatchObject({
            label: 'Minimum spindle speed',
            value: '10000 rpm',
            changed: false,
        });
    });

    test('prints bitfield and axis mask settings as labeled switches', () => {
        const maskMenu = [
            {
                label: 'Pins',
                settings: [
                    {
                        label: '',
                        settings: [
                            { type: 'eeprom', eID: '$3' },
                            { type: 'eeprom', eID: '$2' },
                        ],
                    },
                ],
            },
        ] as unknown as SettingsMenuSection[];

        const report = buildConfigSettingsReport(
            maskMenu,
            source({
                eeprom: { $3: '5', $2: '1' },
                descriptions: {
                    '3': {
                        description: 'Step direction invert',
                        dataType: 4,
                    },
                    '2': {
                        description: 'Step pulse invert',
                        dataType: 1,
                        format: ['X', 'Y', 'Z'],
                    },
                },
                axes: ['X', 'Y', 'Z'],
                machineProfile: {
                    id: 1,
                    company: 'Sienci',
                    name: 'LongMill',
                    type: 'MK2',
                    version: '1',
                    mm: { width: 1, depth: 1, height: 1 },
                    eepromSettings: { $3: '5', $2: '1' },
                },
            }),
        );

        const rows = report[0].subsections[0].rows;
        expect(rows[0].value).toBe('X: On\nY: Off\nZ: On');
        expect(rows[1].value).toBe('X: On\nY: Off\nZ: Off');
    });

    test('shows boolean firmware settings as on or off and highlights non-defaults', () => {
        const withBoolean = [
            {
                label: 'Pins',
                settings: [
                    {
                        label: '',
                        settings: [{ type: 'eeprom', eID: '$4' }],
                    },
                ],
            },
        ] as unknown as SettingsMenuSection[];

        const report = buildConfigSettingsReport(withBoolean, source());
        expect(report[0].subsections[0].rows[0]).toMatchObject({
            label: 'Invert step enable pin',
            value: 'On',
            changed: true,
        });
    });
});

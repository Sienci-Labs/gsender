import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { GRBL, GRBLHAL, IMPERIAL_UNITS } from 'app/constants';
import type {
    EEPROM,
    EEPROMSettings,
    MachineProfile,
} from 'app/definitions/firmware';
import {
    GRBL_HAL_SETTINGS_MAP,
    GRBL_SETTINGS_MAP,
} from 'app/features/Config/assets/SettingsDescriptions.ts';
import type {
    gSenderSetting,
    SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import {
    resolveGrblCoreDefaults,
    translateGrblCoreKey,
} from 'app/features/Config/utils/grblCoreMigration.ts';
import { convertToImperial } from 'app/lib/units';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

export type ConfigReportEmphasis = 'on' | 'off';

export type ConfigReportRow = {
    label: string;
    description: string;
    value: string;
    changed: boolean;
    emphasis?: ConfigReportEmphasis;
};

export type ConfigReportSubsection = {
    label: string;
    rows: ConfigReportRow[];
};

export type ConfigReportSection = {
    id: string;
    label: string;
    subsections: ConfigReportSubsection[];
};

export type DiagnosticEventRecord = {
    enabled?: boolean;
    commands?: string;
};

type EepromDescription = {
    description?: string;
    details?: string;
    unit?: string;
    units?: string;
    unitString?: string;
    dataType?: string | number;
    format?: string | string[] | null;
};

export type ConfigReportSource = {
    getStoreValue: (key: string, defaultValue?: unknown) => unknown;
    getDefaultValue: (key: string) => unknown;
    eeprom: EEPROMSettings | Record<string, string>;
    descriptions?: object;
    connected: boolean;
    controllerType?: string;
    firmwareSemver?: number | string;
    boardId?: string;
    machineProfile?: MachineProfile | null;
    events?: Record<string, DiagnosticEventRecord | undefined>;
    axes?: string[];
};

const EMPTY = '—';
const BOOLEAN_TYPE = 0;
const BITFIELD_TYPE = 1;
const EXCLUSIVE_BITFIELD_TYPE = 2;
const RADIO_TYPE = 3;
const AXIS_MASK_TYPE = 4;
const INTEGER_TYPE = 5;
const DECIMAL_TYPE = 6;
const PASSWORD_TYPE = 8;

function filterNewlines(data = '') {
    return data.replace(/\\n/gim, '\n');
}

function slugify(label: string) {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `config-${slug || 'section'}`;
}

function isBlank(value: unknown) {
    return value === undefined || value === null || value === '';
}

function settingDescription(
    description: gSenderSetting['description'],
): string {
    if (typeof description === 'string') {
        return description;
    }
    if (Array.isArray(description)) {
        return description
            .filter((part): part is string => typeof part === 'string')
            .join('');
    }
    return '';
}

function firmwareIsCurrent(semver: number | string | undefined) {
    const numeric = Number(semver);
    if (!Number.isFinite(numeric) || numeric === 0) {
        return false;
    }
    return numeric >= ATCI_SUPPORTED_VERSION;
}

function workspaceUnits(source: ConfigReportSource) {
    const units = source.getStoreValue('workspace.units', 'mm');
    return units === IMPERIAL_UNITS ? IMPERIAL_UNITS : 'mm';
}

function formatQuantity(
    value: unknown,
    unit: string | undefined,
    units: string,
) {
    if (isBlank(value) || Number.isNaN(value)) {
        return EMPTY;
    }

    let display: unknown = value;
    let suffix = unit;

    if (unit === 'variable') {
        suffix = units;
        const numeric = Number(value);
        if (units === IMPERIAL_UNITS && Number.isFinite(numeric)) {
            display = convertToImperial(numeric);
        }
    }

    const text = String(display);
    return suffix ? `${text} ${suffix}` : text;
}

function formatBoolean(value: unknown): {
    value: string;
    emphasis: ConfigReportEmphasis;
} {
    const on =
        value === true || value === 1 || value === '1' || value === 'true';
    return {
        value: on ? 'On' : 'Off',
        emphasis: on ? 'on' : 'off',
    };
}

function formatJog(value: unknown, units: string) {
    if (!value || typeof value !== 'object') {
        return EMPTY;
    }
    const jog = value as Record<string, unknown>;
    const imperial = units === IMPERIAL_UNITS;
    const convert = (entry: unknown) => {
        const numeric = Number(entry);
        if (!Number.isFinite(numeric)) {
            return EMPTY;
        }
        return imperial ? String(convertToImperial(numeric)) : String(entry);
    };
    const speedUnit = imperial ? 'in/min' : 'mm/min';
    return [
        `XY: ${convert(jog.xyStep)} ${units}`,
        `Z: ${convert(jog.zStep)} ${units}`,
        `A: ${isBlank(jog.aStep) ? EMPTY : jog.aStep} deg`,
        `Speed: ${convert(jog.feedrate)} ${speedUnit}`,
    ].join('\n');
}

function formatLocation(value: unknown, unit = 'mm') {
    if (!value || typeof value !== 'object') {
        return EMPTY;
    }
    const location = value as Record<string, unknown>;
    return ['x', 'y', 'z']
        .map((axis) => {
            const axisValue = location[axis];
            return `${axis.toUpperCase()}: ${isBlank(axisValue) ? EMPTY : axisValue} ${unit}`;
        })
        .join('\n');
}

function formatIp(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
        return EMPTY;
    }
    return value.map((part) => (isBlank(part) ? '0' : String(part))).join('.');
}

function formatEvent(record: DiagnosticEventRecord | undefined) {
    const enabled = Boolean(record?.enabled);
    const commands = record?.commands?.trim()
        ? record.commands
        : '; No commands set';
    return {
        value: `${enabled ? 'On' : 'Off'}\n${commands}`,
        emphasis: (enabled ? 'on' : 'off') as ConfigReportEmphasis,
    };
}

function resolveEepromId(
    setting: gSenderSetting,
    source: ConfigReportSource,
    currentFirmware: boolean,
) {
    let eID = setting.eID;
    if (setting.remap && currentFirmware) {
        eID = setting.remap;
    }
    if (source.controllerType === GRBLHAL && eID) {
        eID = translateGrblCoreKey(
            eID,
            Number(source.firmwareSemver),
            source.boardId,
        );
    }
    return eID;
}

function lookupEepromMeta(
    resolvedId: string,
    source: ConfigReportSource,
): EepromDescription & { label: string } {
    const numericKey = resolvedId.replace('$', '');
    const descriptions = (source.descriptions || {}) as Record<
        string,
        EepromDescription
    >;
    const live =
        descriptions[numericKey] ||
        (descriptions as Record<number, EepromDescription>)[
            Number(numericKey)
        ];
    const map =
        source.controllerType === GRBLHAL
            ? GRBL_HAL_SETTINGS_MAP
            : GRBL_SETTINGS_MAP;
    const stat = (map.get(resolvedId as EEPROM) ||
        GRBL_SETTINGS_MAP.get(resolvedId as EEPROM)) as
        | (EepromDescription & {
              description?: string;
              details?: string;
              units?: string;
          })
        | undefined;

    return {
        label: live?.description || stat?.description || resolvedId,
        details: filterNewlines(live?.details || stat?.details || ''),
        unit: live?.unit || live?.unitString || stat?.units || '',
        dataType:
            live?.dataType !== undefined ? live.dataType : stat?.dataType,
        format: live?.format ?? null,
    };
}

function profileDefaults(source: ConfigReportSource) {
    const profile = source.machineProfile;
    if (!profile) {
        return {};
    }
    if (source.controllerType === GRBL) {
        return profile.eepromSettings || {};
    }
    return resolveGrblCoreDefaults({
        firmwareSemver: Number(source.firmwareSemver),
        baseDefaults: profile.grblHALeepromSettings || {},
        boardId: source.boardId,
    }).defaults;
}

function eepromDefaultValue(resolvedId: string, source: ConfigReportSource) {
    return get(profileDefaults(source), resolvedId, '-');
}

function eepromChanged(
    value: unknown,
    defaultValue: unknown,
    dataType: number | undefined,
) {
    if (defaultValue === '-' || defaultValue === undefined) {
        return false;
    }
    if (
        dataType === INTEGER_TYPE ||
        dataType === DECIMAL_TYPE ||
        dataType === undefined
    ) {
        const numericValue = Number(value);
        const numericDefault = Number(defaultValue);
        if (Number.isFinite(numericValue) && Number.isFinite(numericDefault)) {
            return numericValue.toFixed(3) !== numericDefault.toFixed(3);
        }
    }
    const numericValue = Number(value);
    const numericDefault = Number(defaultValue);
    if (Number.isFinite(numericValue) && Number.isFinite(numericDefault)) {
        return numericValue !== numericDefault;
    }
    return !isEqual(String(value), String(defaultValue));
}

function formatBitfield(
    value: unknown,
    labels: string[] | undefined,
): string | null {
    if (!labels || labels.length === 0) {
        return null;
    }
    const bits = Number(value).toString(2).split('').map(Number).reverse();
    const lines = labels
        .map((label, index) => {
            if (!label || label === 'N/A') {
                return null;
            }
            return `${label}: ${bits[index] === 1 ? 'On' : 'Off'}`;
        })
        .filter((line): line is string => line !== null);
    return lines.length > 0 ? lines.join('\n') : null;
}

function formatEepromValue(
    value: unknown,
    meta: EepromDescription,
    axes: string[] | undefined,
): { value: string; emphasis?: ConfigReportEmphasis } {
    const dataType =
        meta.dataType === undefined ? undefined : Number(meta.dataType);
    if (dataType === PASSWORD_TYPE) {
        return { value: isBlank(value) ? EMPTY : '••••••' };
    }
    if (dataType === BOOLEAN_TYPE) {
        return formatBoolean(value);
    }
    if (dataType === RADIO_TYPE && Array.isArray(meta.format)) {
        const selected = meta.format[Number(value)];
        if (selected) {
            return { value: String(selected) };
        }
    }
    if (
        dataType === BITFIELD_TYPE ||
        dataType === EXCLUSIVE_BITFIELD_TYPE ||
        dataType === AXIS_MASK_TYPE
    ) {
        let labels: string[] | undefined;
        if (Array.isArray(meta.format)) {
            labels = meta.format;
        } else if (dataType === AXIS_MASK_TYPE) {
            labels = axes;
        }
        const bitfield = formatBitfield(value, labels);
        if (bitfield) {
            return { value: bitfield };
        }
    }
    const text = isBlank(value) ? EMPTY : String(value);
    const unit = meta.unit && meta.unit !== 'boolean' ? meta.unit : '';
    return { value: unit && text !== EMPTY ? `${text} ${unit}` : text };
}

function settingIsHidden(
    setting: gSenderSetting,
    source: ConfigReportSource,
    currentFirmware: boolean,
) {
    if (setting.hideWhenFirmwareCurrent && currentFirmware) {
        return true;
    }
    if (typeof setting.hidden !== 'function') {
        return false;
    }
    try {
        return Boolean(setting.hidden(source.getStoreValue));
    } catch {
        return false;
    }
}

function usesEepromValue(setting: gSenderSetting, source: ConfigReportSource) {
    if (setting.type === 'eeprom') {
        return true;
    }
    return setting.type === 'hybrid' && source.controllerType === GRBLHAL;
}

function buildAppRow(
    setting: gSenderSetting,
    source: ConfigReportSource,
): ConfigReportRow | null {
    if (setting.type === 'wizard') {
        return {
            label: setting.label || 'Tool',
            description: settingDescription(setting.description),
            value: '',
            changed: false,
        };
    }

    if (setting.type === 'event') {
        const record = source.events?.[setting.eventType || ''];
        const formatted = formatEvent(record);
        return {
            label: setting.label || setting.eventType || 'Event',
            description: settingDescription(setting.description),
            value: formatted.value,
            changed: false,
            emphasis: formatted.emphasis,
        };
    }

    const rawValue = setting.key
        ? source.getStoreValue(setting.key)
        : undefined;
    let displayValue = rawValue;
    if (setting.valueTransform) {
        try {
            displayValue = setting.valueTransform(rawValue);
        } catch {
            displayValue = rawValue;
        }
    }

    const units = workspaceUnits(source);
    let value = EMPTY;
    let emphasis: ConfigReportEmphasis | undefined;

    if (setting.type === 'boolean') {
        const formatted = formatBoolean(displayValue);
        value = formatted.value;
        emphasis = formatted.emphasis;
    } else if (setting.type === 'number' || setting.type === 'hybrid') {
        value = formatQuantity(displayValue, setting.unit, units);
    } else if (setting.type === 'jog') {
        value = formatJog(displayValue, units);
    } else if (setting.type === 'location') {
        value = formatLocation(displayValue, setting.unit || 'mm');
    } else if (setting.type === 'ip') {
        value = formatIp(displayValue);
    } else if (
        setting.type === 'select' ||
        setting.type === 'radio' ||
        setting.type === 'text' ||
        setting.type === 'textarea'
    ) {
        value = isBlank(displayValue) ? EMPTY : String(displayValue);
    } else if (typeof displayValue === 'boolean') {
        const formatted = formatBoolean(displayValue);
        value = formatted.value;
        emphasis = formatted.emphasis;
    } else if (!isBlank(displayValue)) {
        value =
            typeof displayValue === 'object'
                ? JSON.stringify(displayValue)
                : String(displayValue);
    }

    const defaultValue = setting.key
        ? source.getDefaultValue(setting.key)
        : null;
    const changed =
        Boolean(setting.key) &&
        !setting.ignoreDefaultCheck &&
        !isEqual(rawValue, defaultValue);

    return {
        label: setting.label || setting.key || 'Setting',
        description: settingDescription(setting.description),
        value,
        changed,
        emphasis,
    };
}

function buildEepromRow(
    setting: gSenderSetting,
    source: ConfigReportSource,
    currentFirmware: boolean,
): ConfigReportRow | null {
    const resolvedId = resolveEepromId(setting, source, currentFirmware);
    const eepromValues = source.eeprom as Record<string, string>;
    if (!resolvedId || !Object.hasOwn(eepromValues, resolvedId)) {
        return null;
    }

    const meta = lookupEepromMeta(resolvedId, source);
    const currentValue = eepromValues[resolvedId];
    const defaultValue = eepromDefaultValue(resolvedId, source);
    const dataType =
        meta.dataType === undefined ? undefined : Number(meta.dataType);
    const formatted = formatEepromValue(currentValue, meta, source.axes);
    const idNote = `(${resolvedId}, Default ${defaultValue})`;
    const description = meta.details ? `${meta.details} ${idNote}` : idNote;

    return {
        label: meta.label || setting.label || resolvedId,
        description,
        value: formatted.value,
        changed: eepromChanged(currentValue, defaultValue, dataType),
        emphasis: formatted.emphasis,
    };
}

function buildRow(
    setting: gSenderSetting,
    source: ConfigReportSource,
    currentFirmware: boolean,
): ConfigReportRow | null {
    if (settingIsHidden(setting, source, currentFirmware)) {
        return null;
    }

    const eepromLike =
        setting.type === 'eeprom' || setting.type === 'hybrid';
    if (eepromLike && !source.connected) {
        return null;
    }

    if (usesEepromValue(setting, source)) {
        return buildEepromRow(setting, source, currentFirmware);
    }

    return buildAppRow(setting, source);
}

export function buildConfigSettingsReport(
    menu: SettingsMenuSection[],
    source: ConfigReportSource,
): ConfigReportSection[] {
    const currentFirmware = firmwareIsCurrent(source.firmwareSemver);
    const sections: ConfigReportSection[] = [];

    menu.forEach((section) => {
        const subsections: ConfigReportSubsection[] = [];
        (section.settings || []).forEach((subsection) => {
            const rows = (subsection.settings || [])
                .map((setting) => buildRow(setting, source, currentFirmware))
                .filter((row): row is ConfigReportRow => row !== null);
            if (rows.length === 0) {
                return;
            }
            subsections.push({
                label: subsection.label || '',
                rows,
            });
        });

        if (subsections.length === 0 || !section.label) {
            return;
        }

        sections.push({
            id: slugify(section.label),
            label: section.label,
            subsections,
        });
    });

    return sections;
}

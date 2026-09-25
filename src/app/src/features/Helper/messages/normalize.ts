import { GRBLHAL } from 'app/constants';
import {
    GRBL_ALARMS,
    GRBL_ERRORS,
} from '../../../../../server/controllers/Grbl/constants';
import {
    GRBL_HAL_ALARMS,
    GRBL_HAL_ERRORS,
} from '../../../../../server/controllers/Grblhal/constants';
import { DEFAULT_RESOURCES, HELPER_REGISTRY } from './registry';
import { KIND_META } from './styles';
import type {
    ControllerCodeText,
    HelperMessage,
    HelperNormalizeContext,
    HelperPayload,
    HelperResource,
    NormalizedHelperMessage,
} from './types';

export const NO_DESCRIPTION = 'No matching description found';

export const DISMISSED_STORE_PREFIX = 'widgets.helper.dismissed';

const LEGACY_RESOURCE_LABEL = 'Sienci resources';

interface CodeEntry extends ControllerCodeText {
    code: number | string;
}

const findByCode = (list: CodeEntry[], code: string | number) =>
    list.find((entry) => String(entry.code) === String(code));

// The controller's own title/description for an alarm or error code
const lookupControllerText = (
    kind: 'alarm' | 'error',
    code: string | number,
    context: HelperNormalizeContext,
): Partial<HelperMessage> => {
    const isHal = context.controllerType === GRBLHAL;
    let lists: CodeEntry[];
    if (kind === 'alarm') {
        lists = isHal ? GRBL_HAL_ALARMS : GRBL_ALARMS;
    } else {
        lists = isHal ? GRBL_HAL_ERRORS : GRBL_ERRORS;
    }
    const entry = findByCode(lists, code);

    // grblHAL reports its own alarm descriptions, which win over our constants
    const halEntry =
        isHal && kind === 'alarm'
            ? context.controllerAlarms?.[Number(code)]
            : null;

    const title = halEntry?.message || entry?.message;
    const description = halEntry?.description || entry?.description;

    return {
        title: title || `${KIND_META[kind].label} ${code}`,
        description: description || NO_DESCRIPTION,
    };
};

const lookupRegistry = (
    kind: string,
    code: string | number,
    context: HelperNormalizeContext,
): Partial<HelperMessage> => {
    const key = `${kind}:${code}`;
    const controllerKey = context.controllerType
        ? `${context.controllerType.toLowerCase()}:${key}`
        : null;
    return (controllerKey && HELPER_REGISTRY[controllerKey]) ||
        HELPER_REGISTRY[key] ||
        {};
};

const withResourceDefaults = (
    resource?: HelperResource,
): HelperResource | undefined => {
    if (!resource || (resource.link === false && resource.qr === false)) {
        return undefined;
    }
    return { link: true, qr: true, ...resource };
};

// Drop keys set to undefined so they don't clobber earlier layers in a spread
const defined = <T extends object>(obj: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as Partial<T>;

/**
 * Turns any 'helper:info' payload (including the legacy
 * { title, description, content, qrCode, resourceLink } shape) into a full
 * message. Returns null when the message has been dismissed permanently.
 */
export const normalizeHelperMessage = (
    payload: HelperPayload,
    context: HelperNormalizeContext = {},
): NormalizedHelperMessage | null => {
    const { qrCode, resourceLink, ...fields } = payload || {};

    if (fields.dismissKey && context.isDismissed?.(fields.dismissKey)) {
        return null;
    }

    const kind = fields.kind ?? 'info';

    let legacyResource: HelperResource | undefined;
    if (qrCode) {
        legacyResource = { label: LEGACY_RESOURCE_LABEL, url: qrCode };
    } else if (resourceLink) {
        legacyResource = {
            label: LEGACY_RESOURCE_LABEL,
            url: resourceLink,
            qr: false,
        };
    }

    let controllerText: Partial<HelperMessage> = {};
    let registryEntry: Partial<HelperMessage> = {};
    if ((kind === 'alarm' || kind === 'error') && fields.code !== undefined) {
        controllerText = lookupControllerText(kind, fields.code, context);
        registryEntry = lookupRegistry(kind, fields.code, context);
    }

    // Later layers win: controller text < registry < explicit payload
    const merged = {
        ...controllerText,
        ...defined(registryEntry),
        ...defined(fields),
    };

    return {
        ...merged,
        kind,
        weight: merged.weight ?? KIND_META[kind].defaultWeight,
        title: merged.title ?? '',
        description: merged.description ?? '',
        resource: withResourceDefaults(
            merged.resource ?? legacyResource ?? DEFAULT_RESOURCES[kind],
        ),
    };
};

// "ALARM 9", "ERROR", "Maintenance"; case is applied by CSS
export const getEyebrow = (message: NormalizedHelperMessage): string => {
    if (message.eyebrow) {
        return message.eyebrow;
    }
    const label = KIND_META[message.kind].label;
    return message.code !== undefined ? `${label} ${message.code}` : label;
};

export const getDismissStoreKey = (key: string) =>
    `${DISMISSED_STORE_PREFIX}.${key}`;

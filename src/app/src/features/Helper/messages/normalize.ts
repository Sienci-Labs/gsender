import { GRBLHAL } from 'app/constants';
import { i18n, translateKey } from 'app/i18n';
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
    HelperAction,
    HelperMessage,
    HelperNormalizeContext,
    HelperPayload,
    HelperResource,
    NormalizedHelperMessage,
} from './types';

// English text, kept for callers comparing against it; the message itself
// uses the translation.
export const NO_DESCRIPTION = 'No matching description found';

export const DISMISSED_STORE_PREFIX = 'widgets.helper.dismissed';

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

    // Controller text stays as reported (English); only our fallbacks translate
    return {
        title: title || `${translateKey(KIND_META[kind].label)} ${code}`,
        description: description || i18n.t('helper:message.noDescription'),
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
    return (
        (controllerKey && HELPER_REGISTRY[controllerKey]) ||
        HELPER_REGISTRY[key] ||
        {}
    );
};

const withResourceDefaults = (
    resource?: HelperResource,
): HelperResource | undefined => {
    if (!resource || (resource.link === false && resource.qr === false)) {
        return undefined;
    }
    return { link: true, qr: true, ...resource };
};

const translateResource = (
    resource?: HelperResource,
): HelperResource | undefined =>
    resource && { ...resource, label: translateKey(resource.label) };

const translateAction = (action?: HelperAction): HelperAction | undefined =>
    action && { ...action, label: translateKey(action.label) };

/**
 * Resolves tk() keys in a message's text fields to the current language.
 * Plain text (controller descriptions, publishers' own strings) passes
 * through unchanged. Runs on every normalize, so re-normalizing after a
 * language change picks up the new language.
 */
const translateMessage = (
    message: Partial<HelperMessage>,
): Partial<HelperMessage> => {
    const out = { ...message };
    if (typeof out.title === 'string') {
        out.title = translateKey(out.title);
    }
    if (typeof out.description === 'string') {
        out.description = translateKey(out.description);
    }
    if (typeof out.eyebrow === 'string') {
        out.eyebrow = translateKey(out.eyebrow);
    }
    if (typeof out.content === 'string') {
        out.content = translateKey(out.content);
    }
    if (out.steps) {
        out.steps = out.steps.map((step) => translateKey(step));
    }
    if (out.resource) {
        out.resource = translateResource(out.resource);
    }
    if (out.checklist) {
        out.checklist = out.checklist.map((item) => ({
            ...item,
            label: translateKey(item.label),
        }));
    }
    if (out.progress) {
        out.progress = {
            ...out.progress,
            label: translateKey(out.progress.label),
        };
    }
    for (const key of [
        'primaryAction',
        'secondaryAction',
        'tertiaryAction',
    ] as const) {
        if (out[key]) {
            out[key] = translateAction(out[key]);
        }
    }
    return out;
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

    const legacyLabel = i18n.t('helper:message.legacyResource');
    let legacyResource: HelperResource | undefined;
    if (qrCode) {
        legacyResource = { label: legacyLabel, url: qrCode };
    } else if (resourceLink) {
        legacyResource = {
            label: legacyLabel,
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
    // Controller text is left as reported; registry and payload text may be
    // tk() keys and is translated here, at normalize time.
    const merged: Partial<HelperMessage> = {
        ...controllerText,
        ...translateMessage(defined(registryEntry)),
        ...translateMessage(defined(fields)),
    };
    const resource =
        merged.resource ??
        legacyResource ??
        translateResource(DEFAULT_RESOURCES[kind]);

    return {
        ...merged,
        kind,
        weight: merged.weight ?? KIND_META[kind].defaultWeight,
        title: merged.title ?? '',
        description: merged.description ?? '',
        resource: withResourceDefaults(resource),
    };
};

// "ALARM 9", "ERROR", "Maintenance"; case is applied by CSS
export const getEyebrow = (message: NormalizedHelperMessage): string => {
    if (message.eyebrow) {
        return message.eyebrow;
    }
    const label = translateKey(KIND_META[message.kind].label);
    return message.code !== undefined ? `${label} ${message.code}` : label;
};

export const getDismissStoreKey = (key: string) =>
    `${DISMISSED_STORE_PREFIX}.${key}`;

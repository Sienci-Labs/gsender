import type { HelperMessage } from './types';

// Extra content per alarm/error, merged over the controller's own text one
// field at a time (so an entry can add only a `resource` or `steps`).
// Keys are `${kind}:${code}`, e.g. 'alarm:9'. A controller-specific key such
// as 'grblhal:alarm:9' is checked first.
export const HELPER_REGISTRY: Record<string, Partial<HelperMessage>> = {};

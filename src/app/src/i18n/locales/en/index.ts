// English is the source language and is always bundled.
// When you add a namespace, add its JSON file here and in `NAMESPACES`.
import common from './common.json';
import config from './config.json';
import helper from './helper.json';
import notifications from './notifications.json';
import workspace from './workspace.json';

export const resources = {
    common,
    config,
    helper,
    notifications,
    workspace,
} as const;

export type Namespace = keyof typeof resources;

export const NAMESPACES = Object.keys(resources) as Namespace[];

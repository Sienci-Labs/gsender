// English is the source language and is always bundled.
// When you add a namespace, add its JSON file here and in `NAMESPACES`.
import atc from './atc.json';
import common from './common.json';
import config from './config.json';
import helper from './helper.json';
import notifications from './notifications.json';
import probe from './probe.json';
import wizards from './wizards.json';
import workspace from './workspace.json';

export const resources = {
    atc,
    common,
    config,
    helper,
    notifications,
    probe,
    wizards,
    workspace,
} as const;

export type Namespace = keyof typeof resources;

export const NAMESPACES = Object.keys(resources) as Namespace[];

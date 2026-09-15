import { useRef } from 'react';

import { usePluginIframeTheme } from '../hooks/usePluginIframeTheme';
import { usePlugins } from '../hooks/usePlugins';
import type { PluginRecord } from '../types';
import PluginPanel from './PluginPanel';

type PluginTabPanelProps = {
    plugin: PluginRecord;
    isActive: boolean;
};

// reuses PluginPanel so the iframe window gets registered with the
// plugin's granted capabilities
export const PluginTabPanel = ({ plugin, isActive }: PluginTabPanelProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    usePluginIframeTheme(iframeRef, isActive);

    if (!isActive) {
        return null;
    }

    return <PluginPanel plugin={plugin} className="min-h-[280px]" />;
};

type PluginTabIframeProps = {
    pluginId: string;
    isActive: boolean;
};

export const PluginTabIframe = ({
    pluginId,
    isActive,
}: PluginTabIframeProps) => {
    const { plugins } = usePlugins();
    const plugin = plugins.find((p) => p.id === pluginId);

    if (!plugin) {
        return <p className="text-sm text-gray-500 p-4">Plugin unavailable.</p>;
    }

    return <PluginTabPanel plugin={plugin} isActive={isActive} />;
};

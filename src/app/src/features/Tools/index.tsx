import { ATCWidget } from 'app/features/ATC';
import { PluginTabPanel } from 'app/features/Plugins/components/PluginTabPanel';
import { usePlugins } from 'app/features/Plugins/hooks/usePlugins';
import type { PluginRecord } from 'app/features/Plugins/types';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { useWidgetState } from 'app/hooks/useWidgetState';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { tk } from 'app/i18n';
import type { RootState } from 'app/store/redux';
import { useMemo } from 'react';
import { Tabs } from '../../components/Tabs';
import { Widget } from '../../components/Widget';
import Console from '../Console';
import Coolant from '../Coolant';
import Macros from '../Macros';
import Probe from '../Probe';
import Rotary from '../Rotary';
import Spindle from '../Spindle';

export interface TabItem {
    label: string;
    content: React.ComponentType<{ isActive: boolean }>;
}

// Tabs translates these keys; they also identify the tabs filtered below
const TAB_LABELS = {
    probe: tk('tools:tabs.probe'),
    macros: tk('tools:tabs.macros'),
    spindleLaser: tk('tools:tabs.spindleLaser'),
    atc: tk('tools:tabs.atc'),
    coolant: tk('tools:tabs.coolant'),
    rotary: tk('tools:tabs.rotary'),
    console: tk('tools:tabs.console'),
};

const tabs = [
    {
        label: TAB_LABELS.probe,
        content: Probe,
    },
    {
        label: TAB_LABELS.macros,
        content: Macros,
    },
    {
        label: TAB_LABELS.spindleLaser,
        content: Spindle,
    },
    {
        label: TAB_LABELS.atc,
        content: ATCWidget,
    },
    {
        label: TAB_LABELS.coolant,
        content: Coolant,
    },
    {
        label: TAB_LABELS.rotary,
        content: Rotary,
    },
    {
        label: TAB_LABELS.console,
        content: Console,
    },
];

const Tools = () => {
    const rotary = useWidgetState('rotary');
    const { spindleFunctions, coolantFunctions, atcEnabled } =
        useWorkspaceState();
    const { toolsTabPlugins } = usePlugins();
    const atcReport = useTypedSelector(
        (state: RootState) => state.controller.settings.info?.NEWOPT?.ATC,
    );

    const pluginTabs = useMemo(() => {
        return toolsTabPlugins.flatMap((plugin: PluginRecord) => {
            const contribution = plugin.contributions.find(
                (c) => c.slot === 'tools-tab',
            );
            if (!contribution) {
                return [];
            }

            const label = contribution.label || plugin.name;
            const TabContent = ({ isActive }: { isActive: boolean }) => (
                <PluginTabPanel plugin={plugin} isActive={isActive} />
            );

            return [{ label, content: TabContent }];
        });
    }, [toolsTabPlugins]);

    const atcEnabledOrCompiled = atcEnabled || atcReport === '1';

    const filteredTabs = useMemo(
        () =>
            [...tabs, ...pluginTabs].filter((tab) => {
                if (tab.label === TAB_LABELS.rotary && !rotary.tab.show) {
                    return false;
                }

                if (
                    tab.label === TAB_LABELS.spindleLaser &&
                    !spindleFunctions
                ) {
                    return false;
                }
                if (tab.label === TAB_LABELS.atc && !atcEnabledOrCompiled) {
                    return false;
                }

                if (tab.label === TAB_LABELS.coolant && !coolantFunctions) {
                    return false;
                }

                return true;
            }),
        [
            pluginTabs,
            rotary.tab.show,
            spindleFunctions,
            atcEnabledOrCompiled,
            coolantFunctions,
        ],
    );

    return (
        <Widget>
            <Widget.Content>
                <Tabs items={filteredTabs as TabItem[]} />
            </Widget.Content>
        </Widget>
    );
};

export default Tools;

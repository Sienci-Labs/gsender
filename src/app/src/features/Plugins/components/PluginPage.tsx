import Page from 'app/components/Page';
import combokeys from 'app/lib/combokeys';
import {
    holdShortcuts,
    unholdShortcuts,
} from 'app/store/redux/slices/preferences.slice';
import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import { usePlugins } from '../hooks/usePlugins';
import PluginPanel from './PluginPanel';

const PluginPage = () => {
    const { pluginRoute = '' } = useParams();
    const { plugins, loading } = usePlugins();
    const dispatch = useDispatch();

    const plugin = useMemo(() => {
        return plugins.find(
            (p) =>
                p.enabled &&
                p.valid &&
                p.contributions.some(
                    (c) => c.slot === 'tools-page' && c.route === pluginRoute,
                ),
        );
    }, [plugins, pluginRoute]);

    useEffect(() => {
        dispatch(holdShortcuts());
        combokeys.reload();

        return () => {
            dispatch(unholdShortcuts());
            combokeys.reload();
        };
    }, [plugin]);

    if (loading) {
        return (
            <Page title="Plugin" withGoBackButton>
                <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col gap-2 justify-center items-center h-full">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </Page>
        );
    }

    if (!plugin) {
        return (
            <Page title="Plugin" withGoBackButton>
                <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-content-secondary">
                        Plugin not found or disabled. Install plugins to{' '}
                        <code className="text-sm">plugins</code> folder and
                        restart gSender.
                    </p>
                </div>
            </Page>
        );
    }

    const contribution = plugin.contributions.find(
        (c) => c.slot === 'tools-page',
    );

    return (
        <Page title={contribution?.label || plugin.name} withGoBackButton>
            <PluginPanel plugin={plugin} className="h-full" />
        </Page>
    );
};

export default PluginPage;

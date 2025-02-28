import { useLocation, useNavigate, redirect } from '@tanstack/react-router';

import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import store from 'app/store';
import { toggleAllShortcuts } from 'app/store/redux/slices/keyboardShortcutsSlice';
import { useEffect } from 'react';
import { useRegisterShortcuts } from '../features/Keyboard/useRegisterShortcuts';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { WORKSPACE_MODE } from 'app/constants';

type WorkspaceProps = {
    children: React.ReactNode;
};

const Workspace = ({ children }: WorkspaceProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.log('CALLED NAV');
        console.log(location);
        const { href } = location;
        if (href === '/#/remote') {
            console.log('MATCHED');
            redirect({
                to: '/remote',
                throw: true,
            });
        }
    }, [location]);

    useRegisterShortcuts([
        {
            id: 'unlock-machine',
            title: 'Unlock Machine',
            description: 'Unlock the machine',
            defaultKeys: '$',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('unlock');
            },
        },
        {
            id: 'soft-reset-machine',
            title: 'Soft Reset Machine',
            description: 'Soft reset the machine',
            defaultKeys: '%',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('reset');
            },
        },
        {
            id: 'browser-cut',
            title: 'Cut',
            description: 'Cut selected content to clipboard',
            defaultKeys: 'ctrl+x',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                if (typeof window === 'undefined') return;
                try {
                    navigator.clipboard.writeText(
                        window.getSelection()?.toString() || '',
                    );
                    window.getSelection()?.deleteFromDocument();
                } catch (error) {
                    console.error(error);
                }
            },
        },
        {
            id: 'browser-copy',
            title: 'Copy',
            description: 'Copy selected content to clipboard',
            defaultKeys: 'ctrl+c',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                if (typeof window === 'undefined') return;
                try {
                    navigator.clipboard.writeText(
                        window.getSelection()?.toString() || '',
                    );
                } catch (error) {
                    console.error(error);
                }
            },
        },
        {
            id: 'browser-paste',
            title: 'Paste',
            description: 'Paste content from clipboard',
            defaultKeys: 'ctrl+v',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                try {
                    navigator.clipboard.readText().then((text) => {
                        document.execCommand('insertText', false, text);
                    });
                } catch (error) {
                    console.error(error);
                }
            },
        },
        {
            id: 'undo',
            title: 'Undo',
            description: 'Undo the last action',
            defaultKeys: 'ctrl+z',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                document.execCommand('undo');
            },
        },
        {
            id: 'toggle-shortcuts',
            title: 'Toggle Shortcuts',
            description: 'Enable or disable all keyboard shortcuts',
            defaultKeys: '^',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                reduxStore.dispatch(toggleAllShortcuts());
            },
        },
        {
            id: 'realtime-report',
            title: 'Realtime Report',
            description: 'Request realtime status report from grblHAL',
            defaultKeys: '`',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('realtime_report');
            },
        },
        {
            id: 'error-clear',
            title: 'Clear Errors',
            description: 'Clear all error messages',
            defaultKeys: '*',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('error_clear');
            },
        },
        {
            id: 'toolchange-acknowledge',
            title: 'Acknowledge Tool Change',
            description: 'Confirm tool change operation',
            defaultKeys: 'ctrl+alt+meta+a',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('toolchange:acknowledge');
            },
        },
        {
            id: 'virtual-stop-toggle',
            title: 'Toggle Virtual Stop',
            description: 'Enable or disable virtual stop functionality',
            defaultKeys: 'ctrl+8',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('virtual_stop_toggle');
            },
        },
        {
            id: 'workspace-mode-switch',
            title: 'Switch Workspace Mode',
            description:
                'Toggle between different workspace modes (Default, Rotary, etc.)',
            defaultKeys: 'ctrl+5',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                const currentWorkspaceMode = store.get(
                    'workspace.mode',
                    WORKSPACE_MODE.DEFAULT,
                );
                const workspaceModesList = Object.values(WORKSPACE_MODE);
                const currentWorkspaceModeIndex = workspaceModesList.findIndex(
                    (mode) => mode === currentWorkspaceMode,
                );
                const nextWorkspaceMode =
                    workspaceModesList[currentWorkspaceModeIndex + 1] ??
                    workspaceModesList[0];

                store.replace('workspace.mode', nextWorkspaceMode);
            },
        },
        {
            id: 'page-home',
            title: 'Go to Home Page',
            description: 'Go to the home page',
            defaultKeys: 'f1',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate({ to: '/' });
            },
        },
        {
            id: 'page-stats-info',
            title: 'Go to Stats Info Page',
            description: 'Go to the stats info page',
            defaultKeys: 'f2',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate({ to: '/stats' });
            },
        },
        {
            id: 'page-settings',
            title: 'Go to Settings Page',
            description: 'Go to the settings page',
            defaultKeys: 'f3',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate({ to: '/configuration' });
            },
        },
        {
            id: 'page-tools',
            title: 'Go to Tools Page',
            description: 'Go to the tools page',
            defaultKeys: 'f4',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate({ to: '/tools' });
            },
        },
        {
            id: 'page-squaring',
            title: 'Go to Squaring Page',
            description: 'Go to the squaring page',
            defaultKeys: 'f5',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate({ to: '/squaring' });
            },
        },
        {
            id: 'page-movement-tuning',
            title: 'Go to Movement Tuning Page',
            description: 'Go to the movement tuning page',
            defaultKeys: 'f6',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate({ to: '/movement-tuning' });
            },
        },
        {
            id: 'page-keyboard-shortcuts',
            title: 'Go to Keyboard Shortcuts Page',
            description: 'Go to the keyboard shortcuts page',
            defaultKeys: 'f7',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate({ to: '/keyboard-shortcuts' });
            },
        },
    ]);

    return (
        <div className="flex flex-col h-full">
            <TopBar />
            <div className="flex h-full no-scrollbar ">
                <Sidebar />
                <div className="w-full max-sm:p-4">{children}</div>
            </div>
        </div>
    );
};

export default Workspace;

import { WORKFLOW_STATE_IDLE } from 'app/constants';
import { Config } from 'app/features/Config';
import { SettingsProvider } from 'app/features/Config/utils/SettingsContext';
import controller from 'app/lib/controller';
import { store as reduxStore } from 'app/store/redux';
import cx from 'classnames';
import React, { useEffect, useRef } from 'react';
import { MemoryRouter } from 'react-router';

class ConfigErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            return (
                <div className="p-6 text-red-400 font-mono text-sm overflow-auto h-full">
                    <p className="font-bold text-red-300 mb-2">
                        Config crashed:
                    </p>
                    <p className="mb-2">{this.state.error.message}</p>
                    <pre className="text-xs opacity-70 whitespace-pre-wrap">
                        {this.state.error.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// Kept mounted (hidden) after the first visit so switching tabs doesn't tear
// down and rebuild every settings row
export default function PendantConfigView({ active }: { active: boolean }) {
    const firstActivation = useRef(true);

    // Config queries $$ when it mounts; refresh again on each later return so
    // values changed elsewhere (console, wizards) show up
    useEffect(() => {
        if (!active) {
            return;
        }
        if (firstActivation.current) {
            firstActivation.current = false;
            return;
        }
        const state = reduxStore.getState();
        if (
            state.connection.isConnected &&
            state.controller.workflow.state === WORKFLOW_STATE_IDLE
        ) {
            controller.command('gcode', ['$$']);
        }
    }, [active]);

    return (
        // Hidden here, outside the boundary, so a crash message stays with the
        // tab rather than showing over the carve screen
        <div
            className={cx(
                'pendant-config flex-1 overflow-hidden',
                !active && 'hidden',
            )}
        >
            <ConfigErrorBoundary>
                <MemoryRouter>
                    <SettingsProvider>
                        <Config showMenu={false} />
                    </SettingsProvider>
                </MemoryRouter>
            </ConfigErrorBoundary>
        </div>
    );
}

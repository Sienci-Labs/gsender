import React from 'react';
import { MemoryRouter } from 'react-router';
import { SettingsProvider } from 'app/features/Config/utils/SettingsContext';
import { Config } from 'app/features/Config';

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
                    <p className="font-bold text-red-300 mb-2">Config crashed:</p>
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

export default function PendantConfigView() {
    return (
        <ConfigErrorBoundary>
            <MemoryRouter>
                <SettingsProvider>
                    <div className="pendant-config flex-1 overflow-hidden [&>div>div:first-child]:!hidden">
                        <Config />
                    </div>
                </SettingsProvider>
            </MemoryRouter>
        </ConfigErrorBoundary>
    );
}

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface OffsetManagement {
    probeNewOffset: number;
    useToolOffset: number;
    verifyToolLength: number;
}

export interface ToolRack {
    enabled: number;
    numberOfRacks: number;
    offsetManagement: OffsetManagement;
}

export interface Advanced {
    checkPressure: number;
    checkToolPresence: number;
}

export interface ConfigState {
    offsetManagement: OffsetManagement;
    toolRack: ToolRack;
    advanced: Advanced;
}

const defaultConfig: ConfigState = {
    offsetManagement: {
        probeNewOffset: 0,
        useToolOffset: 0,
        verifyToolLength: 0,
    },
    toolRack: {
        enabled: 0,
        numberOfRacks: 1,
        offsetManagement: {
            probeNewOffset: 0,
            useToolOffset: 0,
            verifyToolLength: 0,
        },
    },
    advanced: {
        checkPressure: 0,
        checkToolPresence: 0,
    },
};

interface ConfigContextValue {
    config: ConfigState;
    updateConfig: (updates: Partial<ConfigState>) => void;
    updatePosition: (
        path:
            | 'toolLengthSensorPosition'
            | 'manualToolLoadPosition'
            | 'toolRack.slot1Position',
        position: Position,
    ) => void;
    applyConfig: () => Promise<void>;
    useCurrent: (path: string) => void;
    isApplying: boolean;
    progress: number;
    status: {
        type: 'idle' | 'success' | 'error' | 'warning';
        message: string;
    };
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

interface ConfigProviderProps {
    children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
    const [config, setConfig] = useState<ConfigState>(defaultConfig);
    const [isApplying, setIsApplying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<{
        type: 'idle' | 'success' | 'error' | 'warning';
        message: string;
    }>({ type: 'idle', message: '' });

    const updateConfig = (updates: Partial<ConfigState>) => {
        setConfig((prev) => ({
            ...prev,
            ...updates,
        }));
        console.log(config);
    };

    const updatePosition = (
        path:
            | 'toolLengthSensorPosition'
            | 'manualToolLoadPosition'
            | 'toolRack.slot1Position',
        position: Position,
    ) => {
        if (path.includes('.')) {
            const [section, key] = path.split('.');
            setConfig((prev) => ({
                ...prev,
                [section]: {
                    ...prev[section as keyof ConfigState],
                    [key]: position,
                },
            }));
        } else {
            setConfig((prev) => ({
                ...prev,
                [path]: position,
            }));
        }
    };

    const applyConfig = async () => {
        setIsApplying(true);
        setProgress(0);
        setStatus({ type: 'idle', message: 'Applying configuration...' });

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            setProgress(i);
        }

        setIsApplying(false);
        setStatus({
            type: 'success',
            message: 'Configuration applied successfully!',
        });

        setTimeout(() => {
            setStatus({ type: 'idle', message: '' });
        }, 3000);
    };

    const useCurrent = (path: string) => {
        // Mock current position
        const mockCurrentPosition: Position = {
            x: Math.random() * 1000,
            y: Math.random() * -100,
            z: Math.random() * -200,
        };

        updatePosition(path as any, mockCurrentPosition);
        setStatus({
            type: 'success',
            message: `Current position captured for ${path}`,
        });

        setTimeout(() => {
            setStatus({ type: 'idle', message: '' });
        }, 2000);
    };

    const value: ConfigContextValue = {
        config,
        updateConfig,
        updatePosition,
        applyConfig,
        useCurrent,
        isApplying,
        progress,
        status,
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfigContext = (): ConfigContextValue => {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error(
            'useConfigContext must be used within a ConfigProvider',
        );
    }
    return context;
};

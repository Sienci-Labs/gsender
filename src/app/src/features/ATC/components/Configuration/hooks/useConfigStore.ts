import { useState } from 'react';

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface ConfigState {
    toolLengthSensorPosition: Position;
    manualToolLoadPosition: Position;
    offsetManagement: {
        probeNewOffset: number;
        useToolOffset: number;
        verifyToolLength: number;
    };
    toolRack: {
        enabled: number;
        numberOfRacks: number;
        slot1Position: Position;
        offsetManagement: {
            probeNewOffset: number;
            useToolOffset: number;
            verifyToolLength: number;
        };
    };
    advanced: {
        checkPressure: number;
        checkToolPresence: number;
    };
}

const defaultConfig: ConfigState = {
    toolLengthSensorPosition: { x: 625.7, y: -27.4, z: -175.4 },
    manualToolLoadPosition: { x: 625.7, y: -27.4, z: -175.4 },
    offsetManagement: {
        probeNewOffset: 1,
        useToolOffset: 0,
        verifyToolLength: 0,
    },
    toolRack: {
        enabled: 1,
        numberOfRacks: 8,
        slot1Position: { x: 625.7, y: -27.4, z: -175.4 },
        offsetManagement: {
            probeNewOffset: 1,
            useToolOffset: 1,
            verifyToolLength: 0,
        },
    },
    advanced: {
        checkPressure: 1,
        checkToolPresence: 1,
    },
};

export const useConfigStore = () => {
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

    return {
        config,
        updateConfig,
        updatePosition,
        applyConfig,
        useCurrent,
        isApplying,
        progress,
        status,
    };
};

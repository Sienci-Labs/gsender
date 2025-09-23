import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from 'react';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import get from 'lodash/get';
import pick from 'lodash/pick';
import mapValues from 'lodash/mapValues';
import { ATCIMacroConfig } from 'app/features/ATC/assets/defaultATCIMacros.ts';
import store from 'app/store';
import { generateAllMacros } from 'app/features/ATC/components/Configuration/utils/ConfigUtils.ts';

export const defaultPosition: Position = {
    x: 0,
    y: 0,
    z: 0,
};

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

export interface ToolRack extends OffsetManagement {
    enabled: number;
    numberOfSlots: number;
    retainToolSettings: number;
    slotOffset: number;
}

export interface Advanced {
    checkPressure: number;
    checkToolPresence: number;
}

export interface ConfigState {
    offsetManagement: OffsetManagement;
    toolRack: ToolRack;
    advanced: Advanced;
    tlsPosition: Position;
    manualLoadPosition: Position;
    slot1Position: Position;
}

export const defaultATCIConfig: ConfigState = {
    offsetManagement: {
        probeNewOffset: 0,
        useToolOffset: 0,
        verifyToolLength: 0,
    },
    toolRack: {
        enabled: 1,
        numberOfSlots: 8,
        probeNewOffset: 0,
        useToolOffset: 0,
        verifyToolLength: 0,
        slotOffset: 0,
        retainToolSettings: 0,
    },
    advanced: {
        checkPressure: 0,
        checkToolPresence: 0,
    },
    manualLoadPosition: defaultPosition,
    tlsPosition: defaultPosition,
    slot1Position: defaultPosition,
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
    setWorkspacePosition: (workspace: string) => void;
    isApplying: boolean;
    progress: number;
    status: {
        type: 'idle' | 'success' | 'error' | 'warning';
        message: string;
    };
    templates: ATCIMacroConfig;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

interface ConfigProviderProps {
    children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
    const [config, setConfig] = useState<ConfigState>(defaultATCIConfig);
    const [templates, setTemplates] = useState<ATCIMacroConfig>();
    const [isApplying, setIsApplying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<{
        type: 'idle' | 'success' | 'error' | 'warning';
        message: string;
    }>({ type: 'idle', message: '' });

    const offsetParameters = useTypedSelector(
        (state: RootState) => state.controller.settings.parameters,
    );

    useEffect(() => {
        setTemplates(store.get('widgets.atc.templates', {}));
    }, []);

    useEffect(() => {
        if (!offsetParameters) return;

        const pickedParams = mapValues(offsetParameters, (param) =>
            pick(param, ['x', 'y', 'z']),
        );
        const tlsPosition: Position = get(
            pickedParams,
            'G59.1',
            defaultPosition,
        ) as Position;
        const manualLoadPosition: Position = get(
            pickedParams,
            'G59.2',
            defaultPosition,
        ) as Position;
        const slot1Position: Position = get(
            pickedParams,
            'G59.3',
            defaultPosition,
        ) as Position;

        setConfig((prev) => ({
            ...prev,
            tlsPosition,
            manualLoadPosition,
            slot1Position,
        }));
    }, [offsetParameters]);

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

        const content = generateAllMacros(config);
        console.log(content);
        // todo: upload the whole block of content to the controller

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

    const setWorkspacePosition = (workspace: string) => {
        controller.command('gcode', [`G10 L20 ${workspace} X0 Y0 Z0`, '$#']);
    };

    const value: ConfigContextValue = {
        config,
        updateConfig,
        updatePosition,
        applyConfig,
        setWorkspacePosition,
        isApplying,
        progress,
        status,
        templates,
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

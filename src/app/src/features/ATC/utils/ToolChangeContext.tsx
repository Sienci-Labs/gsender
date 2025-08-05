import React, { createContext, useEffect, useState } from 'react';
import {
    LoadToolMode,
    mapToolNicknamesAndStatus,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';

export const ToolChangeContext = createContext<IToolChangeContext>({
    mode: 'load',
    loadToolOpen: false,
    setLoadToolOpen: () => {},
    setLoadToolMode: () => {},
    disabled: false,
    connected: false,
    tools: [],
    showTable: false,
    setShowTable: () => {},
});

export function useToolChange() {
    const context = React.useContext(ToolChangeContext);
    if (!context) {
        console.error('useToolChange must be used within SettingsContext');
    }
    return context;
}

export interface IToolChangeContext {
    mode: LoadToolMode;
    setLoadToolMode: (mode: LoadToolMode) => void;
    loadToolOpen: boolean;
    setLoadToolOpen: (open: boolean) => void;
    disabled: boolean;
    connected: boolean;
    tools: ToolInstance[];
    showTable: boolean;
    setShowTable: (show: boolean) => void;
}

export const ToolchangeProvider = ({ children }) => {
    const [loadToolMode, setLoadToolMode] = useState<LoadToolMode>('load');
    const [toolPopoutOpen, setToolPopoutOpen] = useState<boolean>(false);
    const [tools, setTools] = useState<ToolInstance[]>([]);
    const [showTable, setShowTable] = useState<boolean>(false);
    const [connected, setConnected] = useState<boolean>(false);

    const toolTableData = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    console.log(isConnected, 'connection');

    useEffect(() => {
        setTools(mapToolNicknamesAndStatus(toolTableData));
    }, [toolTableData]);

    useEffect(() => {
        console.log(`updating connection state to ${isConnected}`);
        setConnected(isConnected);
    }, [isConnected]);

    const payload = {
        mode: loadToolMode,
        loadToolOpen: toolPopoutOpen,
        setLoadToolOpen: setToolPopoutOpen,
        setLoadToolMode: setLoadToolMode,
        disabled: !connected,
        connected,
        tools: tools,
        showTable: showTable,
        setShowTable: setShowTable,
    };

    return (
        <ToolChangeContext.Provider value={payload}>
            {children}
        </ToolChangeContext.Provider>
    );
};

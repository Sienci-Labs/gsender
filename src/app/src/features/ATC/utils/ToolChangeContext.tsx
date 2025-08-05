import { createContext, useEffect, useState } from 'react';
import {
    LoadToolMode,
    mapToolNicknamesAndStatus,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';

const ToolChangeContext = createContext<IToolChangeContext>({
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

    const toolTableData = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    useEffect(() => {
        setTools(mapToolNicknamesAndStatus(toolTableData));
    }, [toolTableData]);

    const payload = {
        mode: loadToolMode,
        loadToolOpen: toolPopoutOpen,
        setLoadToolOpen: setToolPopoutOpen,
        setLoadToolMode: setLoadToolMode,
        disabled: !isConnected,
        connected: isConnected,
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

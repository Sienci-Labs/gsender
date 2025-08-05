import { createContext } from 'react';

const ToolChangeContext = createContext({});

const ToolchangeProvider = ({ children }) => {
    const payload = {};
    return (
        <ToolChangeContext.Provider value={payload}>
            {children}
        </ToolChangeContext.Provider>
    );
};

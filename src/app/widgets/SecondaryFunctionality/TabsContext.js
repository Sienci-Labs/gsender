import { createContext } from 'react';

const TabsContext = createContext({
    currentDropdownTab: 'Coolant',
    updateDropdownTab: () => {}
});

export const TabsProvider = TabsContext.Provider;
export const TabsConsumer = TabsContext.Consumer;

export default TabsContext;

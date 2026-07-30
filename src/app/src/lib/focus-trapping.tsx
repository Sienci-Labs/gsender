import { createContext, useContext, type ReactNode } from 'react';

const FocusTrappingContext = createContext<boolean>(true);

export function FocusTrappingProvider({
    value,
    children,
}: {
    value: boolean;
    children: ReactNode;
}) {
    return (
        <FocusTrappingContext.Provider value={value}>
            {children}
        </FocusTrappingContext.Provider>
    );
}

export function useFocusTrapping(): boolean {
    return useContext(FocusTrappingContext);
}

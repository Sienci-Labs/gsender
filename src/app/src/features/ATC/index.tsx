import { ToolchangeProvider } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ATC } from 'app/features/ATC/ATC.tsx';

export function ATCWidget() {
    return (
        <ToolchangeProvider>
            <ATC />
        </ToolchangeProvider>
    );
}

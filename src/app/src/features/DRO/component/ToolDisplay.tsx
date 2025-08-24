import { useTypedSelector } from 'app/hooks/useTypedSelector';
import get from 'lodash/get';

export function ToolDisplay() {
    const currentTool = useTypedSelector((state) =>
        get(state, 'controller.tool.currentTool')
    );
    const isConnected = useTypedSelector((state) =>
        get(state, 'connection.isConnected', false)
    );

    const displayValue = isConnected && currentTool !== undefined ? `T${currentTool}` : '--';

    return (
        <div className="absolute -top-2 -right-1 max-xl:-top-1 max-xl:-right-1 px-2 max-xl:px-1 py-1.5 max-xl:py-1 text-xs font-semibold text-gray-600 bg-gray-300 rounded-tr items-center text-center rounded-bl-lg dark:bg-gray-700 dark:text-gray-400">
            <span>
                Tool:
                <br /> <span className="text-blue-500 text-sm font-bold">{displayValue}</span>
            </span>
        </div>
    );
}